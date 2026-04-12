import { View, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import {
  useFinanceStats,
  useSavingsGoals,
  useDebts,
  useAccounts,
} from '@features/finances/hooks/useFinances';
import { useInvestmentsSummary } from '@features/finances/hooks/useInvestments';
import { formatCurrency } from '@/shared/utils/currency';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PiggyBank,
  Shield,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { cn } from '@/shared/utils/cn';

export default function AnalyticsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');

  const { data: stats, isLoading: statsLoading } = useFinanceStats();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const { data: savingsGoals, isLoading: savingsLoading } = useSavingsGoals();
  const { data: investmentsSummary, isLoading: investmentsLoading } = useInvestmentsSummary();

  const isLoading =
    statsLoading || accountsLoading || debtsLoading || savingsLoading || investmentsLoading;

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  // ── Computed values ───────────────────────────────────────────────
  const accountsBalance =
    accounts?.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0) ?? 0;

  const investmentsValue = investmentsSummary?.totalCurrentValue ?? 0;

  const totalDebt =
    debts?.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0) ?? 0;

  const totalAssets = accountsBalance + investmentsValue;
  const totalLiabilities = totalDebt;
  const netWorth = totalAssets - totalLiabilities;
  const netWorthPositive = netWorth >= 0;

  // Cash flow from stats
  const monthlyIncome = stats?.monthlyIncome ?? 0;
  const monthlyExpenses = stats?.monthlyExpenses ?? 0;
  const cashFlowMax = Math.max(monthlyIncome, monthlyExpenses, 1);
  const incomeRatio = Math.min(monthlyIncome / cashFlowMax, 1);
  const expensesRatio = Math.min(monthlyExpenses / cashFlowMax, 1);

  // Investments
  const totalInvested = investmentsSummary?.totalInvested ?? 0;
  const investmentGain = investmentsValue - totalInvested;
  const investmentGainPercent =
    totalInvested > 0 ? (investmentGain / totalInvested) * 100 : 0;
  const hasInvestments = (investmentsSummary?.count ?? 0) > 0;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Net Worth Hero ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View className="items-center px-4 py-8">
            <View className="mb-2 flex-row items-center gap-2">
              <Icon
                as={netWorthPositive ? TrendingUp : TrendingDown}
                size={20}
                className={netWorthPositive ? 'text-success' : 'text-destructive'}
              />
              <Text className="text-sm font-medium text-muted-foreground">Net Worth</Text>
            </View>
            <Text
              className={cn(
                'text-4xl font-bold',
                netWorthPositive ? 'text-success' : 'text-destructive',
              )}
            >
              {formatCurrency(netWorth)}
            </Text>
            <Text className="mt-2 text-xs text-muted-foreground">
              Total assets minus total liabilities
            </Text>
          </View>
        </Animated.View>

        {/* ── Assets vs Liabilities ─────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <View className="mx-4 mb-4 flex-row gap-3">
            {/* Assets Card */}
            <View className="flex-1 rounded-xl border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-success/15">
                  <Icon as={TrendingUp} size={16} className="text-success" />
                </View>
                <Text className="text-xs font-medium text-muted-foreground">Assets</Text>
              </View>
              <Text className="text-lg font-bold text-success">
                {formatCurrency(totalAssets)}
              </Text>
              <Text className="mt-1 text-2xs text-muted-foreground">
                Cash + Investments
              </Text>
            </View>

            {/* Liabilities Card */}
            <View className="flex-1 rounded-xl border border-border bg-card p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/15">
                  <Icon as={Shield} size={16} className="text-destructive" />
                </View>
                <Text className="text-xs font-medium text-muted-foreground">Liabilities</Text>
              </View>
              <Text className="text-lg font-bold text-destructive">
                {formatCurrency(totalLiabilities)}
              </Text>
              <Text className="mt-1 text-2xs text-muted-foreground">
                Total debts
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Cash Flow ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <View className="mx-4 mb-4 rounded-xl border border-border bg-card p-4">
            <View className="mb-4 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                <Icon as={BarChart3} size={16} className="text-primary" />
              </View>
              <Text className="text-sm font-semibold text-card-foreground">
                Monthly Cash Flow
              </Text>
            </View>

            {/* Income row */}
            <View className="mb-3">
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-muted-foreground">Income</Text>
                <Text className="text-xs font-semibold text-success">
                  {formatCurrency(monthlyIncome)}
                </Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-success"
                  style={{ width: `${incomeRatio * 100}%` }}
                />
              </View>
            </View>

            {/* Expenses row */}
            <View className="mb-3">
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-muted-foreground">Expenses</Text>
                <Text className="text-xs font-semibold text-destructive">
                  {formatCurrency(monthlyExpenses)}
                </Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-destructive"
                  style={{ width: `${expensesRatio * 100}%` }}
                />
              </View>
            </View>

            {/* Net */}
            <View className="mt-1 flex-row items-center justify-between border-t border-border pt-3">
              <Text className="text-xs font-medium text-muted-foreground">Net</Text>
              <Text
                className={cn(
                  'text-sm font-bold',
                  monthlyIncome - monthlyExpenses >= 0
                    ? 'text-success'
                    : 'text-destructive',
                )}
              >
                {formatCurrency(monthlyIncome - monthlyExpenses)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Investment Portfolio ───────────────────────────── */}
        {hasInvestments && (
          <Animated.View entering={FadeInDown.delay(180).duration(300)}>
            <View className="mx-4 mb-4 rounded-xl border border-border bg-card p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-info/15">
                  <Icon as={DollarSign} size={16} className="text-info" />
                </View>
                <Text className="text-sm font-semibold text-card-foreground">
                  Investment Portfolio
                </Text>
              </View>

              <View className="gap-3">
                {/* Total invested */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">Total Invested</Text>
                  <Text className="text-sm font-semibold text-card-foreground">
                    {formatCurrency(totalInvested)}
                  </Text>
                </View>

                {/* Current value */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">Current Value</Text>
                  <Text className="text-sm font-semibold text-card-foreground">
                    {formatCurrency(investmentsValue)}
                  </Text>
                </View>

                {/* Gain / Loss */}
                <View className="flex-row items-center justify-between border-t border-border pt-3">
                  <Text className="text-xs font-medium text-muted-foreground">Gain / Loss</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Icon
                      as={investmentGain >= 0 ? TrendingUp : TrendingDown}
                      size={14}
                      className={investmentGain >= 0 ? 'text-success' : 'text-destructive'}
                    />
                    <Text
                      className={cn(
                        'text-sm font-bold',
                        investmentGain >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {formatCurrency(investmentGain)} ({investmentGainPercent >= 0 ? '+' : ''}
                      {investmentGainPercent.toFixed(2)}%)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Savings Goals ──────────────────────────────────── */}
        {savingsGoals && savingsGoals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(300)}>
            <View className="mx-4 mb-4 rounded-xl border border-border bg-card p-4">
              <View className="mb-4 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-warning/15">
                  <Icon as={PiggyBank} size={16} className="text-warning" />
                </View>
                <Text className="text-sm font-semibold text-card-foreground">
                  Savings Goals
                </Text>
              </View>

              <View className="gap-4">
                {savingsGoals.map((goal, index) => {
                  const progress =
                    goal.targetAmount > 0
                      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                      : 0;
                  return (
                    <Animated.View
                      key={goal.id}
                      entering={FadeInDown.delay(260 + index * 40).duration(300)}
                    >
                      <View className="flex-row items-start justify-between">
                        <Text className="flex-1 text-sm font-medium text-card-foreground" numberOfLines={1}>
                          {goal.name}
                        </Text>
                        <Text className="ml-2 text-xs font-semibold text-card-foreground">
                          {progress.toFixed(0)}%
                        </Text>
                      </View>

                      <View className="mt-1 flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">
                          {formatCurrency(goal.currentAmount, goal.currency)} /{' '}
                          {formatCurrency(goal.targetAmount, goal.currency)}
                        </Text>
                      </View>

                      <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <View
                          className={cn(
                            'h-full rounded-full',
                            progress >= 100
                              ? 'bg-success'
                              : progress > 50
                                ? 'bg-primary'
                                : 'bg-warning',
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
