import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { PageHeader } from '@features/personalization/components/PageHeader';
import {
  Send,
  Sparkles,
  BarChart3,
  Target,
  CheckSquare,
  Lightbulb,
  TrendingUp,
  Wrench,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/shared/stores/authStore';
import { FeatureGate } from '@/features/feature-flags/FeatureGate';
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt';
import { FEATURES } from '@repo/shared/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

// SSE chunk shapes emitted by the Vercel AI SDK on the backend
type SseChunk =
  | { type: 'text-delta'; textDelta: string }
  | { type: 'tool-call'; toolCallId?: string; toolName: string; args: Record<string, unknown> }
  | { type: 'tool-result'; toolCallId?: string; toolName: string; result: unknown }
  | { type: 'finish' | 'error' | string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTION_KEYS = [
  { icon: BarChart3, key: 'analyzeFinances' },
  { icon: Target, key: 'reviewGoals' },
  { icon: CheckSquare, key: 'planWeek' },
  { icon: Lightbulb, key: 'productivityTips' },
  { icon: TrendingUp, key: 'monthlyReport' },
] as const;

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  budget_analysis: 'Budget Analysis',
  debt_tracking: 'Debt Tracking',
  financial_summary: 'Financial Summary',
  goal_insights: 'Goal Insights',
  savings_goals: 'Savings Goals',
  task_analysis: 'Task Analysis',
};

function formatToolName(toolName: string): string {
  return (
    TOOL_DISPLAY_NAMES[toolName] ??
    toolName
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

// ---------------------------------------------------------------------------
// ToolCallCard component
// ---------------------------------------------------------------------------

interface ToolCallCardProps {
  toolCall: ToolCall;
}

function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasResult = toolCall.result !== undefined;

  return (
    <View className="mt-2 overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
      {/* Header row */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center gap-2 px-3 py-2 active:bg-primary/10"
      >
        <Icon as={Wrench} size={12} className="text-primary" />
        <Text className="flex-1 text-xs font-semibold text-primary">
          {formatToolName(toolCall.toolName)}
        </Text>
        {hasResult && (
          <View className="rounded-full bg-primary/20 px-1.5 py-0.5">
            <Text className="text-2xs font-medium text-primary">Done</Text>
          </View>
        )}
        <Icon
          as={expanded ? ChevronDown : ChevronRight}
          size={12}
          className="text-primary/60"
        />
      </Pressable>

      {/* Expanded detail */}
      {expanded && (
        <View className="border-t border-primary/10 px-3 pb-3 pt-2 gap-2">
          {/* Args */}
          {Object.keys(toolCall.args).length > 0 && (
            <View>
              <Text className="mb-1 text-2xs font-medium text-muted-foreground uppercase tracking-wide">
                Input
              </Text>
              <Text className="text-xs text-muted-foreground font-mono">
                {JSON.stringify(toolCall.args, null, 2)}
              </Text>
            </View>
          )}

          {/* Result */}
          {hasResult && (
            <View>
              <Text className="mb-1 text-2xs font-medium text-muted-foreground uppercase tracking-wide">
                Result
              </Text>
              <Text className="text-xs text-foreground font-mono">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

function AiChatScreenContent() {
  const { t } = useTranslation('features.ai');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const threadIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // SSE streaming
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text ?? input.trim();
      if (!messageText || isLoading) return;

      // Cancel any previous in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
      };

      const assistantId = (Date.now() + 1).toString();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolCalls: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setInput('');
      setIsLoading(true);

      // Build the messages array to send (all prior messages + the new user one)
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: messageText },
      ];

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

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Capture thread id from response header if present
        const newThreadId = response.headers.get('x-thread-id');
        if (newThreadId) threadIdRef.current = newThreadId;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        const decoder = new TextDecoder();
        let buffer = '';

        // Local mutable copies so we don't close over stale state
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
              streamedContent += (chunk as { type: 'text-delta'; textDelta: string }).textDelta;

              // Update message content in place
              const content = streamedContent;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content } : m
                )
              );
              scrollRef.current?.scrollToEnd({ animated: false });
            } else if (chunk.type === 'tool-call') {
              const tc = chunk as {
                type: 'tool-call';
                toolName: string;
                args: Record<string, unknown>;
              };
              streamedToolCalls = [
                ...streamedToolCalls,
                { toolName: tc.toolName, args: tc.args ?? {} },
              ];

              const toolCalls = [...streamedToolCalls];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, toolCalls } : m
                )
              );
            } else if (chunk.type === 'tool-result') {
              const tr = chunk as {
                type: 'tool-result';
                toolName: string;
                result: unknown;
              };
              streamedToolCalls = streamedToolCalls.map((tc) =>
                tc.toolName === tr.toolName && tc.result === undefined
                  ? { ...tc, result: tr.result }
                  : tc
              );

              const toolCalls = [...streamedToolCalls];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, toolCalls } : m
                )
              );
            }
          }
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;

        // Replace placeholder with error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: t('error') ?? 'Something went wrong. Please try again.', isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLoading, messages, t]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader sectionId="ai" title={t('title')} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerClassName="py-4 gap-3"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Empty State */}
          {messages.length === 0 && (
            <Animated.View entering={FadeIn.duration(400)} className="items-center pb-4 pt-12">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                <Icon as={Sparkles} size={28} className="text-primary" />
              </View>
              <Text className="mt-4 text-xl font-bold text-foreground">
                {t('chat.emptyTitle')}
              </Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                {t('chat.emptyDescription')}
              </Text>

              {/* Quick Suggestions */}
              <View className="mt-6 w-full gap-2">
                {SUGGESTION_KEYS.map((s, i) => {
                  const label = t(`suggestions.${s.key}`);
                  return (
                    <Animated.View
                      key={s.key}
                      entering={FadeInDown.delay(100 + i * 50).duration(300)}
                    >
                      <Pressable
                        onPress={() => handleSend(label)}
                        className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 active:bg-muted"
                      >
                        <Icon as={s.icon} size={16} className="text-accent" />
                        <Text className="text-sm text-foreground">{label}</Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              entering={FadeIn.duration(200)}
              className={cn(
                'max-w-[85%]',
                msg.role === 'user' ? 'self-end' : 'self-start'
              )}
            >
              {/* Bubble */}
              <View
                className={cn(
                  'rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'rounded-tr-md bg-primary'
                    : 'rounded-tl-md border border-border bg-card'
                )}
              >
                {msg.role === 'assistant' && (
                  <View className="mb-1 flex-row items-center gap-1.5">
                    <Icon as={Sparkles} size={10} className="text-accent" />
                    <Text className="text-2xs font-medium text-accent">{t('primeAI')}</Text>
                  </View>
                )}

                <Text
                  className={cn(
                    'text-sm leading-5',
                    msg.role === 'user'
                      ? 'text-primary-foreground'
                      : 'text-card-foreground'
                  )}
                >
                  {msg.content}
                  {/* Blinking cursor while streaming */}
                  {msg.isStreaming && msg.role === 'assistant' && (
                    <Text className="text-accent animate-pulse"> ▍</Text>
                  )}
                </Text>
              </View>

              {/* Tool Call Cards — rendered below the bubble for assistant messages */}
              {msg.role === 'assistant' &&
                msg.toolCalls &&
                msg.toolCalls.length > 0 && (
                  <View className="mt-1.5 gap-1.5">
                    {msg.toolCalls.map((tc, idx) => (
                      <ToolCallCard key={`${tc.toolName}-${idx}`} toolCall={tc} />
                    ))}
                  </View>
                )}
            </Animated.View>
          ))}

          {/* Typing Indicator — shown only while waiting for the first token */}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.isStreaming &&
            messages[messages.length - 1]?.content === '' && (
              <Animated.View
                entering={FadeIn.duration(200)}
                className="self-start rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3"
              >
                <View className="flex-row gap-1">
                  <View className="h-2 w-2 animate-pulse-soft rounded-full bg-accent" />
                  <View className="h-2 w-2 animate-pulse-soft rounded-full bg-accent/70" />
                  <View className="h-2 w-2 animate-pulse-soft rounded-full bg-accent/40" />
                </View>
              </Animated.View>
            )}
        </ScrollView>

        {/* Input Bar */}
        <View className="border-t border-border px-4 py-3">
          <View className="flex-row items-end gap-2">
            <View className="min-h-[44px] flex-1 flex-row items-center rounded-2xl border border-border bg-card px-4">
              <TextInput
                className="max-h-24 flex-1 py-2.5 text-sm text-foreground"
                placeholder={t('askAnything')}
                placeholderTextColor="hsl(210, 10%, 55%)"
                value={input}
                onChangeText={setInput}
                multiline
                onSubmitEditing={() => handleSend()}
              />
            </View>
            <Pressable
              className={cn(
                'h-11 w-11 items-center justify-center rounded-full',
                input.trim() ? 'bg-primary active:bg-primary-hover' : 'bg-muted'
              )}
              onPress={() => handleSend()}
              disabled={!input.trim() || isLoading}
            >
              <Icon
                as={Send}
                size={16}
                className={input.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function AiChatScreen() {
  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <AiChatScreenContent />
    </FeatureGate>
  );
}
