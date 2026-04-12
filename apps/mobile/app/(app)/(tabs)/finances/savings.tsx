import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useSavingsGoals } from '@features/finances/hooks/useFinances';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';
import { PiggyBank } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { SavingsGoal } from '@shared/types/models';

export default function SavingsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: goals, isLoading } = useSavingsGoals();

  const activeGoals = goals?.filter((g) => g.status === 'active') ?? [];
  const completedGoals = goals?.filter((g) => g.status === 'completed') ?? [];
  const allGoals = [...activeGoals, ...completedGoals];

  const totalSaved = goals?.reduce((sum, g) => sum + g.currentAmount, 0) ?? 0;
  const totalTarget = goals?.reduce((sum, g) => sum + g.targetAmount, 0) ?? 0;

  const renderGoal = ({ item }: { item: SavingsGoal }) => {
    const progress =
      item.targetAmount > 0
        ? Math.min((item.currentAmount / item.targetAmount) * 100, 100)
        : 0;
    const isCompleted = item.status === 'completed';

    return (
      <View className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-semibold text-card-foreground">{item.name}</Text>
              {isCompleted && (
                <View className="rounded-full bg-emerald-500/10 px-2 py-0.5">
                  <Text className="text-[10px] font-medium text-emerald-600">{tCommon('status.completed')}</Text>
                </View>
              )}
              {item.status === 'paused' && (
                <View className="rounded-full bg-orange-500/10 px-2 py-0.5">
                  <Text className="text-[10px] font-medium text-orange-600">{tCommon('status.pending')}</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <Icon as={PiggyBank} size={20} className="text-primary" />
        </View>

        {/* Amount */}
        <View className="mt-3 flex-row items-end justify-between">
          <Text className="text-lg font-bold text-primary">
            {formatCurrency(item.currentAmount, item.currency)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {t('ofAmount', { amount: formatCurrency(item.targetAmount, item.currency) })}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <View
            className={cn(
              'h-full rounded-full',
              isCompleted ? 'bg-emerald-500' : 'bg-primary',
            )}
            style={{ width: `${progress}%` }}
          />
        </View>

        {/* Footer */}
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs font-medium text-muted-foreground">
            {progress.toFixed(0)}% {t('savingsRate')}
          </Text>
          <View className="flex-row gap-3">
            {item.monthlyContribution != null && item.monthlyContribution > 0 && (
              <Text className="text-xs text-muted-foreground">
                {formatCurrency(item.monthlyContribution, item.currency)}{t('perMonth')}
              </Text>
            )}
            {item.targetDate && (
              <Text className="text-xs text-muted-foreground">
                {t('targetLabel')}: {formatDate(item.targetDate, 'MMM yyyy')}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!goals || goals.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title={t('goals.noGoals')}
        description={t('setSavingsTarget')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={allGoals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center px-4 pb-5 pt-4">
            <Text className="text-xs text-muted-foreground">{t('totalBalance')}</Text>
            <Text className="mt-1 text-3xl font-bold text-primary">
              {formatCurrency(totalSaved)}
            </Text>
            {totalTarget > 0 && (
              <Text className="mt-1 text-xs text-muted-foreground">
                {((totalSaved / totalTarget) * 100).toFixed(0)}%{' '}
                {t('ofAmount', { amount: formatCurrency(totalTarget) })}
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}
