import { Alert } from 'react-native';
import { useCallback } from 'react';
import { getStackedHabitId } from '../services/habitStacks';
import type { HabitWithLogs } from '../types';

export function useHabitStackPrompt(
  habits: HabitWithLogs[] | undefined,
  onComplete: (habit: HabitWithLogs) => void
) {
  return useCallback(
    async (triggerHabit: HabitWithLogs) => {
      const stackedId = await getStackedHabitId(triggerHabit.id);
      if (!stackedId || !habits) return;
      const stacked = habits.find((h) => h.id === stackedId);
      if (!stacked) return;

      const today = new Date().toISOString().split('T')[0];
      const alreadyDone = (stacked.logs ?? []).some(
        (l) => l.date?.split('T')[0] === today && (l.completedCount ?? 0) >= (stacked.targetFrequency ?? 1)
      );
      if (alreadyDone) return;

      Alert.alert(
        `Nice! You did "${triggerHabit.name}"`,
        `Ready to do "${stacked.name}" next?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: `Do it now`, onPress: () => onComplete(stacked) },
        ]
      );
    },
    [habits, onComplete]
  );
}
