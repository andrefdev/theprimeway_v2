import { useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@shared/stores/authStore';
import type { ChatMessageData } from '../components/ChatMessage';
import type { ToolCall } from '../components/ToolCallCard';

type SseChunk =
  | { type: 'start'; messageId?: string }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'text-end'; id: string }
  | { type: 'tool-input-start'; toolCallId: string; toolName: string }
  | { type: 'tool-input-delta'; toolCallId: string; inputTextDelta: string }
  | { type: 'tool-input-available'; toolCallId: string; toolName: string; input: Record<string, unknown> }
  | { type: 'tool-output-available'; toolCallId: string; output: unknown }
  | { type: 'finish' | 'error' | string };

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

      const history = messages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: 'text' as const, text: m.content }],
      }));
      const uiMessages = [
        ...history,
        {
          id: userMessage.id,
          role: 'user' as const,
          parts: [{ type: 'text' as const, text }],
        },
      ];

      setMessages((prev) => [...prev, userMessage, placeholder]);
      setIsLoading(true);

      try {
        const token = useAuthStore.getState().token;
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: uiMessages }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let streamedContent = '';
        const toolCallsById = new Map<string, ToolCall>();

        const flushToolCalls = () => {
          const toolCalls = Array.from(toolCallsById.values());
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, toolCalls } : m))
          );
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;

            let chunk: SseChunk;
            try {
              chunk = JSON.parse(raw) as SseChunk;
            } catch {
              continue;
            }

            if (chunk.type === 'text-delta') {
              const c = chunk as { delta: string };
              streamedContent += c.delta ?? '';
              const content = streamedContent;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content } : m))
              );
            } else if (chunk.type === 'tool-input-available') {
              const c = chunk as {
                toolCallId: string;
                toolName: string;
                input: Record<string, unknown>;
              };
              toolCallsById.set(c.toolCallId, {
                toolName: c.toolName,
                args: c.input ?? {},
              });
              flushToolCalls();
            } else if (chunk.type === 'tool-output-available') {
              const c = chunk as { toolCallId: string; output: unknown };
              const existing = toolCallsById.get(c.toolCallId);
              if (existing) {
                toolCallsById.set(c.toolCallId, { ...existing, result: c.output });
                flushToolCalls();
              }
            } else if (chunk.type === 'error') {
              throw new Error('Stream error');
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
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, reset };
}
