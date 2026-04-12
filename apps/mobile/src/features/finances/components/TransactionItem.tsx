import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react-native';
import type { Transaction, TransactionType } from '@shared/types/models';

const TYPE_CONFIG: Record<TransactionType, { icon: typeof ArrowUpRight; color: string; sign: string }> = {
  income: { icon: ArrowUpRight, color: 'text-emerald-500', sign: '+' },
  expense: { icon: ArrowDownRight, color: 'text-red-500', sign: '-' },
  transfer: { icon: ArrowLeftRight, color: 'text-blue-500', sign: '' },
};

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  className?: string;
}

export function TransactionItem({ transaction, onPress, className }: TransactionItemProps) {
  const config = TYPE_CONFIG[transaction.type];
  const TypeIcon = config.icon;

  return (
    <Pressable
      onPress={onPress}
      className={cn('flex-row items-center gap-3 px-4 py-3', className)}
    >
      <View
        className={cn(
          'h-9 w-9 items-center justify-center rounded-full',
          transaction.type === 'income' && 'bg-emerald-500/10',
          transaction.type === 'expense' && 'bg-red-500/10',
          transaction.type === 'transfer' && 'bg-blue-500/10',
        )}
      >
        <Icon as={TypeIcon} size={18} className={config.color} />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {formatDate(transaction.date, 'MMM d, yyyy')}
        </Text>
      </View>

      <Text
        className={cn(
          'text-sm font-semibold',
          transaction.type === 'income' && 'text-emerald-500',
          transaction.type === 'expense' && 'text-red-500',
          transaction.type === 'transfer' && 'text-blue-500',
        )}
      >
        {config.sign}
        {formatCurrency(transaction.amount, transaction.currency)}
      </Text>
    </Pressable>
  );
}
