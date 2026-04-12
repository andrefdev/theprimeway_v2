import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { AccountCard } from '@features/finances/components/AccountCard';
import { useAccounts } from '@features/finances/hooks/useFinances';
import { formatCurrency } from '@/shared/utils/currency';
import { CreditCard } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { FinanceAccount } from '@shared/types/models';

export default function AccountsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: accounts, isLoading } = useAccounts();

  const totalBalance =
    accounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) ?? 0;

  const renderAccount = ({ item }: { item: FinanceAccount }) => (
    <View className="px-4 pb-3">
      <AccountCard account={item} />
    </View>
  );

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!accounts || accounts.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title={t('accounts.noAccountsFound')}
        description={t('accounts.noAccountsDescription')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center px-4 pb-5 pt-4">
            <Text className="text-xs text-muted-foreground">{t('totalBalance')}</Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">
              {formatCurrency(totalBalance)}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {accounts.length} {t('accounts.title')}
            </Text>
          </View>
        }
      />
    </View>
  );
}
