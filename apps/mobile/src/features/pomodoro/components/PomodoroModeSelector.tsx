import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/hooks/useTranslation';

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

const MODE_LABEL_KEYS: Record<PomodoroMode, string> = {
  focus: 'modes.work',
  short_break: 'modes.shortBreak',
  long_break: 'modes.longBreak',
};

interface Props {
  mode: PomodoroMode;
  onChange: (mode: PomodoroMode) => void;
}

export function PomodoroModeSelector({ mode, onChange }: Props) {
  const { t } = useTranslation('features.pomodoro');
  const modes = Object.keys(MODE_LABEL_KEYS) as PomodoroMode[];
  return (
    <View className="flex-row gap-2">
      {modes.map((m) => (
        <Pressable
          key={m}
          className={cn(
            'rounded-full px-4 py-2',
            mode === m ? 'bg-primary' : 'bg-muted'
          )}
          onPress={() => onChange(m)}
        >
          <Text
            className={cn(
              'text-xs font-medium',
              mode === m ? 'text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            {t(MODE_LABEL_KEYS[m])}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
