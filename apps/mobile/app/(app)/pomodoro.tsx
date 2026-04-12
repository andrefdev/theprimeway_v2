import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { IconCircle } from '@/shared/components/ui/icon-circle';
import { Header } from '@/shared/components/layout/Header';
import { XpFloater } from '@/features/gamification/components/XpFloater';
import { XP_VALUES } from '@/features/gamification/model/constants';
import { useGamificationStore } from '@/features/gamification/stores/gamificationStore';
import { useUiStore } from '@/shared/stores/uiStore';
import { formatSeconds } from '@/shared/utils/format';
import { usePomodoroStats } from '@/features/pomodoro/hooks/usePomodoro';
import { Play, Pause, RotateCcw, SkipForward, Timer, Flame, CheckSquare, Zap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { cn } from '@/shared/utils/cn';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  showPomodoroNotification,
  schedulePomodoroCompletion,
  dismissPomodoroNotification,
} from '@/features/notifications/timerNotifications';

const SESSION_LABEL_KEYS = {
  focus: 'modes.work',
  short_break: 'modes.shortBreak',
  long_break: 'modes.longBreak',
} as const;

const SESSION_DISPLAY_NAMES: Record<string, string> = {
  focus: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const DURATIONS = { focus: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 };

function TimerRing({ progress, size = 240 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

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
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

export default function PomodoroScreen() {
  const { t } = useTranslation('features.pomodoro');
  const {
    pomodoro,
    setPomodoroStatus,
    setPomodoroRemaining,
    setPomodoroSessionType,
    resetPomodoro,
  } = useUiStore();
  const addXp = useGamificationStore((s) => s.addXp);
  const awardXpToBackend = useGamificationStore((s) => s.awardXpToBackend);
  const [showXp, setShowXp] = useState(false);
  const { data: stats, isLoading: statsLoading } = usePomodoroStats();

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimestampRef = useRef(0);
  const baseRemainingRef = useRef(pomodoro.remainingSeconds);

  // Main timer tick — uses wall-clock to stay accurate even when backgrounded
  useEffect(() => {
    if (pomodoro.status === 'running') {
      startTimestampRef.current = Date.now();
      baseRemainingRef.current = pomodoro.remainingSeconds;

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        const next = Math.max(baseRemainingRef.current - elapsed, 0);
        setPomodoroRemaining(next);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoro.status]);

  // Sync remaining time on app resume (covers lock-screen / background)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pomodoro.status === 'running') {
        const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        setPomodoroRemaining(Math.max(baseRemainingRef.current - elapsed, 0));
      }
    });
    return () => sub.remove();
  }, [pomodoro.status]);

  // Update persistent notification every 5 seconds while running
  useEffect(() => {
    if (pomodoro.status === 'running' && pomodoro.remainingSeconds > 0) {
      // Update notification every 5s to avoid excessive updates
      if (pomodoro.remainingSeconds % 5 === 0 || pomodoro.remainingSeconds <= 10) {
        showPomodoroNotification(
          pomodoro.remainingSeconds,
          SESSION_DISPLAY_NAMES[pomodoro.sessionType]
        );
      }
    }
  }, [pomodoro.remainingSeconds, pomodoro.status]);

  // Schedule completion notification when timer starts
  useEffect(() => {
    if (pomodoro.status === 'running') {
      schedulePomodoroCompletion(
        pomodoro.remainingSeconds,
        SESSION_DISPLAY_NAMES[pomodoro.sessionType]
      );
    } else {
      // Dismiss persistent notification when paused/idle
      dismissPomodoroNotification();
    }
  }, [pomodoro.status]);

  // Timer completed
  useEffect(() => {
    if (pomodoro.remainingSeconds <= 0 && pomodoro.status === 'running') {
      setPomodoroStatus('idle');
      dismissPomodoroNotification();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Award XP for focus sessions only
      if (pomodoro.sessionType === 'focus') {
        addXp({ type: 'pomodoro', amount: XP_VALUES.pomodoro });
        setShowXp(true);
        // Sync with backend
        const today = new Date().toISOString().split('T')[0];
        awardXpToBackend({
          source: 'pomodoro',
          amount: XP_VALUES.pomodoro,
          earnedDate: today,
          metadata: { sessionType: 'focus' },
        });
      }
    }
  }, [pomodoro.remainingSeconds, pomodoro.status, setPomodoroStatus]);

  const toggleTimer = () => {
    setPomodoroStatus(pomodoro.status === 'running' ? 'paused' : 'running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const total = DURATIONS[pomodoro.sessionType];
  const progress = (total - pomodoro.remainingSeconds) / total;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={t('title')} showBack />

      <View className="flex-1 items-center justify-center px-4">
        {/* Session Type Pills */}
        <View className="mb-10 flex-row gap-2">
          {(Object.keys(SESSION_LABEL_KEYS) as Array<keyof typeof SESSION_LABEL_KEYS>).map((type) => (
            <Pressable
              key={type}
              className={cn(
                'rounded-full px-4 py-2',
                pomodoro.sessionType === type ? 'bg-primary' : 'bg-muted'
              )}
              onPress={() => setPomodoroSessionType(type)}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  pomodoro.sessionType === type ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                {t(SESSION_LABEL_KEYS[type])}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timer Ring */}
        <View className="relative mb-10 items-center justify-center" style={{ width: 240, height: 240 }}>
          <TimerRing progress={progress} />
          <View className="absolute items-center">
            <Text className="text-5xl font-bold tracking-tight text-foreground">
              {formatSeconds(pomodoro.remainingSeconds)}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {t(SESSION_LABEL_KEYS[pomodoro.sessionType])}
            </Text>
          </View>
          <View className="absolute -top-2 right-4">
            <XpFloater amount={XP_VALUES.pomodoro} visible={showXp} onComplete={() => setShowXp(false)} />
          </View>
        </View>

        {/* Controls */}
        <View className="flex-row items-center gap-6">
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-full bg-muted active:bg-border"
            onPress={resetPomodoro}
          >
            <Icon as={RotateCcw} size={20} className="text-foreground" />
          </Pressable>

          <Pressable
            className="h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 active:bg-primary-hover"
            onPress={toggleTimer}
          >
            <Icon
              as={pomodoro.status === 'running' ? Pause : Play}
              size={28}
              className="text-primary-foreground"
            />
          </Pressable>

          <Pressable
            className="h-12 w-12 items-center justify-center rounded-full bg-muted active:bg-border"
            onPress={() => {
              setPomodoroSessionType(
                pomodoro.sessionType === 'focus' ? 'short_break' : 'focus'
              );
            }}
          >
            <Icon as={SkipForward} size={20} className="text-foreground" />
          </Pressable>
        </View>

        {/* Stats Preview */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mt-12 flex-row gap-3">
          <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
            <IconCircle icon={Timer} color="primary" size="sm" />
            <Text className="mt-2 text-lg font-bold text-foreground">
              {statsLoading
                ? '–'
                : stats?.todayMinutes != null
                  ? `${Math.floor(stats.todayMinutes / 60)}h`
                  : '0h'}
            </Text>
            <Text className="text-2xs text-muted-foreground">{t('statistics.todayFocus')}</Text>
          </View>
          <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
            <IconCircle icon={CheckSquare} color="success" size="sm" />
            <Text className="mt-2 text-lg font-bold text-foreground">
              {statsLoading ? '–' : stats?.todaySessions ?? 0}
            </Text>
            <Text className="text-2xs text-muted-foreground">{t('statistics.sessions')}</Text>
          </View>
          <View className="flex-1 items-center rounded-xl border border-border bg-card py-3">
            <IconCircle icon={Flame} color="warning" size="sm" />
            <Text className="mt-2 text-lg font-bold text-foreground">
              {statsLoading
                ? '–'
                : stats?.currentStreak != null
                  ? `${stats.currentStreak}d`
                  : '0d'}
            </Text>
            <Text className="text-2xs text-muted-foreground">Streak</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
