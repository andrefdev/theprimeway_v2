import { View } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { BudgetCard } from '@features/finances/components/BudgetCard';
import { useBudgets } from '@features/finances/hooks/useFinances';
import { Wallet } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { Budget } from '@shared/types/models';

export default function BudgetsScreen() {
  const { t } = useTranslation('features.finances');
  const { t: tCommon } = useTranslation('common');
  const { data: budgets, isLoading } = useBudgets();

  const activeBudgets = budgets?.filter((b) => b.isActive) ?? [];
  const inactiveBudgets = budgets?.filter((b) => !b.isActive) ?? [];

  const renderBudget = ({ item }: { item: Budget }) => (
    <View className="px-4 pb-3">
      <BudgetCard budget={item} />
    </View>
  );

  const sections = [
    ...(activeBudgets.length > 0 ? activeBudgets : []),
    ...(inactiveBudgets.length > 0 ? inactiveBudgets : []),
  ];

  if (isLoading) {
    return <LoadingOverlay message={tCommon('actions.loading')} />;
  }

  if (!budgets || budgets.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={t('budgets.noBudgets')}
        description={t('createBudgetDescription')}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={sections}
        renderItem={renderBudget}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pt-4"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeBudgets.length > 0 ? (
            <View className="px-4 pb-3">
              <Text className="text-sm font-medium text-muted-foreground">
                {activeBudgets.length} {tCommon('status.active')} {t('budgets.title')}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
