import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react-native';
import type { FinanceStats } from '../types';

interface BalanceSummaryProps {
  stats: FinanceStats;
  className?: string;
}

export function BalanceSummary({ stats, className }: BalanceSummaryProps) {
  const currency = stats.currency || 'USD';

  return (
    <View className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {/* Total Balance */}
      <View className="items-center">
        <View className="flex-row items-center gap-2">
          <Icon as={Wallet} size={18} className="text-primary" />
          <Text className="text-sm text-muted-foreground">Total Balance</Text>
        </View>
        <Text className="mt-1 text-3xl font-bold text-card-foreground">
          {formatCurrency(stats.totalBalance, currency)}
        </Text>
      </View>

      {/* Income / Expenses / Net */}
      <View className="mt-5 flex-row gap-3">
        {/* Income */}
        <View className="flex-1 items-center rounded-lg bg-emerald-500/10 p-3">
          <View className="flex-row items-center gap-1">
            <Icon as={ArrowUpRight} size={14} className="text-emerald-500" />
            <Text className="text-xs text-emerald-600">Income</Text>
          </View>
          <Text className="mt-1 text-sm font-semibold text-emerald-600">
            {formatCurrency(stats.totalIncome, currency)}
          </Text>
        </View>

        {/* Expenses */}
        <View className="flex-1 items-center rounded-lg bg-red-500/10 p-3">
          <View className="flex-row items-center gap-1">
            <Icon as={ArrowDownRight} size={14} className="text-red-500" />
            <Text className="text-xs text-red-600">Expenses</Text>
          </View>
          <Text className="mt-1 text-sm font-semibold text-red-600">
            {formatCurrency(stats.totalExpenses, currency)}
          </Text>
        </View>

        {/* Net */}
        <View className="flex-1 items-center rounded-lg bg-primary/10 p-3">
          <View className="flex-row items-center gap-1">
            <Icon as={TrendingUp} size={14} className="text-primary" />
            <Text className="text-xs text-primary">Net</Text>
          </View>
          <Text
            className={cn(
              'mt-1 text-sm font-semibold',
              stats.netIncome >= 0 ? 'text-primary' : 'text-destructive',
            )}
          >
            {formatCurrency(stats.netIncome, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}
