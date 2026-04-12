import { useState } from 'react';
import { Screen, ScreenContent } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { useQuarterlyGoals, useWeeklyGoals, useCreateWeeklyGoal } from '@/features/goals/hooks/useGoals';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ListChecks,
  FileText,
} from 'lucide-react-native';
import { View, ScrollView, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { LucideIcon } from 'lucide-react-native';
import type { WeeklyGoal } from '@shared/types/models';

const STATUS_ICONS: Record<
  WeeklyGoal['status'],
  { icon: LucideIcon; color: string }
> = {
  planned: { icon: Circle, color: '#9ca3af' },
  in_progress: { icon: Clock, color: '#3b82f6' },
  completed: { icon: CheckCircle2, color: '#10b981' },
  canceled: { icon: XCircle, color: '#ef4444' },
};

const STATUS_KEYS: Record<WeeklyGoal['status'], string> = {
  planned: 'status.notStarted',
  in_progress: 'status.inProgress',
  completed: 'status.completed',
  canceled: 'status.cancelled',
};

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

export default function QuarterlyGoalDetailScreen() {
  const { t } = useTranslation('features.goals');
  const { t: tCommon } = useTranslation('common');
  const { locale } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: quarterlyGoals, isLoading: quarterlyGoalsLoading, isError: quarterlyGoalsError, refetch: refetchQuarterlyGoals } = useQuarterlyGoals();
  const { data: allWeeklyGoals, isLoading: weeklyLoading, isError: weeklyError, refetch: refetchWeekly } = useWeeklyGoals();
  const createWeeklyGoal = useCreateWeeklyGoal();

  const [showForm, setShowForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');

  const isLoading = quarterlyGoalsLoading || weeklyLoading;
  const isError = quarterlyGoalsError || weeklyError;

  const handleCreateWeeklyGoal = async () => {
    if (!goalTitle.trim() || !id) return;
    await createWeeklyGoal.mutateAsync({
      quarterlyGoalId: id,
      title: goalTitle.trim(),
      description: goalDescription.trim() || undefined,
      weekStartDate: getMonday(),
      order: (allWeeklyGoals ?? []).filter((wg) => wg.quarterlyGoalId === id).length,
    });
    setGoalTitle('');
    setGoalDescription('');
    setShowForm(false);
  };

  const quarterlyGoal = quarterlyGoals?.find((f) => f.id === id);
  const weeklyGoals = (allWeeklyGoals ?? [])
    .filter((wg) => wg.quarterlyGoalId === id)
    .sort((a, b) => a.order - b.order);

  const formattedPeriod =
    quarterlyGoal?.startDate && quarterlyGoal?.endDate
      ? `${new Date(quarterlyGoal.startDate).toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
        })} - ${new Date(quarterlyGoal.endDate).toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`
      : null;

  if (isLoading) {
    return (
      <Screen>
        <Header title={t('quarterlyGoal.title')} showBack />
        <LoadingOverlay message={tCommon('actions.loading')} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Header title={t('quarterlyGoal.title')} showBack />
        <ErrorState
          onRetry={() => {
            refetchQuarterlyGoals();
            refetchWeekly();
          }}
        />
      </Screen>
    );
  }

  if (!quarterlyGoal) {
    return (
      <Screen>
        <Header title={t('quarterlyGoal.title')} showBack />
        <EmptyState
          icon={FileText}
          title={t('quarterlyGoal.title')}
        />
      </Screen>
    );
  }

  const completedCount = weeklyGoals.filter((wg) => wg.status === 'completed').length;

  return (
    <Screen>
      <Header
        title={`Q${quarterlyGoal.quarter} ${quarterlyGoal.year}`}
        showBack
        rightAction={
          <Pressable onPress={() => setShowForm(true)} hitSlop={8}>
            <Icon as={Plus} size={20} className="text-foreground" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent>
          {/* Quarterly Goal Header Card */}
          <View className="mb-5 rounded-xl border border-border bg-card p-5">
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon as={Calendar} size={20} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-card-foreground">{quarterlyGoal.title}</Text>
                <View className="mt-0.5 flex-row items-center gap-1">
                  <Text className="text-xs font-medium text-primary">
                    Q{quarterlyGoal.quarter} {quarterlyGoal.year}
                  </Text>
                  {formattedPeriod && (
                    <Text className="text-xs text-muted-foreground"> -- {formattedPeriod}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="mb-2 flex-row items-center gap-3">
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${quarterlyGoal.progress ?? 0}%` }}
                />
              </View>
              <Text className="text-sm font-semibold text-primary">
                {quarterlyGoal.progress ?? 0}%
              </Text>
            </View>

            {/* Stats */}
            <Text className="text-xs text-muted-foreground">
              {completedCount}/{weeklyGoals.length} {tCommon('status.completed')}
            </Text>
          </View>

          {/* Weekly Goals Section */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">{t('weeklyGoals')}</Text>
            <Text className="text-xs text-muted-foreground">
              {weeklyGoals.length} {t('title')}
            </Text>
          </View>

          {weeklyGoals.length > 0 ? (
            <View className="gap-3">
              {weeklyGoals.map((goal) => {
                const statusIcon = STATUS_ICONS[goal.status];
                const StatusIcon = statusIcon.icon;

                return (
                  <View
                    key={goal.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <View className="flex-row items-start gap-3">
                      <Icon
                        as={StatusIcon}
                        size={18}
                        color={statusIcon.color}
                        className="mt-0.5"
                      />
                      <View className="flex-1">
                        <Text
                          className="text-sm font-semibold text-card-foreground"
                          numberOfLines={2}
                        >
                          {goal.title}
                        </Text>
                        {goal.description && (
                          <Text
                            className="mt-1 text-xs text-muted-foreground"
                            numberOfLines={2}
                          >
                            {goal.description}
                          </Text>
                        )}
                        <View className="mt-2 flex-row items-center gap-2">
                          <View
                            className="rounded px-2 py-0.5"
                            style={{ backgroundColor: `${statusIcon.color}15` }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: statusIcon.color }}
                            >
                              {t(STATUS_KEYS[goal.status])}
                            </Text>
                          </View>
                          <Text className="text-xs text-muted-foreground">
                            {new Date(goal.weekStartDate).toLocaleDateString(locale, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={ListChecks}
              title={t('noQuarterlyGoals')}
              actionLabel={t('actions.create')}
              onAction={() => setShowForm(true)}
            />
          )}
        </ScreenContent>
      </ScrollView>

      {/* Create Weekly Goal Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
          <Header
            title={t('createWeeklyGoal')}
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
                value={goalTitle}
                onChangeText={setGoalTitle}
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
                value={goalDescription}
                onChangeText={setGoalDescription}
              />
            </View>
            <Pressable
              onPress={handleCreateWeeklyGoal}
              disabled={createWeeklyGoal.isPending || !goalTitle.trim()}
              className="mt-4 h-11 items-center justify-center rounded-md bg-primary disabled:opacity-50"
            >
              {createWeeklyGoal.isPending ? (
                <ActivityIndicator size="small" color="hsl(0 0% 9%)" />
              ) : (
                <Text className="text-sm font-medium text-primary-foreground">{t('createWeeklyGoal')}</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
