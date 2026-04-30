import { View } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Text } from '@/shared/components/ui/text';
import { formatSeconds } from '@/shared/utils/format';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { PomodoroMode } from './PomodoroModeSelector';

const MODE_LABEL_KEYS: Record<PomodoroMode, string> = {
  focus: 'modes.work',
  short_break: 'modes.shortBreak',
  long_break: 'modes.longBreak',
};

function TimerRing({ progress, size = 240 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashoffset = circumference * (1 - clamped);

  return (
    <Svg width={size} height={size}>
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(210, 15%, 18%)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(246, 97%, 52%)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

interface Props {
  remainingSeconds: number;
  totalSeconds: number;
  mode: PomodoroMode;
  size?: number;
  rightAccessory?: React.ReactNode;
}

export function PomodoroTimer({
  remainingSeconds,
  totalSeconds,
  mode,
  size = 240,
  rightAccessory,
}: Props) {
  const { t } = useTranslation('features.pomodoro');
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  return (
    <View className="relative items-center justify-center" style={{ width: size, height: size }}>
      <TimerRing progress={progress} size={size} />
      <View className="absolute items-center">
        <Text className="text-5xl font-bold tracking-tight text-foreground">
          {formatSeconds(remainingSeconds)}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {t(MODE_LABEL_KEYS[mode])}
        </Text>
      </View>
      {rightAccessory ? (
        <View className="absolute -top-2 right-4">{rightAccessory}</View>
      ) : null}
    </View>
  );
}
