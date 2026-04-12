import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { TransactionItem } from '@features/finances/components/TransactionItem';
import { useTransactions } from '@features/finances/hooks/useFinances';
import { cn } from '@/shared/utils/cn';
import { Wallet } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { Transaction, TransactionType } from '@shared/types/models';

type FilterType = 'all' | TransactionType;

const FILTERS: FilterType[] = ['all', 'income', 'expense', 'transfer'];

export default function TransactionsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');

  const FILTER_LABELS: Record<FilterType, string> = {
    all: t('transactions.filters.allTypes'),
    income: t('transactions.income'),
    expense: t('transactions.expense'),
    transfer: t('transactions.transfer'),
  };

  const [filter, setFilter] = useState<FilterType>('all');

  const queryParams = filter === 'all' ? {} : { type: filter as TransactionType };
  const { data: transactionsData, isLoading } = useTransactions(queryParams);

  const transactions = transactionsData?.data ?? [];

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} />
  );

  const renderSeparator = () => <View className="mx-4 h-px bg-border" />;

  return (
    <View className="flex-1 bg-background">
      {/* Inline filter row — not a sheet, just simple chips */}
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1.5',
              filter === f ? 'bg-primary' : 'bg-muted',
            )}
          >
            <Text
              className={cn(
                'text-xs font-medium',
                filter === f ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {FILTER_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingOverlay message={tCommon('actions.loading')} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t('transactions.noTransactions')}
          description={t('transactions.latestActivity')}
        />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
        />
      )}
    </View>
  );
}
