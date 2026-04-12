import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Check, Layers, Loader } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useThreeYearGoals } from '../hooks/useGoals';
import type { ThreeYearGoal } from '@shared/types/models';

const PILLAR_AREA_COLORS: Record<string, string> = {
  finances: '#22c55e',
  career: '#3b82f6',
  health: '#ef4444',
  relationships: '#ec4899',
  mindset: '#8b5cf6',
  lifestyle: '#f97316',
};

const PILLAR_AREA_LABELS: Record<string, string> = {
  finances: 'Finances',
  career: 'Career',
  health: 'Health',
  relationships: 'Relationships',
  mindset: 'Mindset',
  lifestyle: 'Lifestyle',
};

interface ThreeYearGoalPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGoalId?: string | null;
  onSelect: (goal: ThreeYearGoal | null) => void;
}

export function ThreeYearGoalPickerSheet({
  isOpen,
  onClose,
  selectedGoalId,
  onSelect,
}: ThreeYearGoalPickerSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const { data: threeYearGoals = [], isLoading } = useThreeYearGoals();

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
        <Text className="text-center text-lg font-semibold text-foreground">Link to Three-Year Goal</Text>
        <Text className="mt-1 text-center text-xs text-muted-foreground">
          Select a three-year goal to link this habit to
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        {isLoading ? (
          <View className="py-10 items-center gap-2">
            <Icon as={Loader} size={24} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">Loading goals...</Text>
          </View>
        ) : threeYearGoals.length === 0 ? (
          <View className="py-10 items-center gap-2">
            <Icon as={Layers} size={32} className="text-muted-foreground" />
            <Text className="text-sm font-medium text-foreground">No three-year goals yet</Text>
            <Text className="text-xs text-center text-muted-foreground">
              Create your three-year goals in the Goals section first
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
                <Icon as={Layers} size={16} className="text-muted-foreground" />
              </View>
              <Text className="flex-1 text-sm text-muted-foreground italic">No goal linked</Text>
              {!selectedGoalId && (
                <Icon as={Check} size={16} className="text-primary" />
              )}
            </Pressable>

            {threeYearGoals.map((goal) => {
              const isSelected = selectedGoalId === goal.id;
              const areaColor = PILLAR_AREA_COLORS[goal.area] ?? '#6366f1';
              const areaLabel = PILLAR_AREA_LABELS[goal.area] ?? goal.area;

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
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: areaColor + '20' }}
                  >
                    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: areaColor }} />
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
                    <View className="flex-row items-center gap-1">
                      <View
                        className="rounded-full px-1.5 py-0.5"
                        style={{ backgroundColor: areaColor + '25' }}
                      >
                        <Text className="text-[10px] font-medium" style={{ color: areaColor }}>
                          {areaLabel}
                        </Text>
                      </View>
                    </View>
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
