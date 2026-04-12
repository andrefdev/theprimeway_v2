import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useIncomeSources } from '@features/finances/hooks/useFinances';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';
import { TrendingUp } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { IncomeSource } from '@shared/types/models';

const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  annual: 1 / 12,
};

function getMonthlyEquivalent(amount: number, frequency: string): number {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] ?? 1;
  return amount * multiplier;
}

export default function IncomeScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: sources, isLoading } = useIncomeSources();

  const totalMonthly =
    sources?.reduce((sum, s) => {
      if (!s.isActive) return sum;
      return sum + getMonthlyEquivalent(s.amount, s.frequency);
    }, 0) ?? 0;

  const renderSource = ({ item }: { item: IncomeSource }) => {
    const monthly = getMonthlyEquivalent(item.amount, item.frequency);

    return (
      <View className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-card-foreground">{item.name}</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View className="rounded-md bg-muted px-2 py-0.5">
                <Text className="text-2xs text-muted-foreground capitalize">{item.type}</Text>
              </View>
              <View className="rounded-md bg-muted px-2 py-0.5">
                <Text className="text-2xs text-muted-foreground capitalize">{item.frequency}</Text>
              </View>
            </View>
          </View>

          <View className="items-end gap-1">
            <View
              className={cn(
                'rounded-full px-2 py-0.5',
                item.isActive ? 'bg-emerald-500/15' : 'bg-muted',
              )}
            >
              <Text
                className={cn(
                  'text-2xs font-medium',
                  item.isActive ? 'text-emerald-600' : 'text-muted-foreground',
                )}
              >
                {item.isActive ? t('incomeSection.active') : t('incomeSection.inactive')}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row items-end justify-between">
          <View>
            <Text className="text-xs text-muted-foreground">{t('incomeSection.amountPerFrequency')}</Text>
            <Text className="mt-0.5 text-base font-bold text-card-foreground">
              {formatCurrency(item.amount, item.currency)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-muted-foreground">{t('incomeSection.monthlyEquivalent')}</Text>
            <Text className="mt-0.5 text-sm font-semibold text-emerald-600">
              {formatCurrency(monthly, item.currency)}{t('perMonth')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!sources || sources.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={t('incomeSection.messages.noSourcesYet')}
        description={t('incomeSection.messages.addFirst')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={sources}
        renderItem={renderSource}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center px-4 pb-5 pt-4">
            <Text className="text-xs text-muted-foreground">{t('incomeSection.totalMonthly')}</Text>
            <Text className="mt-1 text-3xl font-bold text-emerald-600">
              {formatCurrency(totalMonthly)}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {sources.filter((s) => s.isActive).length} {t('incomeSection.activeSources')}
            </Text>
          </View>
        }
      />
    </View>
  );
}
