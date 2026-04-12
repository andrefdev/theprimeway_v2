import { View, Pressable, Alert } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Target, X } from 'lucide-react-native';
import { useCreateReadingGoal } from '../hooks/useReading';
import type { GoalPeriodType } from '../model/types';
import { useState, useCallback } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CreateGoalSheetProps {
  onClose: () => void;
}

const PERIOD_OPTIONS: Array<{ value: GoalPeriodType; label: string; description: string }> = [
  { value: 'monthly', label: 'Monthly', description: 'Books per month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Books per quarter' },
  { value: 'yearly', label: 'Yearly', description: 'Books this year' },
];

const TARGET_PRESETS = [3, 5, 10, 12, 20, 24, 30, 52];

function getDateRange(period: GoalPeriodType): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'monthly': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'quarterly': {
      const qStart = Math.floor(month / 3) * 3;
      const start = new Date(year, qStart, 1);
      const end = new Date(year, qStart + 3, 0);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'yearly': {
      return {
        startDate: new Date(year, 0, 1).toISOString(),
        endDate: new Date(year, 11, 31).toISOString(),
      };
    }
  }
}

export function CreateGoalSheet({ onClose }: CreateGoalSheetProps) {
  const createGoal = useCreateReadingGoal();
  const [period, setPeriod] = useState<GoalPeriodType>('yearly');
  const [target, setTarget] = useState(12);

  const handleCreate = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange(period);
      await createGoal.mutateAsync({
        periodType: period,
        targetBooks: target,
        startDate,
        endDate,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Could not create goal. Try again.');
    }
  }, [period, target, createGoal, onClose]);

  return (
    <Animated.View entering={FadeIn.duration(200)} className="rounded-t-3xl bg-card p-5">
      {/* Header */}
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Target} size={20} className="text-primary" />
          <Text className="text-lg font-bold text-foreground">New Reading Goal</Text>
        </View>
        <Pressable onPress={onClose} className="rounded-full bg-muted p-1.5">
          <Icon as={X} size={16} className="text-muted-foreground" />
        </Pressable>
      </View>

      {/* Period Type */}
      <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Period</Text>
      <View className="mb-4 flex-row gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setPeriod(opt.value)}
            className={`flex-1 items-center rounded-xl border py-3 ${
              period === opt.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-background'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                period === opt.value ? 'text-primary' : 'text-foreground'
              }`}
            >
              {opt.label}
            </Text>
            <Text className="mt-0.5 text-2xs text-muted-foreground">{opt.description}</Text>
          </Pressable>
        ))}
      </View>

      {/* Target */}
      <Text className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        Target Books
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {TARGET_PRESETS.map((n) => (
          <Pressable
            key={n}
            onPress={() => setTarget(n)}
            className={`min-w-[48px] items-center rounded-lg border px-3 py-2 ${
              target === n ? 'border-primary bg-primary/10' : 'border-border bg-background'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                target === n ? 'text-primary' : 'text-foreground'
              }`}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary */}
      <View className="mb-4 rounded-xl bg-primary/5 p-3">
        <Text className="text-center text-sm text-foreground">
          Read{' '}
          <Text className="font-bold text-primary">{target} books</Text>
          {' '}this {period === 'yearly' ? 'year' : period === 'quarterly' ? 'quarter' : 'month'}
        </Text>
      </View>

      {/* Create button */}
      <Pressable
        onPress={handleCreate}
        disabled={createGoal.isPending}
        className="items-center rounded-xl bg-primary py-3.5"
      >
        <Text className="text-sm font-semibold text-primary-foreground">
          {createGoal.isPending ? 'Creating...' : 'Create Goal'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
