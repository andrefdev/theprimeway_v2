import { View, Pressable } from 'react-native';
import { Icon } from '@/shared/components/ui/icon';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react-native';

interface Props {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function PomodoroControls({ isRunning, onToggle, onReset, onSkip }: Props) {
  return (
    <View className="flex-row items-center gap-6">
      <Pressable
        className="h-12 w-12 items-center justify-center rounded-full bg-muted active:bg-border"
        onPress={onReset}
        accessibilityLabel="Reset"
      >
        <Icon as={RotateCcw} size={20} className="text-foreground" />
      </Pressable>

      <Pressable
        className="h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:bg-primary-hover"
        onPress={onToggle}
        accessibilityLabel={isRunning ? 'Pause' : 'Start'}
      >
        <Icon
          as={isRunning ? Pause : Play}
          size={28}
          className="text-primary-foreground"
        />
      </Pressable>

      <Pressable
        className="h-12 w-12 items-center justify-center rounded-full bg-muted active:bg-border"
        onPress={onSkip}
        accessibilityLabel="Skip"
      >
        <Icon as={SkipForward} size={20} className="text-foreground" />
      </Pressable>
    </View>
  );
}
