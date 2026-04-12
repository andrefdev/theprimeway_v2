import { View, FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { useInvestments, useInvestmentsSummary } from '@features/finances/hooks/useInvestments';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Investment } from '@shared/types/models';

const INVESTMENT_TYPE_KEYS: Record<string, string> = {
  stocks: 'stocks',
  bonds: 'bonds',
  etf: 'etf',
  crypto: 'crypto',
  real_estate: 'real_estate',
  mutual_fund: 'mutual_fund',
  other: 'other',
};

const INVESTMENT_TYPE_BG: Record<string, string> = {
  stocks: 'bg-blue-500/15',
  bonds: 'bg-purple-500/15',
  etf: 'bg-indigo-500/15',
  crypto: 'bg-orange-500/15',
  real_estate: 'bg-emerald-500/15',
  mutual_fund: 'bg-teal-500/15',
  other: 'bg-muted',
};

const INVESTMENT_TYPE_TEXT: Record<string, string> = {
  stocks: 'text-blue-600',
  bonds: 'text-purple-600',
  etf: 'text-indigo-600',
  crypto: 'text-orange-600',
  real_estate: 'text-emerald-600',
  mutual_fund: 'text-teal-600',
  other: 'text-muted-foreground',
};

export default function InvestmentsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: investments, isLoading: isLoadingInvestments } = useInvestments();
  const { data: summary, isLoading: isLoadingSummary } = useInvestmentsSummary();

  const isLoading = isLoadingInvestments || isLoadingSummary;

  const renderInvestment = ({ item, index }: { item: Investment; index: number }) => {
    const gain = item.unrealizedGain ?? item.currentValue - item.totalInvested;
    const gainPercent = item.unrealizedGainPercent ?? (
      item.totalInvested > 0 ? ((item.currentValue - item.totalInvested) / item.totalInvested) * 100 : 0
    );
    const isPositive = gain >= 0;
    const typeKey = INVESTMENT_TYPE_KEYS[item.investmentType] ?? 'other';
    const typeLabel = t(`investmentForm.types.${typeKey}`);
    const typeBadgeBg = INVESTMENT_TYPE_BG[item.investmentType] ?? INVESTMENT_TYPE_BG.other;
    const typeBadgeText = INVESTMENT_TYPE_TEXT[item.investmentType] ?? INVESTMENT_TYPE_TEXT.other;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <View className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
          {/* Header Row: name + type badge */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-card-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.ticker && (
                  <Text className="text-xs font-medium text-muted-foreground">
                    {item.ticker.toUpperCase()}
                  </Text>
                )}
              </View>
              {item.platform && (
                <Text className="mt-0.5 text-xs text-muted-foreground">{item.platform}</Text>
              )}
            </View>
            <View className={cn('rounded-full px-2.5 py-1', typeBadgeBg)}>
              <Text className={cn('text-xs font-medium', typeBadgeText)}>
                {typeLabel}
              </Text>
            </View>
          </View>

          {/* Values Row */}
          <View className="mt-3 flex-row items-end justify-between">
            {/* Invested */}
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">{t('investments.invested')}</Text>
              <Text className="mt-0.5 text-sm font-medium text-card-foreground">
                {formatCurrency(item.totalInvested, item.currency)}
              </Text>
            </View>

            {/* Current Value */}
            <View className="flex-1 items-center">
              <Text className="text-xs text-muted-foreground">{t('investments.current')}</Text>
              <Text className="mt-0.5 text-sm font-semibold text-card-foreground">
                {formatCurrency(item.currentValue, item.currency)}
              </Text>
            </View>

            {/* Gain/Loss */}
            <View className="flex-1 items-end">
              <Text className="text-xs text-muted-foreground">{t('investments.gain')}</Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                {isPositive ? (
                  <TrendingUp size={12} color="#22c55e" />
                ) : (
                  <TrendingDown size={12} color="#ef4444" />
                )}
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    isPositive ? 'text-emerald-500' : 'text-destructive',
                  )}
                >
                  {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
                </Text>
              </View>
              <Text
                className={cn(
                  'text-xs',
                  isPositive ? 'text-emerald-500' : 'text-destructive',
                )}
              >
                {isPositive ? '+' : ''}{formatCurrency(gain, item.currency)}
              </Text>
            </View>
          </View>

          {/* Footer: purchase date */}
          {item.purchaseDate && (
            <View className="mt-3 border-t border-border pt-2">
              <Text className="text-xs text-muted-foreground">
                {t('investments.since')} {formatDate(item.purchaseDate, 'MMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!investments || investments.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t('investments.noInvestmentsYet')}
        description={t('investments.noInvestmentsDescription')}
      />
    );
  }

  const totalGain = summary?.totalGain ?? 0;
  const totalGainPercent = summary?.totalGainPercent ?? 0;
  const isPortfolioPositive = totalGain >= 0;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={investments}
        renderItem={renderInvestment}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.springify()} className="items-center px-4 pb-5 pt-4">
            {/* Hero: portfolio value */}
            <Text className="text-xs text-muted-foreground">{t('investments.portfolioValue')}</Text>
            <Text className="mt-1 text-3xl font-bold text-card-foreground">
              {formatCurrency(summary?.currentValue ?? 0)}
            </Text>

            {/* Gain row */}
            <View className="mt-2 flex-row items-center gap-1.5">
              {isPortfolioPositive ? (
                <TrendingUp size={14} color="#22c55e" />
              ) : (
                <TrendingDown size={14} color="#ef4444" />
              )}
              <Text
                className={cn(
                  'text-sm font-semibold',
                  isPortfolioPositive ? 'text-emerald-500' : 'text-destructive',
                )}
              >
                {isPortfolioPositive ? '+' : ''}{totalGainPercent.toFixed(2)}%
                {'  '}
                ({isPortfolioPositive ? '+' : ''}{formatCurrency(totalGain)})
              </Text>
            </View>

            {/* Invested label */}
            <Text className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(summary?.totalInvested ?? 0)} {t('investments.invested').toLowerCase()} · {investments.length}{' '}
              {investments.length === 1 ? t('investments.position') : t('investments.positions')}
            </Text>
          </Animated.View>
        }
      />
    </View>
  );
}
