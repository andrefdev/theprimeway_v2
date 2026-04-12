import { useState } from 'react';
import { Screen, ScreenContent } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { AnnualGoalItem } from '@/features/goals/components/AnnualGoalItem';
import { useThreeYearGoals, useCreateAnnualGoal } from '@/features/goals/hooks/useGoals';
import { PILLAR_MAP } from '@/shared/constants/pillars';
import {
  Plus,
  Wallet,
  Briefcase,
  Heart,
  Users,
  Brain,
  Sparkles,
  FileText,
} from 'lucide-react-native';
import { View, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { LucideIcon } from 'lucide-react-native';
import type { PillarArea, AnnualGoal } from '@shared/types/models';

const PILLAR_ICONS: Record<PillarArea, LucideIcon> = {
  finances: Wallet,
  career: Briefcase,
  health: Heart,
  relationships: Users,
  mindset: Brain,
  lifestyle: Sparkles,
};

export default function ThreeYearGoalDetailScreen() {
  const { t } = useTranslation('features.goals');
  const { t: tCommon } = useTranslation('common');
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: threeYearGoals, isLoading, isError, refetch } = useThreeYearGoals();
  const createAnnualGoal = useCreateAnnualGoal();

  const [showForm, setShowForm] = useState(false);
  const [annualGoalTitle, setAnnualGoalTitle] = useState('');
  const [annualGoalDescription, setAnnualGoalDescription] = useState('');

  const threeYearGoal = threeYearGoals?.find((p) => p.id === id);
  const config = threeYearGoal ? PILLAR_MAP[threeYearGoal.area] : null;
  const PillarIcon = threeYearGoal ? PILLAR_ICONS[threeYearGoal.area] : null;

  const handleCreateAnnualGoal = async () => {
    if (!annualGoalTitle.trim() || !id) return;
    await createAnnualGoal.mutateAsync({
      threeYearGoalId: id,
      title: annualGoalTitle.trim(),
      description: annualGoalDescription.trim() || undefined,
    });
    setAnnualGoalTitle('');
    setAnnualGoalDescription('');
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title={t('threeYearGoal.title')} showBack />
        <LoadingOverlay message={tCommon('actions.loading')} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Header title={t('threeYearGoal.title')} showBack />
        <ErrorState
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  if (!threeYearGoal || !config || !PillarIcon) {
    return (
      <Screen>
        <Header title={t('threeYearGoal.title')} showBack />
        <EmptyState
          icon={FileText}
          title={t('threeYearGoal.title')}
        />
      </Screen>
    );
  }

  const annualGoals = threeYearGoal.annualGoals ?? [];
  const averageProgress =
    annualGoals.length > 0
      ? Math.round(annualGoals.reduce((sum, o) => sum + (o.progress ?? 0), 0) / annualGoals.length)
      : 0;

  const renderAnnualGoal = ({ item }: { item: AnnualGoal }) => (
    <AnnualGoalItem goal={item} color={config.color} className="mb-3" />
  );

  return (
    <Screen>
      <Header
        title={threeYearGoal.title || t(`areas.${threeYearGoal.area}`)}
        showBack
        rightAction={
          <Pressable onPress={() => setShowForm(true)} hitSlop={8}>
            <Icon as={Plus} size={20} className="text-foreground" />
          </Pressable>
        }
      />

      <ScreenContent className="flex-1">
        {/* Three Year Goal Header Card */}
        <View className="mb-5 rounded-xl border border-border bg-card p-5">
          <View className="mb-3 flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon as={PillarIcon} size={24} color={config.color} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-card-foreground">
                {threeYearGoal.title || t(`areas.${threeYearGoal.area}`)}
              </Text>
              {threeYearGoal.description && (
                <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                  {threeYearGoal.description}
                </Text>
              )}
            </View>
          </View>

          {/* Overall Progress */}
          <View className="flex-row items-center gap-3">
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: config.color,
                  width: `${averageProgress}%`,
                }}
              />
            </View>
            <Text className="text-sm font-semibold" style={{ color: config.color }}>
              {averageProgress}%
            </Text>
          </View>
        </View>

        {/* Annual Goals Section */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">{t('annualGoals')}</Text>
          <Text className="text-xs text-muted-foreground">
            {annualGoals.length} {t('annualGoal.title')}
          </Text>
        </View>

        {annualGoals.length > 0 ? (
          <FlatList
            data={annualGoals}
            renderItem={renderAnnualGoal}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-8"
          />
        ) : (
          <EmptyState
            icon={FileText}
            title={t('noAnnualGoals')}
            actionLabel={t('createAnnualGoal')}
            onAction={() => setShowForm(true)}
          />
        )}
      </ScreenContent>

      {/* Create Annual Goal Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
          <Header
            title={t('createAnnualGoal')}
            leftAction={
              <Pressable onPress={() => setShowForm(false)} hitSlop={8}>
                <Text className="text-sm font-medium text-primary">{tCommon('actions.cancel')}</Text>
              </Pressable>
            }
          />
          <View className="flex-1 px-4 gap-5 pt-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">{t('form.title')}</Text>
              <TextInput
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                placeholder={t('form.title')}
                placeholderTextColor="hsl(0 0% 63.9%)"
                value={annualGoalTitle}
                onChangeText={setAnnualGoalTitle}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">{t('form.description')}</Text>
              <TextInput
                className="h-20 rounded-md border border-input bg-background px-3 pt-2 text-base text-foreground"
                placeholder={t('form.description')}
                placeholderTextColor="hsl(0 0% 63.9%)"
                multiline
                textAlignVertical="top"
                value={annualGoalDescription}
                onChangeText={setAnnualGoalDescription}
              />
            </View>
            <Pressable
              onPress={handleCreateAnnualGoal}
              disabled={createAnnualGoal.isPending || !annualGoalTitle.trim()}
              className="mt-4 h-11 items-center justify-center rounded-md bg-primary disabled:opacity-50"
            >
              {createAnnualGoal.isPending ? (
                <ActivityIndicator size="small" color="hsl(0 0% 9%)" />
              ) : (
                <Text className="text-sm font-medium text-primary-foreground">{t('createAnnualGoal')}</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
