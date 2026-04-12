import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { ChevronRight, ChevronLeft, Repeat2, Info } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';

const SUGGESTION_KEYS = ['read', 'exercise', 'meditate', 'water', 'journal', 'noSocial'] as const;

const TOTAL_STEPS = 5;
const CURRENT_STEP = 2;

export default function HabitsScreen() {
  const { t } = useTranslation('features.onboarding.habitsSetup');
  const { t: tOnboarding } = useTranslation('features.onboarding');
  const [habitName, setHabitName] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
  const suggestions = SUGGESTION_KEYS.map((key) => t(`suggestions.${key}`));

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Back button */}
      <View className="px-6 pb-2 pt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <Icon as={ChevronLeft} size={20} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.back')}</Text>
          </Button>
          <Text className="text-sm font-medium text-muted-foreground">
            {t('step')}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mb-4 h-1.5 w-full rounded-full bg-muted">
          <View
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }}
          />
        </View>

        <Text className="text-3xl font-bold text-foreground">
          {t('title')}
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          {t('description')}
        </Text>
      </View>

      {/* Tooltip / Coach mark */}
      {showTooltip && (
        <Pressable
          onPress={() => setShowTooltip(false)}
          className="mx-6 mb-2 flex-row items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
        >
          <Icon as={Info} size={18} className="mt-0.5 text-primary" />
          <Text className="flex-1 text-sm leading-5 text-foreground/80">
            {tOnboarding('tooltips.habits')}
          </Text>
        </Pressable>
      )}

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-6 pt-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Habit Icon */}
        <View className="mb-6 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-violet-400/15">
            <Icon as={Repeat2} size={32} className="text-violet-400" />
          </View>
        </View>

        {/* Habit Name Input */}
        <View className="mb-2">
          <Text className="mb-2 text-sm font-medium text-foreground">
            {t('habitName')}
          </Text>
          <TextInput
            value={habitName}
            onChangeText={setHabitName}
            placeholder={t('habitPlaceholder')}
            placeholderTextColor="hsl(0 0% 45%)"
            className="rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-base text-foreground"
          />
        </View>

        {/* Suggested Habits */}
        <View className="mt-6">
          <Text className="mb-3 text-sm font-medium text-muted-foreground">
            {t('orPickSuggestion')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((habit) => (
              <Pressable
                key={habit}
                onPress={() => setHabitName(habit)}
                className={cn(
                  'rounded-full border border-border px-4 py-2',
                  habitName === habit && 'border-primary bg-primary/10'
                )}
              >
                <Text
                  className={cn(
                    'text-sm text-muted-foreground',
                    habitName === habit && 'text-foreground'
                  )}
                >
                  {habit}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="flex-row items-center justify-between border-t border-border px-6 pb-6 pt-4">
        <Button
          variant="ghost"
          onPress={() => router.push('/(onboarding)/tasks')}
        >
          <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.skip')}</Text>
        </Button>

        <Button
          size="lg"
          onPress={() => router.push('/(onboarding)/tasks')}
          disabled={habitName.trim().length === 0}
          className="min-w-[140px]"
        >
          <Text className="text-base font-semibold text-primary-foreground">
            {tOnboarding('buttons.next')}
          </Text>
          <Icon as={ChevronRight} size={20} className="text-primary-foreground" />
        </Button>
      </View>
    </SafeAreaView>
  );
}
