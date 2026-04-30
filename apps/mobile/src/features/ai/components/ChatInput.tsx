import { View, TextInput, Pressable } from 'react-native';
import { Icon } from '@/shared/components/ui/icon';
import { Send } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { VoiceInputButton } from './VoiceInputButton';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (text?: string) => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const { t, locale } = useTranslation('features.ai');
  const voiceLang = locale?.startsWith('es') ? 'es-ES' : 'en-US';
  const canSend = !!value.trim() && !disabled;

  return (
    <View className="border-t border-border px-4 py-3">
      <View className="flex-row items-end gap-2">
        <View className="min-h-[44px] flex-1 flex-row items-center rounded-2xl border border-border bg-card px-4">
          <TextInput
            className="max-h-24 flex-1 py-2.5 text-sm text-foreground"
            placeholder={t('askAnything')}
            placeholderTextColor="hsl(210, 10%, 55%)"
            value={value}
            onChangeText={onChange}
            multiline
            onSubmitEditing={() => onSend()}
          />
        </View>
        <VoiceInputButton
          lang={voiceLang}
          onInterim={(text) => onChange(text)}
          onTranscript={(text) => {
            onChange('');
            onSend(text);
          }}
        />
        <Pressable
          className={cn(
            'h-11 w-11 items-center justify-center rounded-full',
            canSend ? 'bg-primary active:bg-primary-hover' : 'bg-muted'
          )}
          onPress={() => onSend()}
          disabled={!canSend}
        >
          <Icon
            as={Send}
            size={16}
            className={canSend ? 'text-primary-foreground' : 'text-muted-foreground'}
          />
        </Pressable>
      </View>
    </View>
  );
}
