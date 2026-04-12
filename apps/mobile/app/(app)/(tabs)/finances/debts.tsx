import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useDebts } from '@features/finances/hooks/useFinances';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';
import { CreditCard } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { Debt } from '@shared/types/models';

export default function DebtsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: debts, isLoading } = useDebts();

  const totalDebt = debts?.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0) ?? 0;

  const renderDebt = ({ item }: { item: Debt }) => {
    const remaining = item.totalAmount - item.paidAmount;
    const progress =
      item.totalAmount > 0 ? Math.min((item.paidAmount / item.totalAmount) * 100, 100) : 0;

    return (
      <View className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-card-foreground">{item.name}</Text>
            {item.creditor && (
              <Text className="mt-0.5 text-xs text-muted-foreground">{item.creditor}</Text>
            )}
          </View>
          <Text className="text-sm font-bold text-card-foreground">
            {formatCurrency(remaining, item.currency)}
          </Text>
        </View>

        {/* Progress */}
        <View className="mt-3">
          <View className="flex-row items-end justify-between">
            <Text className="text-xs text-muted-foreground">
              {t('debts.fields.paidAmount')}: {formatCurrency(item.paidAmount, item.currency)} / {formatCurrency(item.totalAmount, item.currency)}
            </Text>
            <Text className="text-xs font-medium text-muted-foreground">
              {progress.toFixed(0)}%
            </Text>
          </View>

          <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <View
              className={cn(
                'h-full rounded-full',
                progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-primary' : 'bg-orange-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Details Row */}
        <View className="mt-3 flex-row items-center justify-between">
          {item.interestRate != null && item.interestRate > 0 && (
            <Text className="text-xs text-muted-foreground">
              {item.interestRate}% {t('debts.installments.interest')}
            </Text>
          )}
          {item.dueDate && (
            <Text className="text-xs text-muted-foreground">
              {t('debts.fields.dueDate')}: {formatDate(item.dueDate, 'MMM d, yyyy')}
            </Text>
          )}
          {item.installmentAmount != null && item.installmentAmount > 0 && (
            <Text className="text-xs text-muted-foreground">
              {formatCurrency(item.installmentAmount, item.currency)}{t('perMonth')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!debts || debts.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title={t('debts.messages.noDebtsYet')}
        description={t('debts.messages.addFirst')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={debts}
        renderItem={renderDebt}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center px-4 pb-5 pt-4">
            <Text className="text-xs text-muted-foreground">{t('debts.fields.remaining')}</Text>
            <Text className="mt-1 text-3xl font-bold text-destructive">
              {formatCurrency(totalDebt)}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {debts.length} {t('debts.title')}
            </Text>
          </View>
        }
      />
    </View>
  );
}
