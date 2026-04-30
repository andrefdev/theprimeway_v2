import { useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@shared/stores/authStore';
import type { ChatMessageData } from '../components/ChatMessage';
import type { ToolCall } from '../components/ToolCallCard';

type SseChunk =
  | { type: 'text-delta'; textDelta: string }
  | { type: 'tool-call'; toolCallId?: string; toolName: string; args: Record<string, unknown> }
  | { type: 'tool-result'; toolCallId?: string; toolName: string; result: unknown }
  | { type: 'finish' | 'error' | string };

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const threadIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessageData = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
      };
      const assistantId = (Date.now() + 1).toString();
      const placeholder: ChatMessageData = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolCalls: [],
        isStreaming: true,
      };

      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      setMessages((prev) => [...prev, userMessage, placeholder]);
      setIsLoading(true);

      try {
        const token = useAuthStore.getState().token;
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: allMessages,
            threadId: threadIdRef.current,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const newThreadId = response.headers.get('x-thread-id');
        if (newThreadId) threadIdRef.current = newThreadId;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let streamedContent = '';
        let streamedToolCalls: ToolCall[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') break;

            let chunk: SseChunk;
            try {
              chunk = JSON.parse(raw) as SseChunk;
            } catch {
              continue;
            }

            if (chunk.type === 'text-delta') {
              streamedContent += (chunk as { textDelta: string }).textDelta;
              const content = streamedContent;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content } : m))
              );
            } else if (chunk.type === 'tool-call') {
              const tc = chunk as { toolName: string; args: Record<string, unknown> };
              streamedToolCalls = [
                ...streamedToolCalls,
                { toolName: tc.toolName, args: tc.args ?? {} },
              ];
              const toolCalls = [...streamedToolCalls];
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls } : m))
              );
            } else if (chunk.type === 'tool-result') {
              const tr = chunk as { toolName: string; result: unknown };
              streamedToolCalls = streamedToolCalls.map((tc) =>
                tc.toolName === tr.toolName && tc.result === undefined
                  ? { ...tc, result: tr.result }
                  : tc
              );
              const toolCalls = [...streamedToolCalls];
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls } : m))
              );
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: 'Something went wrong. Please try again.',
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    threadIdRef.current = null;
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, reset, threadId: threadIdRef.current };
}
