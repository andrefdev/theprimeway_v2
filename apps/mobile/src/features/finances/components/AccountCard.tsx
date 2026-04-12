import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import {
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Banknote,
  CircleDollarSign,
} from 'lucide-react-native';
import type { FinanceAccount, AccountType } from '@shared/types/models';
import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';

const ACCOUNT_ICONS: Record<AccountType, LucideIcon> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  cash: Banknote,
  other: CircleDollarSign,
};

const ACCOUNT_COLORS: Record<AccountType, string> = {
  checking: 'text-blue-500',
  savings: 'text-emerald-500',
  credit: 'text-orange-500',
  investment: 'text-purple-500',
  cash: 'text-green-500',
  other: 'text-muted-foreground',
};

interface AccountCardProps {
  account: FinanceAccount;
  onPress?: () => void;
  className?: string;
}

export function AccountCard({ account, onPress, className }: AccountCardProps) {
  const { t } = useTranslation('features.finances');
  const AccountIcon = ACCOUNT_ICONS[account.type] || Wallet;
  const iconColor = ACCOUNT_COLORS[account.type] || 'text-muted-foreground';

  return (
    <Pressable
      onPress={onPress}
      className={cn('rounded-xl border border-border bg-card p-4', className)}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon as={AccountIcon} size={20} className={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-card-foreground">{account.name}</Text>
          {account.bankName && (
            <Text className="text-xs text-muted-foreground">{account.bankName}</Text>
          )}
        </View>
      </View>

      <View className="mt-3 flex-row items-end justify-between">
        <View>
          <Text className="text-xs text-muted-foreground">{t('accounts.currentBalance')}</Text>
          <Text
            className={cn(
              'text-lg font-bold',
              account.currentBalance >= 0 ? 'text-card-foreground' : 'text-destructive',
            )}
          >
            {formatCurrency(account.currentBalance, account.currency)}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">{t(`accountForm.types.${account.type}`)}</Text>
      </View>
    </Pressable>
  );
}
