import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, TextInput, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { taskFormSchema, type TaskFormData } from '../types';
import type { Task } from '@shared/types/models';
import { Calendar, Clock, Tag, X, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { format } from 'date-fns';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  defaultDate?: string; // YYYY-MM-DD, e.g. today
}

const PRIORITY_CONFIG = [
  { value: 'low' as const, label: 'Low', bg: 'bg-priority-low', bgActive: 'bg-priority-low', text: 'text-white' },
  { value: 'medium' as const, label: 'Medium', bg: 'bg-priority-medium', bgActive: 'bg-priority-medium', text: 'text-white' },
  { value: 'high' as const, label: 'High', bg: 'bg-priority-high', bgActive: 'bg-priority-high', text: 'text-white' },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export function TaskForm({ initialData, onSubmit, isLoading, submitLabel, defaultDate }: TaskFormProps) {
  const { t } = useTranslation('features.tasks');
  const { t: tCommon } = useTranslation('common');
  const [tagInput, setTagInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const todayStr = defaultDate ?? format(new Date(), 'yyyy-MM-dd');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      priority: initialData?.priority ?? 'medium',
      dueDate: initialData?.dueDate ?? undefined,
      estimatedDurationMinutes: initialData?.estimatedDurationMinutes ?? 30,
      tags: initialData?.tags ?? [],
      scheduledDate: initialData?.scheduledDate ?? todayStr,
      scheduledStart: initialData?.scheduledStart ?? undefined,
      scheduledEnd: initialData?.scheduledEnd ?? undefined,
      isAllDay: initialData?.isAllDay ?? false,
    },
  });

  const currentPriority = watch('priority');
  const currentTags = watch('tags');
  const currentDuration = watch('estimatedDurationMinutes');
  const currentScheduledDate = watch('scheduledDate');

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !currentTags.includes(trimmed)) {
      setValue('tags', [...currentTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', currentTags.filter((t) => t !== tag));
  };

  const parsedDate = currentScheduledDate ? new Date(currentScheduledDate + 'T12:00:00') : new Date();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-4 gap-5"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={cn(
              'rounded-xl border border-border bg-card px-4 py-3.5 text-base font-medium text-foreground',
              errors.title && 'border-destructive'
            )}
            placeholder="What do you need to do?"
            placeholderTextColor="hsl(210, 10%, 55%)"
            autoCapitalize="sentences"
            autoFocus={!initialData}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.title && <Text className="-mt-3 text-xs text-destructive">{errors.title.message}</Text>}

      {/* Date + Duration Row */}
      <View className="flex-row gap-3">
        {/* Date Picker */}
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-3"
        >
          <Icon as={Calendar} size={16} className="text-primary" />
          <Text className="text-sm text-foreground">
            {currentScheduledDate ? format(parsedDate, 'MMM d, yyyy') : 'Select date'}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={parsedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setValue('scheduledDate', format(selectedDate, 'yyyy-MM-dd'));
              }
            }}
          />
        )}

        {/* Duration */}
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-3">
          <Icon as={Clock} size={16} className="text-muted-foreground" />
          <Text className="text-sm text-foreground">{currentDuration ?? 30}m</Text>
        </View>
      </View>

      {/* Duration Presets */}
      <View>
        <Text className="mb-2 text-xs font-medium text-muted-foreground">Duration</Text>
        <View className="flex-row flex-wrap gap-2">
          {DURATION_PRESETS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setValue('estimatedDurationMinutes', d)}
              className={cn(
                'rounded-lg border px-3 py-1.5',
                currentDuration === d
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              )}
            >
              <Text className={cn('text-xs font-medium', currentDuration === d ? 'text-primary' : 'text-muted-foreground')}>
                {d >= 60 ? `${d / 60}h` : `${d}m`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* AI Recommended Slot */}
      <View className="flex-row items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Icon as={Sparkles} size={16} className="text-primary" />
        <View className="flex-1">
          <Text className="text-xs font-semibold text-primary">Auto-schedule enabled</Text>
          <Text className="text-2xs text-muted-foreground">
            The server will find the best available slot for you
          </Text>
        </View>
      </View>

      {/* Priority */}
      <View>
        <Text className="mb-2 text-xs font-medium text-muted-foreground">Priority</Text>
        <View className="flex-row gap-2">
          {PRIORITY_CONFIG.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => setValue('priority', p.value)}
              className={cn(
                'flex-1 items-center rounded-xl border py-2.5',
                currentPriority === p.value
                  ? `${p.bgActive} border-transparent`
                  : 'border-border bg-card'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  currentPriority === p.value ? p.text : 'text-muted-foreground'
                )}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Description */}
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="min-h-[80px] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            placeholder="Add details..."
            placeholderTextColor="hsl(210, 10%, 55%)"
            multiline
            textAlignVertical="top"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value ?? ''}
          />
        )}
      />

      {/* Tags */}
      <View>
        <View className="flex-row items-center gap-2">
          <Icon as={Tag} size={14} className="text-muted-foreground" />
          <TextInput
            className="h-10 flex-1 text-sm text-foreground"
            placeholder="Add tag..."
            placeholderTextColor="hsl(210, 10%, 55%)"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
          />
        </View>
        {currentTags.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {currentTags.map((tag) => (
              <View key={tag} className="flex-row items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1">
                <Text className="text-xs text-accent">{tag}</Text>
                <Pressable onPress={() => handleRemoveTag(tag)} hitSlop={4}>
                  <Icon as={X} size={10} className="text-accent" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit */}
      <Button
        className="mt-2 rounded-xl py-3.5"
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-sm font-bold text-primary-foreground">
            {submitLabel ?? 'Create Task'}
          </Text>
        )}
      </Button>
    </ScrollView>
  );
}
