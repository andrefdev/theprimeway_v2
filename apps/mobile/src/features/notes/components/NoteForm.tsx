import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { X } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { noteFormSchema, type NoteFormData } from '../types';
import { useNoteCategories } from '../hooks/useNotes';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface NoteFormProps {
  defaultValues?: Partial<NoteFormData>;
  onSubmit: (data: NoteFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function NoteForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: NoteFormProps) {
  const { t } = useTranslation('features.notes');
  const { data: categories } = useNoteCategories();

  const [tagInput, setTagInput] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema) as any,
    defaultValues: {
      title: '',
      content: '',
      categoryId: undefined,
      tags: [],
      isPinned: false,
      ...defaultValues,
    },
  });

  const selectedCategoryId = watch('categoryId');
  const currentTags = watch('tags') ?? [];
  const isPinned = watch('isPinned') ?? false;

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '');
    if (tag && !currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setValue('tags', currentTags.filter((t) => t !== tag));
  };

  const resolvedSubmitLabel = submitLabel ?? t('actions.save');

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8 gap-5"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          {t('form.title')}
        </Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={cn(
                'rounded-md border border-input bg-background px-3 py-2.5 text-lg font-semibold text-foreground',
                errors.title && 'border-destructive'
              )}
              placeholder={t('form.titlePlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoFocus
            />
          )}
        />
        {errors.title ? (
          <Text className="text-xs text-destructive">{errors.title.message}</Text>
        ) : null}
      </View>

      {/* Content */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          {t('form.content')}
        </Text>
        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="min-h-[120px] rounded-md border border-input bg-background px-3 pt-2.5 text-base text-foreground"
              placeholder={t('form.contentPlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              multiline
              textAlignVertical="top"
              numberOfLines={5}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value ?? ''}
            />
          )}
        />
      </View>

      {/* Category */}
      {categories && categories.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">
            {t('form.category')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            <Pressable
              onPress={() => setValue('categoryId', undefined)}
              className={cn(
                'rounded-full border px-3 py-1.5',
                !selectedCategoryId
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              )}
            >
              <Text
                className={cn(
                  'text-xs',
                  !selectedCategoryId
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {t('form.noCategory')}
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() =>
                  setValue(
                    'categoryId',
                    selectedCategoryId === cat.id ? undefined : cat.id
                  )
                }
                className={cn(
                  'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5',
                  selectedCategoryId === cat.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <Text
                  className={cn(
                    'text-xs',
                    selectedCategoryId === cat.id
                      ? 'font-medium text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tags */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          {t('form.tags')}
        </Text>
        <TextInput
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          placeholder={t('form.tagsPlaceholder')}
          placeholderTextColor="hsl(0 0% 63.9%)"
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={() => addTag(tagInput)}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        {currentTags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {currentTags.map((tag) => (
              <View
                key={tag}
                className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1"
              >
                <Text className="text-xs text-foreground">#{tag}</Text>
                <Pressable onPress={() => removeTag(tag)} hitSlop={4}>
                  <Icon as={X} size={12} className="text-muted-foreground" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Pin toggle */}
      <View className="flex-row items-center justify-between rounded-md border border-border bg-card px-4 py-3">
        <Text className="text-sm font-medium text-foreground">
          {t('form.pinNote')}
        </Text>
        <Switch
          value={isPinned}
          onValueChange={(val) => setValue('isPinned', val)}
          trackColor={{ false: 'hsl(210 10% 82%)', true: 'hsl(238 84% 67%)' }}
          thumbColor="white"
        />
      </View>

      {/* Submit */}
      <Button
        className="mt-2"
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
      >
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
