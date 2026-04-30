import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Sparkles } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { ToolCallCard, type ToolCall } from './ToolCallCard';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const { t } = useTranslation('features.ai');
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className={cn('max-w-[85%]', isUser ? 'self-end' : 'self-start')}
    >
      <View
        className={cn(
          'rounded-2xl px-4 py-3',
          isUser
            ? 'rounded-tr-md bg-primary'
            : 'rounded-tl-md border border-border bg-card'
        )}
      >
        {!isUser && (
          <View className="mb-1 flex-row items-center gap-1.5">
            <Icon as={Sparkles} size={10} className="text-accent" />
            <Text className="text-2xs font-medium text-accent">{t('primeAI')}</Text>
          </View>
        )}

        {isUser ? (
          <Text className="text-sm leading-5 text-primary-foreground">
            {message.content}
          </Text>
        ) : (
          <View>
            {message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : null}
            {message.isStreaming && (
              <Text className="text-accent"> ▍</Text>
            )}
          </View>
        )}
      </View>

      {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
        <View className="mt-1.5 gap-1.5">
          {message.toolCalls.map((tc, idx) => (
            <ToolCallCard key={`${tc.toolName}-${idx}`} toolCall={tc} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}
