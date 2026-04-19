import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff } from 'lucide-react-native';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  lang?: string;
  size?: number;
  className?: string;
}

export function VoiceInputButton({
  onTranscript,
  onInterim,
  lang,
  size = 44,
  className,
}: VoiceInputButtonProps) {
  const { isListening, transcript, toggle, error } = useVoiceInput({
    lang,
    onFinalTranscript: onTranscript,
  });

  useEffect(() => {
    if (isListening && transcript) onInterim?.(transcript);
  }, [isListening, transcript, onInterim]);

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(withTiming(1.25, { duration: 600 }), -1, true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View className={className}>
      <Pressable
        onPress={toggle}
        hitSlop={6}
        style={{ width: size, height: size }}
        className={cn(
          'items-center justify-center rounded-full',
          isListening ? 'bg-destructive' : error ? 'bg-muted' : 'bg-card border border-border'
        )}
      >
        {isListening && (
          <Animated.View
            pointerEvents="none"
            style={[
              pulseStyle,
              { position: 'absolute', width: size, height: size, borderRadius: size / 2 },
            ]}
            className="bg-destructive/30"
          />
        )}
        <Icon
          as={error ? MicOff : Mic}
          size={Math.round(size * 0.42)}
          className={cn(isListening ? 'text-white' : 'text-foreground')}
        />
      </Pressable>
    </View>
  );
}
