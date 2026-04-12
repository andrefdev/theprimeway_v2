import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { habitFormSchema, type HabitFormData } from '../types';
import { useTranslation } from '@/shared/hooks/useTranslation';

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

interface HabitFormProps {
  defaultValues?: Partial<HabitFormData>;
  onSubmit: (data: HabitFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function HabitForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: HabitFormProps) {
  const { t } = useTranslation('features.habits');

  const resolvedSubmitLabel = submitLabel ?? t('actions.create');

  const CATEGORIES = [
    { value: 'Health', label: t('categories.health') },
    { value: 'Fitness', label: t('categories.fitness') },
    { value: 'Mindset', label: t('categories.mindset') },
    { value: 'Learning', label: t('categories.learning') },
    { value: 'Productivity', label: t('categories.productivity') },
    { value: 'Finance', label: t('categories.finance') },
    { value: 'Social', label: t('categories.social') },
    { value: 'Other', label: t('categories.other') },
  ];

  const FREQUENCY_TYPES = [
    { value: 'daily' as const, label: t('frequency.dailyLabel') },
    { value: 'week_days' as const, label: t('frequency.weekDaysLabel') },
    { value: 'times_per_week' as const, label: t('frequency.timesPerWeek') },
  ];

  const WEEK_DAYS = [
    { value: 0, label: t('days.sun') },
    { value: 1, label: t('days.mon') },
    { value: 2, label: t('days.tue') },
    { value: 3, label: t('days.wed') },
    { value: 4, label: t('days.thu') },
    { value: 5, label: t('days.fri') },
    { value: 6, label: t('days.sat') },
  ];
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      category: undefined,
      color: '#6366f1',
      targetFrequency: 1,
      frequencyType: 'daily',
      weekDays: [],
      ...defaultValues,
    },
  });

  const selectedColor = watch('color');
  const selectedCategory = watch('category');
  const frequencyType = watch('frequencyType');
  const selectedWeekDays = watch('weekDays') ?? [];

  const toggleWeekDay = (day: number) => {
    const current = selectedWeekDays;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setValue('weekDays', updated);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('habitTitle')}</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={cn(
                'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
                errors.name && 'border-destructive',
              )}
              placeholder={t('habitNamePlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.name && (
          <Text className="text-xs text-destructive">
            {errors.name.message}
          </Text>
        )}
      </View>

      {/* Description */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          {t('habitDescriptionOptional')}
        </Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="h-20 rounded-md border border-input bg-background px-3 pt-2 text-base text-foreground"
              placeholder={t('habitDescriptionFormPlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              multiline
              textAlignVertical="top"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>

      {/* Category */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('habitCategory')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() =>
                setValue('category', selectedCategory === cat.value ? undefined : cat.value)
              }
              className={cn(
                'rounded-full border border-border px-3 py-1.5',
                selectedCategory === cat.value && 'border-primary bg-primary/10',
              )}
            >
              <Text
                className={cn(
                  'text-xs text-muted-foreground',
                  selectedCategory === cat.value &&
                    'font-medium text-primary',
                )}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Color Picker */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('habitColor')}</Text>
        <View className="flex-row gap-3">
          {COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => setValue('color', color)}
              className={cn(
                'h-8 w-8 rounded-full',
                selectedColor === color &&
                  'border-2 border-foreground',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </View>
      </View>

      {/* Frequency Type */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          {t('frequency.label')}
        </Text>
        <View className="flex-row gap-2">
          {FREQUENCY_TYPES.map((ft) => (
            <Pressable
              key={ft.value}
              onPress={() => setValue('frequencyType', ft.value)}
              className={cn(
                'flex-1 items-center rounded-md border border-border px-3 py-2',
                frequencyType === ft.value &&
                  'border-primary bg-primary/10',
              )}
            >
              <Text
                className={cn(
                  'text-xs text-muted-foreground',
                  frequencyType === ft.value &&
                    'font-medium text-primary',
                )}
              >
                {ft.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Target Frequency */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          {t('target', { unit: frequencyType === 'times_per_week' ? t('frequency.timesPerWeekLabel') : t('frequency.timesPerDayLabel') })}
        </Text>
        <Controller
          control={control}
          name="targetFrequency"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => onChange(Math.max(1, (value ?? 1) - 1))}
                className="h-10 w-10 items-center justify-center rounded-md border border-border bg-background"
              >
                <Text className="text-lg font-semibold text-foreground">
                  -
                </Text>
              </Pressable>
              <Text className="min-w-[32px] text-center text-lg font-bold text-foreground">
                {value ?? 1}
              </Text>
              <Pressable
                onPress={() => onChange((value ?? 1) + 1)}
                className="h-10 w-10 items-center justify-center rounded-md border border-border bg-background"
              >
                <Text className="text-lg font-semibold text-foreground">
                  +
                </Text>
              </Pressable>
            </View>
          )}
        />
        {errors.targetFrequency && (
          <Text className="text-xs text-destructive">
            {errors.targetFrequency.message}
          </Text>
        )}
      </View>

      {/* Week Days (shown for week_days type) */}
      {frequencyType === 'week_days' && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">
            {t('frequency.selectDays')}
          </Text>
          <View className="flex-row gap-2">
            {WEEK_DAYS.map((day) => (
              <Pressable
                key={day.value}
                onPress={() => toggleWeekDay(day.value)}
                className={cn(
                  'h-10 flex-1 items-center justify-center rounded-md border border-border',
                  selectedWeekDays.includes(day.value) &&
                    'border-primary bg-primary/10',
                )}
              >
                <Text
                  className={cn(
                    'text-xs text-muted-foreground',
                    selectedWeekDays.includes(day.value) &&
                      'font-medium text-primary',
                  )}
                >
                  {day.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Submit */}
      <Button className="mt-4" onPress={handleSubmit(onSubmit)} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="hsl(0 0% 9%)" />
        ) : (
          <Text className="text-sm font-medium text-primary-foreground">
            {resolvedSubmitLabel}
          </Text>
        )}
      </Button>
    </ScrollView>
  );
}
