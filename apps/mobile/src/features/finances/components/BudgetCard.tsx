import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import type { Budget } from '@shared/types/models';

interface BudgetCardProps {
  budget: Budget;
  spent?: number;
  onPress?: () => void;
  className?: string;
}

export function BudgetCard({ budget, spent = 0, onPress, className }: BudgetCardProps) {
  const progress = budget.totalAmount > 0 ? Math.min((spent / budget.totalAmount) * 100, 100) : 0;
  const remaining = budget.totalAmount - spent;
  const isOverBudget = remaining < 0;

  return (
    <Pressable
      onPress={onPress}
      className={cn('rounded-xl border border-border bg-card p-4', className)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-card-foreground">{budget.name}</Text>
          {budget.description && (
            <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
              {budget.description}
            </Text>
          )}
        </View>
        <Text
          className={cn(
            'text-xs font-medium capitalize',
            budget.categoryType === 'expense' ? 'text-red-500' : 'text-emerald-500',
          )}
        >
          {budget.categoryType}
        </Text>
      </View>

      <View className="mt-3">
        <View className="flex-row items-end justify-between">
          <Text className="text-xs text-muted-foreground">
            {formatCurrency(spent, budget.currency)} of{' '}
            {formatCurrency(budget.totalAmount, budget.currency)}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {progress.toFixed(0)}%
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <View
            className={cn(
              'h-full rounded-full',
              isOverBudget
                ? 'bg-destructive'
                : progress > 80
                  ? 'bg-orange-500'
                  : 'bg-primary',
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text
          className={cn(
            'text-xs font-medium',
            isOverBudget ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {isOverBudget
            ? `Over by ${formatCurrency(Math.abs(remaining), budget.currency)}`
            : `${formatCurrency(remaining, budget.currency)} remaining`}
        </Text>
        <Text className="text-xs text-muted-foreground">{budget.periodType}</Text>
      </View>
    </Pressable>
  );
}
