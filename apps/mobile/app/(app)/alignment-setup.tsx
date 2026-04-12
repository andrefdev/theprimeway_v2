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
import { Header } from '@/shared/components/layout/Header';
import { Compass, Sparkles, Send, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/shared/stores/authStore';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type Phase = 'vision' | 'pillars' | 'goals' | 'complete';

const INITIAL_MESSAGE: Message = {
  id: 'initial',
  role: 'assistant',
  content:
    "Welcome! I'm your Prime Coach. Let's build your life vision together. Tell me: what does your ideal life look like in 5 years?",
};

const STEPS = [
  { id: 'vision', label: 'Vision', phase: 'vision' as Phase },
  { id: 'pillars', label: 'Pillars', phase: 'pillars' as Phase },
  { id: 'goals', label: 'Goals', phase: 'goals' as Phase },
];

function getPhase(messageCount: number): Phase {
  if (messageCount >= 10) return 'complete';
  if (messageCount >= 9) return 'goals';
  if (messageCount >= 5) return 'pillars';
  return 'vision';
}

function getStepIndex(phase: Phase): number {
  if (phase === 'complete') return 2;
  return STEPS.findIndex((s) => s.phase === phase);
}

export default function AlignmentSetupScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const totalMessages = messages.length;
  const currentPhase = getPhase(totalMessages);
  const showCompleteButton = userMessageCount >= 5 && !isComplete;
  const activeStepIndex = getStepIndex(currentPhase);

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text ?? input.trim();
      if (!messageText || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setIsLoading(true);

      // Scroll to bottom after user message
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const token = useAuthStore.getState().token;
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(`${API_BASE_URL}/api/alignment-setup/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: apiMessages, action: 'chat' }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to fetch alignment response');
        }

        // Stream SSE response
        const assistantId = (Date.now() + 1).toString();
        let accumulated = '';

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const delta =
                  parsed?.choices?.[0]?.delta?.content ??
                  parsed?.delta?.text ??
                  parsed?.text ??
                  '';
                if (delta) {
                  accumulated += delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: accumulated } : m
                    )
                  );
                  scrollRef.current?.scrollToEnd({ animated: false });
                }
              } catch {
                // skip malformed JSON chunks
              }
            }
          }
        }

        // If nothing was streamed, use a fallback
        if (!accumulated) {
          const fallback = getFallbackResponse(totalMessages);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fallback } : m
            )
          );
        }
      } catch {
        // Fallback to a coaching response on error
        const fallback = getFallbackResponse(totalMessages);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: fallback,
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [input, isLoading, messages, totalMessages]
  );

  const handleCompleteSetup = () => {
    setIsComplete(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleGoToGoals = () => {
    router.replace('/(app)/(tabs)/goals');
  };

  if (isComplete) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <Header title="Vision Alignment" showBack rightAction={<Icon as={Compass} size={20} className="text-primary" />} />
        <Animated.View
          entering={FadeIn.duration(500)}
          className="flex-1 items-center justify-center px-6"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <Icon as={CheckCircle} size={40} className="text-primary" />
          </View>
          <Text className="mt-6 text-center text-2xl font-bold text-foreground">
            Vision Aligned!
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-muted-foreground">
            Your life vision, pillars, and goals have been defined. Time to put
            your alignment into action.
          </Text>
          <Pressable
            onPress={handleGoToGoals}
            className="mt-8 w-full rounded-2xl bg-primary px-6 py-4 active:bg-primary/90"
          >
            <Text className="text-center text-base font-semibold text-primary-foreground">
              Go to My Goals
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            className="mt-3 w-full rounded-2xl px-6 py-3"
          >
            <Text className="text-center text-sm text-muted-foreground">
              Return to Dashboard
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <Header
        title="Vision Alignment"
        showBack
        rightAction={<Icon as={Compass} size={20} className="text-primary" />}
      />

      {/* Subtitle */}
      <View className="px-4 pb-2">
        <Text className="text-center text-xs text-muted-foreground">
          Let our AI coach guide you to define your life vision
        </Text>
      </View>

      {/* Step Indicator */}
      <View className="flex-row items-center justify-center gap-0 px-4 py-3">
        {STEPS.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isDone = index < activeStepIndex;
          return (
            <View key={step.id} className="flex-1 flex-row items-center">
              <View className="flex-1 items-center gap-1">
                <View
                  className={cn(
                    'h-6 w-6 items-center justify-center rounded-full border',
                    isActive
                      ? 'border-primary bg-primary'
                      : isDone
                        ? 'border-primary bg-primary/30'
                        : 'border-border bg-muted'
                  )}
                >
                  <Text
                    className={cn(
                      'text-[10px] font-bold',
                      isActive || isDone ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </Text>
              </View>
              {index < STEPS.length - 1 && (
                <View
                  className={cn(
                    'mb-4 h-px flex-1',
                    isDone ? 'bg-primary/50' : 'bg-border'
                  )}
                />
              )}
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerClassName="py-3 gap-3"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <Animated.View
              key={msg.id}
              entering={FadeInDown.delay(index === 0 ? 0 : 100).duration(300)}
              className={cn(
                'max-w-[85%]',
                msg.role === 'user' ? 'self-end' : 'self-start'
              )}
            >
              {msg.role === 'assistant' && (
                <View className="mb-1 flex-row items-center gap-1.5 pl-1">
                  <Icon as={Compass} size={10} className="text-primary" />
                  <Text className="text-2xs font-medium text-primary">Prime Coach</Text>
                </View>
              )}
              <View
                className={cn(
                  'rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'rounded-tr-md bg-primary'
                    : 'rounded-tl-md border border-primary/20 bg-primary/5'
                )}
              >
                <Text
                  className={cn(
                    'text-sm leading-5',
                    msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {msg.content}
                </Text>
              </View>
            </Animated.View>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="self-start rounded-2xl rounded-tl-md border border-primary/20 bg-primary/5 px-4 py-3"
            >
              <View className="flex-row gap-1">
                <View className="h-2 w-2 animate-pulse-soft rounded-full bg-primary" />
                <View className="h-2 w-2 animate-pulse-soft rounded-full bg-primary/70" />
                <View className="h-2 w-2 animate-pulse-soft rounded-full bg-primary/40" />
              </View>
            </Animated.View>
          )}

          {/* Complete Setup Button (after 5 exchanges) */}
          {showCompleteButton && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              className="mt-2 items-center"
            >
              <Pressable
                onPress={handleCompleteSetup}
                className="flex-row items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 active:bg-primary/20"
              >
                <Icon as={CheckCircle} size={16} className="text-primary" />
                <Text className="text-sm font-semibold text-primary">Apply Alignment</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View className="border-t border-border px-4 py-3">
          <View className="flex-row items-end gap-2">
            <View className="min-h-[44px] flex-1 flex-row items-center rounded-2xl border border-border bg-card px-4">
              <TextInput
                className="max-h-24 flex-1 py-2.5 text-sm text-foreground"
                placeholder="Share your thoughts..."
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
                input.trim() ? 'bg-primary active:bg-primary/90' : 'bg-muted'
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
          <View className="mt-2 flex-row items-center justify-center gap-1.5">
            <Icon as={Sparkles} size={10} className="text-muted-foreground" />
            <Text className="text-[10px] text-muted-foreground">
              AI-powered coaching — {userMessageCount} exchanges
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Returns a contextual fallback coaching response based on the conversation stage.
 */
function getFallbackResponse(totalMessages: number): string {
  if (totalMessages <= 2) {
    return "That's a powerful vision. Now, let's think about the core pillars that support that life — areas like health, relationships, career, finances, and personal growth. Which of these feels most out of alignment right now?";
  }
  if (totalMessages <= 4) {
    return "I love how you're thinking about this. What would need to be true in the next 90 days for you to feel real momentum toward that vision? Let's get specific about one area.";
  }
  if (totalMessages <= 6) {
    return "Excellent. Now let's talk about your life pillars — the key areas you want to develop. On a scale of 1–10, where are you right now in each area, and where do you want to be?";
  }
  if (totalMessages <= 8) {
    return "Great self-awareness. Let's translate this into concrete quarterly goals. What is the single most important outcome you want to achieve in the next 3 months that would move you closer to your vision?";
  }
  return "You've done incredible work defining your vision and goals. Your alignment is taking shape — you're one step closer to living your Prime life. Ready to lock this in?";
}
