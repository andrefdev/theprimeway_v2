import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useTransactions, useUpdateTransaction } from '@features/finances/hooks/useFinances';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { Transaction } from '@shared/types/models';

export default function PendingScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: transactionsData, isLoading } = useTransactions({ status: 'pending' });
  const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();

  const pending = transactionsData?.data ?? [];

  const handleApprove = (id: string) => {
    updateTransaction({ id, data: { status: 'reviewed' } });
  };

  const handleExclude = (id: string) => {
    updateTransaction({ id, data: { status: 'excluded' } });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-card-foreground">{item.description}</Text>
          {item.notes && (
            <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
              {item.notes}
            </Text>
          )}
          <Text className="mt-1 text-xs text-muted-foreground">
            {formatDate(item.date, 'MMM d, yyyy')}
          </Text>
        </View>
        <Text
          className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}
        >
          {item.type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount, item.currency)}
        </Text>
      </View>

      {item.tags && item.tags.length > 0 && (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {item.tags.map((tag) => (
            <View key={tag} className="rounded-md bg-muted px-2 py-0.5">
              <Text className="text-2xs text-muted-foreground">{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={() => handleApprove(item.id)}
          disabled={isUpdating}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 active:bg-emerald-500/20 disabled:opacity-50"
        >
          <CheckCircle size={14} color="rgb(16 185 129)" />
          <Text className="text-xs font-semibold text-emerald-600">
            {t('pending.approve')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleExclude(item.id)}
          disabled={isUpdating}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 py-2 active:bg-destructive/20 disabled:opacity-50"
        >
          <XCircle size={14} color="hsl(0, 72%, 51%)" />
          <Text className="text-xs font-semibold text-destructive">
            {t('pending.exclude')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (pending.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title={t('pending.messages.noPending')}
        description={t('pending.messages.allReviewed')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={pending}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center px-4 pb-5 pt-4">
            <Text className="text-xs text-muted-foreground">{t('pending.awaiting')}</Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">{pending.length}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">{t('pending.transactions')}</Text>
          </View>
        }
      />
    </View>
  );
}
