import { useState, useEffect } from 'react';
import { Screen, ScreenContent } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import {
  useVisions,
  useCreateVision,
  useUpdateVision,
} from '@/features/goals/hooks/useGoals';
import { Save, Compass } from 'lucide-react-native';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/shared/hooks/useTranslation';

export default function VisionScreen() {
  const { t } = useTranslation('features.goals');
  const { t: tCommon } = useTranslation('common');
  const { data: visions, isLoading } = useVisions();
  const createVision = useCreateVision();
  const updateVision = useUpdateVision();

  const vision = visions?.[0];

  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');

  useEffect(() => {
    if (vision) {
      setTitle(vision.title);
      setNarrative(vision.narrative ?? '');
    }
  }, [vision]);

  const isSaving = createVision.isPending || updateVision.isPending;

  const handleSave = async () => {
    try {
      if (vision) {
        await updateVision.mutateAsync({
          id: vision.id,
          data: { title, narrative: narrative || undefined },
        });
      } else {
        await createVision.mutateAsync({
          title,
          narrative: narrative || undefined,
        });
      }
      router.back();
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title={t('vision.title')} showBack />
        <LoadingOverlay message={tCommon('actions.loading')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={vision ? t('vision.form.edit') : t('vision.form.create')}
        showBack
        rightAction={
          <Button
            size="icon"
            onPress={handleSave}
            disabled={!title.trim() || isSaving}
            className="rounded-full"
          >
            <Icon as={Save} size={18} className="text-primary-foreground" />
          </Button>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContent>
          {/* Vision Icon */}
          <View className="mb-6 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon as={Compass} size={32} className="text-primary" />
            </View>
          </View>

          {/* Title Field */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-foreground">{t('form.title')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('visionTooltip')}
              placeholderTextColor="#9ca3af"
              maxLength={200}
              className="rounded-lg border border-border bg-card px-4 py-3 text-base text-card-foreground"
            />
          </View>

          {/* Narrative Field */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-foreground">{t('form.narrative')}</Text>
            <TextInput
              value={narrative}
              onChangeText={setNarrative}
              placeholder={t('form.description')}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={8}
              maxLength={2000}
              textAlignVertical="top"
              className="min-h-[160px] rounded-lg border border-border bg-card px-4 py-3 text-base leading-6 text-card-foreground"
            />
            <Text className="mt-1 text-right text-xs text-muted-foreground">
              {narrative.length}/2000
            </Text>
          </View>

          {/* Hint */}
          <View className="rounded-lg bg-muted/50 p-4">
            <Text className="text-sm leading-5 text-muted-foreground">
              {t('hierarchyRequired')}
            </Text>
          </View>
        </ScreenContent>
      </ScrollView>
    </Screen>
  );
}
