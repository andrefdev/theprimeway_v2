import { ScrollView, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRef, useState } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import {
  Sparkles,
  BarChart3,
  Target,
  CheckSquare,
  Lightbulb,
  TrendingUp,
} from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatStream } from '../hooks/useChatStream';

const SUGGESTION_KEYS = [
  { icon: BarChart3, key: 'analyzeFinances' },
  { icon: Target, key: 'reviewGoals' },
  { icon: CheckSquare, key: 'planWeek' },
  { icon: Lightbulb, key: 'productivityTips' },
  { icon: TrendingUp, key: 'monthlyReport' },
] as const;

export function ChatPanel() {
  const { t } = useTranslation('features.ai');
  const { messages, isLoading, sendMessage } = useChatStream();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = (text?: string) => {
    const value = text ?? input;
    if (!value.trim()) return;
    setInput('');
    sendMessage(value);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    isLoading && lastMessage?.isStreaming && lastMessage?.content === '';

  return (
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
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
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

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {showTypingIndicator && (
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

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isLoading}
      />
    </KeyboardAvoidingView>
  );
}
