import { useState, useEffect } from 'react';
import { Alert, View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { FormSheet } from '@/shared/components/ui/form-sheet';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { Trash2, Layers, X, Link2 } from 'lucide-react-native';
import { useUpdateHabit, useDeleteHabit, useHabits } from '../hooks/useHabits';
import { getStackedHabitId, setStackedHabit, removeHabitFromStacks } from '../services/habitStacks';
import { cn } from '@/shared/utils/cn';
import type { HabitWithLogs } from '../types';
import type { ThreeYearGoal } from '@shared/types/models';
import { ThreeYearGoalPickerSheet } from '@features/goals/components/ThreeYearGoalPickerSheet';
import { HabitAiInsights } from './HabitAiInsights';
import { HabitHeatmap } from './HabitHeatmap';

const CATEGORIES = [
  { key: 'health', label: 'Health', emoji: '💪' },
  { key: 'learning', label: 'Learning', emoji: '📚' },
  { key: 'work', label: 'Work', emoji: '💼' },
  { key: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { key: 'social', label: 'Social', emoji: '👥' },
  { key: 'creative', label: 'Creative', emoji: '🎨' },
  { key: 'finance', label: 'Finance', emoji: '💰' },
  { key: 'home', label: 'Home', emoji: '🏠' },
];

const COLORS = ['#280FFB', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

interface HabitEditSheetProps {
  habit: HabitWithLogs | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HabitEditSheet({ habit, isOpen, onClose }: HabitEditSheetProps) {
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('health');
  const [color, setColor] = useState('#280FFB');
  const [linkedGoal, setLinkedGoal] = useState<ThreeYearGoal | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [stackedId, setStackedId] = useState<string | null>(null);
  const [showStackPicker, setShowStackPicker] = useState(false);
  const { data: allHabits } = useHabits();

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category ?? 'health');
      setColor(habit.color ?? '#280FFB');
      setLinkedGoal(null);
      getStackedHabitId(habit.id).then(setStackedId);
    }
  }, [habit]);

  const handleUpdate = async () => {
    if (!habit || !name.trim()) return;
    try {
      await updateHabit.mutateAsync({
        id: habit.id,
        data: {
          name: name.trim(),
          category,
          color,
          ...(linkedGoal ? { goalId: linkedGoal.id } : {}),
        },
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Could not update habit');
    }
  };

  const handleDelete = () => {
    if (!habit) return;
    Alert.alert('Delete Habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit.mutateAsync(habit.id);
          await removeHabitFromStacks(habit.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title="Edit Habit">
      <TextInput
        className="rounded-xl border border-border bg-card px-4 py-3.5 text-base font-medium text-foreground"
        value={name}
        onChangeText={setName}
      />

      <View>
        <Text className="mb-2 text-xs font-medium text-muted-foreground">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              className={cn(
                'flex-row items-center gap-1.5 rounded-lg border px-3 py-2',
                category === c.key ? 'border-primary bg-primary/10' : 'border-border bg-card'
              )}
            >
              <Text className="text-sm">{c.emoji}</Text>
              <Text className={cn('text-xs font-medium', category === c.key ? 'text-primary' : 'text-muted-foreground')}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-xs font-medium text-muted-foreground">Color</Text>
        <View className="flex-row gap-3">
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              className={cn('h-8 w-8 rounded-full', color === c && 'border-2 border-foreground')}
              style={{ backgroundColor: c }}
            />
          ))}
        </View>
      </View>

      {/* Link to Goal */}
      <View>
        <Text className="mb-2 text-xs font-medium text-muted-foreground">Link to Three-Year Goal</Text>
        <Pressable
          onPress={() => setShowGoalPicker(true)}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 active:opacity-70"
        >
          <Icon as={Layers} size={16} className="text-muted-foreground" />
          <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
            {linkedGoal ? linkedGoal.title : 'Link a goal (optional)'}
          </Text>
          {linkedGoal ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setLinkedGoal(null);
              }}
              hitSlop={8}
            >
              <Icon as={X} size={14} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      {/* Habit Stack */}
      <View>
        <Text className="mb-2 text-xs font-medium text-muted-foreground">After this habit, do…</Text>
        <Pressable
          onPress={() => setShowStackPicker(true)}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 active:opacity-70"
        >
          <Icon as={Link2} size={16} className="text-muted-foreground" />
          <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
            {stackedId
              ? (allHabits ?? []).find((h) => h.id === stackedId)?.name ?? 'Stacked habit'
              : 'Stack a habit (optional)'}
          </Text>
          {stackedId ? (
            <Pressable
              onPress={async (e) => {
                e.stopPropagation();
                if (!habit) return;
                await setStackedHabit(habit.id, null);
                setStackedId(null);
              }}
              hitSlop={8}
            >
              <Icon as={X} size={14} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      {showStackPicker && habit && (
        <View className="gap-1.5 rounded-xl border border-border bg-card p-2">
          {(allHabits ?? []).filter((h) => h.id !== habit.id).length === 0 ? (
            <Text className="px-2 py-3 text-xs text-muted-foreground">No other habits to stack</Text>
          ) : (
            (allHabits ?? [])
              .filter((h) => h.id !== habit.id)
              .map((h) => (
                <Pressable
                  key={h.id}
                  onPress={async () => {
                    await setStackedHabit(habit.id, h.id);
                    setStackedId(h.id);
                    setShowStackPicker(false);
                  }}
                  className={cn(
                    'rounded-lg px-3 py-2 active:bg-muted',
                    stackedId === h.id && 'bg-primary/10'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      stackedId === h.id ? 'font-semibold text-primary' : 'text-foreground'
                    )}
                  >
                    {h.name}
                  </Text>
                </Pressable>
              ))
          )}
          <Pressable
            onPress={() => setShowStackPicker(false)}
            className="mt-1 items-center rounded-lg px-3 py-2 active:bg-muted"
          >
            <Text className="text-xs text-muted-foreground">Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Heatmap */}
      {habit && (
        <View className="rounded-lg bg-white p-4 dark:bg-slate-900">
          <HabitHeatmap
            logs={habit.logs}
            targetFrequency={habit.targetFrequency}
            color={habit.color}
          />
        </View>
      )}

      {/* AI Insights */}
      {habit && <HabitAiInsights habitId={habit.id} />}

      <Button className="h-12 rounded-xl" onPress={handleUpdate} disabled={updateHabit.isPending || !name.trim()}>
        {updateHabit.isPending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-sm font-bold text-primary-foreground">Update Habit</Text>
        )}
      </Button>

      <Button variant="ghost" onPress={handleDelete} className="h-11">
        <Icon as={Trash2} size={16} className="text-destructive" />
        <Text className="text-sm font-medium text-destructive">Delete Habit</Text>
      </Button>

      <ThreeYearGoalPickerSheet
        isOpen={showGoalPicker}
        onClose={() => setShowGoalPicker(false)}
        selectedGoalId={linkedGoal?.id}
        onSelect={(goal) => setLinkedGoal(goal)}
      />
    </FormSheet>
  );
}
