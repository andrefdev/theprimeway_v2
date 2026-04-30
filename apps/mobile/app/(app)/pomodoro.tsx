import { useEffect, useRef, useState } from 'react';
import { View, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Header } from '@/shared/components/layout/Header';
import { XpFloater } from '@/features/gamification/components/XpFloater';
import { XP_VALUES } from '@/features/gamification/model/constants';
import { useGamificationStore } from '@/features/gamification/stores/gamificationStore';
import { useUiStore } from '@/shared/stores/uiStore';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  showPomodoroNotification,
  schedulePomodoroCompletion,
  dismissPomodoroNotification,
} from '@/features/notifications/timerNotifications';
import { PomodoroModeSelector } from '@/features/pomodoro/components/PomodoroModeSelector';
import { PomodoroTimer } from '@/features/pomodoro/components/PomodoroTimer';
import { PomodoroControls } from '@/features/pomodoro/components/PomodoroControls';
import { PomodoroStats } from '@/features/pomodoro/components/PomodoroStats';

const SESSION_DISPLAY_NAMES: Record<string, string> = {
  focus: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const DURATIONS = { focus: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 };

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

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimestampRef = useRef(0);
  const baseRemainingRef = useRef(pomodoro.remainingSeconds);

  // Wall-clock based timer tick — accurate across app backgrounding
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

  // Sync on app resume
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pomodoro.status === 'running') {
        const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        setPomodoroRemaining(Math.max(baseRemainingRef.current - elapsed, 0));
      }
    });
    return () => sub.remove();
  }, [pomodoro.status]);

  // Persistent notification updates
  useEffect(() => {
    if (pomodoro.status === 'running' && pomodoro.remainingSeconds > 0) {
      if (pomodoro.remainingSeconds % 5 === 0 || pomodoro.remainingSeconds <= 10) {
        showPomodoroNotification(
          pomodoro.remainingSeconds,
          SESSION_DISPLAY_NAMES[pomodoro.sessionType]
        );
      }
    }
  }, [pomodoro.remainingSeconds, pomodoro.status]);

  // Schedule / dismiss completion notification
  useEffect(() => {
    if (pomodoro.status === 'running') {
      schedulePomodoroCompletion(
        pomodoro.remainingSeconds,
        SESSION_DISPLAY_NAMES[pomodoro.sessionType]
      );
    } else {
      dismissPomodoroNotification();
    }
  }, [pomodoro.status]);

  // Completion side-effects
  useEffect(() => {
    if (pomodoro.remainingSeconds <= 0 && pomodoro.status === 'running') {
      setPomodoroStatus('idle');
      dismissPomodoroNotification();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (pomodoro.sessionType === 'focus') {
        addXp({ type: 'pomodoro', amount: XP_VALUES.pomodoro });
        setShowXp(true);
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

  const skipMode = () => {
    setPomodoroSessionType(
      pomodoro.sessionType === 'focus' ? 'short_break' : 'focus'
    );
  };

  const total = DURATIONS[pomodoro.sessionType];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={t('title')} showBack />

      <View className="flex-1 items-center justify-center px-4">
        <View className="mb-10">
          <PomodoroModeSelector
            mode={pomodoro.sessionType}
            onChange={setPomodoroSessionType}
          />
        </View>

        <View className="mb-10">
          <PomodoroTimer
            remainingSeconds={pomodoro.remainingSeconds}
            totalSeconds={total}
            mode={pomodoro.sessionType}
            rightAccessory={
              <XpFloater
                amount={XP_VALUES.pomodoro}
                visible={showXp}
                onComplete={() => setShowXp(false)}
              />
            }
          />
        </View>

        <PomodoroControls
          isRunning={pomodoro.status === 'running'}
          onToggle={toggleTimer}
          onReset={resetPomodoro}
          onSkip={skipMode}
        />

        <View className="mt-12 w-full">
          <PomodoroStats />
        </View>
      </View>
    </SafeAreaView>
  );
}
