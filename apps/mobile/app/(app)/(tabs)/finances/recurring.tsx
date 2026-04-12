import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useRecurringExpenses } from '@features/finances/hooks/useFinances';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';
import { RefreshCw, Zap } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { RecurringExpense, RecurringExpenseCategory } from '@shared/types/models';

const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  monthly: 1,
  bimonthly: 0.5,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  annual: 1 / 12,
};

const CATEGORY_COLORS: Record<RecurringExpenseCategory, string> = {
  housing: 'bg-blue-500/15 text-blue-600',
  utilities: 'bg-yellow-500/15 text-yellow-600',
  insurance: 'bg-purple-500/15 text-purple-600',
  subscriptions: 'bg-pink-500/15 text-pink-600',
  transport: 'bg-orange-500/15 text-orange-600',
  food: 'bg-green-500/15 text-green-600',
  health: 'bg-red-500/15 text-red-600',
  education: 'bg-indigo-500/15 text-indigo-600',
  personal: 'bg-teal-500/15 text-teal-600',
  other: 'bg-muted text-muted-foreground',
};

function getMonthlyEquivalent(amount: number, frequency: string): number {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] ?? 1;
  return amount * multiplier;
}

export default function RecurringScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: expenses, isLoading } = useRecurringExpenses();

  const totalMonthly =
    expenses?.reduce((sum, e) => {
      if (!e.isActive) return sum;
      return sum + getMonthlyEquivalent(e.amount, e.frequency);
    }, 0) ?? 0;

  const renderExpense = ({ item }: { item: RecurringExpense }) => {
    const monthly = getMonthlyEquivalent(item.amount, item.frequency);
    const categoryStyle = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other;

    return (
      <View className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-card-foreground">{item.name}</Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
              <View className={cn('rounded-md px-2 py-0.5', categoryStyle.split(' ')[0])}>
                <Text className={cn('text-2xs font-medium capitalize', categoryStyle.split(' ')[1])}>
                  {item.category}
                </Text>
              </View>
              <View className="rounded-md bg-muted px-2 py-0.5">
                <Text className="text-2xs text-muted-foreground capitalize">{item.frequency}</Text>
              </View>
              {item.isAutoPay && (
                <View className="flex-row items-center gap-0.5 rounded-md bg-primary/10 px-2 py-0.5">
                  <Zap size={9} color="hsl(var(--primary))" />
                  <Text className="text-2xs font-medium text-primary">
                    {t('recurringExpenses.autoPay')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {!item.isActive && (
            <View className="rounded-full bg-muted px-2 py-0.5">
              <Text className="text-2xs text-muted-foreground">{t('recurringExpenses.inactive')}</Text>
            </View>
          )}
        </View>

        <View className="mt-3 flex-row items-end justify-between">
          <View>
            <Text className="text-xs text-muted-foreground">
              {t('recurringExpenses.amount')}
            </Text>
            <Text className="mt-0.5 text-base font-bold text-card-foreground">
              {formatCurrency(item.amount, item.currency)}
            </Text>
          </View>
          <View className="items-end">
            {item.paymentDay != null && (
              <Text className="text-xs text-muted-foreground">
                {t('recurringExpenses.paymentDay')} {item.paymentDay}
              </Text>
            )}
            <Text className="mt-0.5 text-sm font-semibold text-destructive">
              {formatCurrency(monthly, item.currency)}{t('perMonth')}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text className="mt-2 text-xs text-muted-foreground" numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={t('recurringExpenses.messages.noExpensesYet')}
        description={t('recurringExpenses.messages.addFirst')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center px-4 pb-5 pt-4">
            <Text className="text-xs text-muted-foreground">
              {t('recurringExpenses.totalMonthly')}
            </Text>
            <Text className="mt-1 text-3xl font-bold text-destructive">
              {formatCurrency(totalMonthly)}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {expenses.filter((e) => e.isActive).length} {t('recurringExpenses.activeExpenses')}
            </Text>
          </View>
        }
      />
    </View>
  );
}
