import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Check, Target, Loader } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useWeeklyGoals } from '../hooks/useGoals';
import type { WeeklyGoal } from '@shared/types/models';

interface GoalPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGoalId?: string | null;
  onSelect: (goal: WeeklyGoal | null) => void;
}

export function GoalPickerSheet({
  isOpen,
  onClose,
  selectedGoalId,
  onSelect,
}: GoalPickerSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const { data: goals = [], isLoading } = useWeeklyGoals();

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: isDark ? 'hsl(210, 20%, 11%)' : '#ffffff',
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? 'hsl(210, 10%, 40%)' : '#ccc',
        width: 40,
      }}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
      }}
    >
      <View className="px-4 pb-3">
        <Text className="text-center text-lg font-semibold text-foreground">Link to Goal</Text>
        <Text className="mt-1 text-center text-xs text-muted-foreground">
          Select a weekly goal to link this task to
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        {isLoading ? (
          <View className="py-10 items-center gap-2">
            <Icon as={Loader} size={24} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">Loading goals...</Text>
          </View>
        ) : goals.length === 0 ? (
          <View className="py-10 items-center gap-2">
            <Icon as={Target} size={32} className="text-muted-foreground" />
            <Text className="text-sm font-medium text-foreground">No weekly goals yet</Text>
            <Text className="text-xs text-center text-muted-foreground">
              Create weekly goals in the Goals section first
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {/* No link option */}
            <Pressable
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 active:opacity-70"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-muted/40">
                <Icon as={Target} size={16} className="text-muted-foreground" />
              </View>
              <Text className="flex-1 text-sm text-muted-foreground italic">No goal linked</Text>
              {!selectedGoalId && (
                <Icon as={Check} size={16} className="text-primary" />
              )}
            </Pressable>

            {goals.map((goal) => {
              const isSelected = selectedGoalId === goal.id;
              return (
                <Pressable
                  key={goal.id}
                  onPress={() => {
                    onSelect(goal);
                    onClose();
                  }}
                  className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 active:opacity-70 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isSelected ? 'bg-primary/15' : 'bg-muted/30'
                    }`}
                  >
                    <Icon
                      as={Target}
                      size={16}
                      className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                      numberOfLines={2}
                    >
                      {goal.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Week of {goal.weekStartDate?.split('T')[0] ?? ''}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon as={Check} size={16} className="text-primary" />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
