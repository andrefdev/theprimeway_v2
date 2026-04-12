import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { formatCurrency } from '@/shared/utils/currency';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Card, CardContent } from '@/shared/components/ui/card';
import { IconCircle } from '@/shared/components/ui/icon-circle';
import { SectionHeader } from '@/shared/components/ui/section-header';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { TransactionItem } from '@features/finances/components/TransactionItem';
import { BudgetCard } from '@features/finances/components/BudgetCard';
import { TransactionFormSheet } from '@features/finances/components/TransactionFormSheet';
import {
  useFinanceStats,
  useTransactions,
  useBudgets,
  useSavingsGoals,
} from '@features/finances/hooks/useFinances';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  DollarSign,
  CreditCard,
  PiggyBank,
  Wallet as WalletIcon,
  RefreshCw,
  Clock,
} from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { TransactionType } from '@shared/types/models';

export default function FinancesDashboard() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { t: tDash } = useTranslation('features.dashboard');
  const { data: stats, isLoading: statsLoading } = useFinanceStats();
  const { data: transactionsData, isLoading: txLoading } = useTransactions({ pageSize: 5 });
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();
  const { data: savingsGoals } = useSavingsGoals();
  const { data: pendingData } = useTransactions({ status: 'pending' });

  const [showTransactionSheet, setShowTransactionSheet] = useState(false);
  const [initialType, setInitialType] = useState<TransactionType>('expense');

  const isLoading = statsLoading || txLoading || budgetsLoading;
  const recentTransactions = transactionsData?.data ?? [];
  const activeBudgets = budgets?.filter((b) => b.isActive).slice(0, 3) ?? [];
  const pendingCount = pendingData?.data?.length ?? 0;
  const activeSavingsGoals = savingsGoals?.filter((g) => g.status === 'active') ?? [];

  const openQuickAdd = (type: TransactionType) => {
    setInitialType(type);
    setShowTransactionSheet(true);
  };

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  const balance = stats?.totalBalance ?? 0;
  // Monthly figures — always scoped to the current calendar month
  const income = stats?.monthlyIncome ?? 0;
  const expenses = stats?.monthlyExpenses ?? 0;
  const net = stats?.monthlyNet ?? income - expenses;

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Hero */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card className="mt-1 border-primary/10">
            <CardContent>
              <Text className="text-xs text-muted-foreground">{t('totalBalance')}</Text>
              <Text className="mt-1 text-3xl font-bold text-foreground">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text className={`mt-1 text-xs font-medium ${net >= 0 ? 'text-success' : 'text-destructive'}`}>
                {net >= 0 ? '+' : ''}${net.toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('thisMonth')}
              </Text>
            </CardContent>
          </Card>
        </Animated.View>

        {/* Cash Flow Cards */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="mt-3 flex-row gap-3">
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-success/15">
                <Icon as={TrendingUp} size={12} className="text-success" />
              </View>
              <Text className="text-2xs text-muted-foreground">{t('incomeShort')}</Text>
            </View>
            <Text className="mt-2 text-lg font-bold text-success">
              +${income.toLocaleString()}
            </Text>
          </View>

          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-destructive/15">
                <Icon as={TrendingDown} size={12} className="text-destructive" />
              </View>
              <Text className="text-2xs text-muted-foreground">{t('expensesShort')}</Text>
            </View>
            <Text className="mt-2 text-lg font-bold text-destructive">
              -${expenses.toLocaleString()}
            </Text>
          </View>

          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                <Icon as={DollarSign} size={12} className="text-primary" />
              </View>
              <Text className="text-2xs text-muted-foreground">{t('net')}</Text>
            </View>
            <Text className={`mt-2 text-lg font-bold ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {net >= 0 ? '+' : ''}${net.toLocaleString()}
            </Text>
          </View>
        </Animated.View>

        {/* Quick Actions - now open form directly */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-6">
          <View className="flex-row justify-between">
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3 active:bg-destructive/10"
              onPress={() => openQuickAdd('expense')}
            >
              <Minus size={16} color="hsl(0, 72%, 51%)" />
              <Text className="text-sm font-medium text-destructive">{t('expense')}</Text>
            </Pressable>
            <View className="w-3" />
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/5 py-3 active:bg-success/10"
              onPress={() => openQuickAdd('income')}
            >
              <Plus size={16} color="hsl(142, 71%, 45%)" />
              <Text className="text-sm font-medium text-success">{t('income')}</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Navigation Grid - Row 1 */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} className="mt-6 flex-row gap-3">
          <QuickNav icon={CreditCard} label={t('accounts.title')} route="/(app)/(tabs)/finances/accounts" />
          <QuickNav icon={WalletIcon} label={t('debts.title')} route="/(app)/(tabs)/finances/debts" />
          <QuickNav icon={PiggyBank} label={t('savingsShort')} route="/(app)/(tabs)/finances/savings" />
        </Animated.View>

        {/* Navigation Grid - Row 2 */}
        <Animated.View entering={FadeInDown.delay(175).duration(300)} className="mt-3 flex-row gap-3">
          <QuickNav
            icon={RefreshCw}
            label={t('recurringExpenses.title')}
            route="/(app)/(tabs)/finances/recurring"
          />
          <QuickNav
            icon={TrendingUp}
            label={t('incomeSection.title')}
            route="/(app)/(tabs)/finances/income"
          />
          <QuickNavBadge
            icon={Clock}
            label={t('pending.title')}
            route="/(app)/(tabs)/finances/pending"
            badge={pendingCount}
          />
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mt-6">
          <SectionHeader
            title={t('recentTransactions')}
            actionLabel={tDash('seeAll')}
            onAction={() => router.push('/(app)/(tabs)/finances/transactions')}
          />
          {recentTransactions.length > 0 ? (
            <View className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
              {recentTransactions.map((tx, index) => (
                <View key={tx.id}>
                  <TransactionItem transaction={tx} />
                  {index < recentTransactions.length - 1 && <View className="mx-4 h-px bg-border" />}
                </View>
              ))}
            </View>
          ) : (
            <Card className="mt-3">
              <CardContent className="items-center py-6">
                <Icon as={DollarSign} size={32} className="text-muted-foreground/50" />
                <Text className="mt-2 text-sm text-muted-foreground">{t('noTransactionsYet')}</Text>
              </CardContent>
            </Card>
          )}
        </Animated.View>

        {/* Active Budgets */}
        {activeBudgets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(300)} className="mt-6">
            <SectionHeader
              title={t('activeBudgets')}
              actionLabel={tDash('seeAll')}
              onAction={() => router.push('/(app)/(tabs)/finances/budgets')}
            />
            <View className="mt-3 gap-3">
              {activeBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Savings Overview */}
        {activeSavingsGoals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(300)} className="mt-6">
            <SectionHeader
              title={t('savingsOverview')}
              actionLabel={tDash('seeAll')}
              onAction={() => router.push('/(app)/(tabs)/finances/savings')}
            />
            <View className="mt-3 gap-3">
              {activeSavingsGoals.slice(0, 3).map((goal) => {
                const progress =
                  goal.targetAmount > 0
                    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                    : 0;
                return (
                  <View key={goal.id} className="rounded-xl border border-border bg-card p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-card-foreground">
                          {goal.name}
                        </Text>
                        <Text className="mt-0.5 text-xs text-muted-foreground">
                          {formatCurrency(goal.currentAmount, goal.currency)} /{' '}
                          {formatCurrency(goal.targetAmount, goal.currency)}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-primary">
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                    <View className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <View
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                    {goal.monthlyContribution != null && goal.monthlyContribution > 0 && (
                      <Text className="mt-2 text-xs text-muted-foreground">
                        {formatCurrency(goal.monthlyContribution, goal.currency)}{t('perMonth')}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Transaction Form Sheet */}
      <TransactionFormSheet
        isOpen={showTransactionSheet}
        onClose={() => setShowTransactionSheet(false)}
        initialType={initialType}
      />
    </>
  );
}

function QuickNav({
  icon,
  label,
  route,
}: {
  icon: typeof CreditCard;
  label: string;
  route: string;
}) {
  return (
    <Pressable
      onPress={() => router.push(route as never)}
      className="flex-1 items-center rounded-xl border border-border bg-card py-4 active:bg-muted"
    >
      <IconCircle icon={icon} color="primary" size="sm" />
      <Text className="mt-2 text-xs font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}

function QuickNavBadge({
  icon,
  label,
  route,
  badge,
}: {
  icon: typeof CreditCard;
  label: string;
  route: string;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={() => router.push(route as never)}
      className="flex-1 items-center rounded-xl border border-border bg-card py-4 active:bg-muted"
    >
      <View className="relative">
        <IconCircle icon={icon} color="primary" size="sm" />
        {badge != null && badge > 0 && (
          <View className="absolute -right-1.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5">
            <Text className="text-2xs font-bold text-destructive-foreground">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text className="mt-2 text-xs font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}
