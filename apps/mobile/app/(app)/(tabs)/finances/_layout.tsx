import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Slot, usePathname, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/shared/components/ui/icon';
import { PillTabs } from '@/shared/components/ui/pill-tabs';
import { Plus } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { TransactionFormSheet } from '@features/finances/components/TransactionFormSheet';
import { AccountFormSheet } from '@features/finances/components/AccountFormSheet';
import { InvestmentFormSheet } from '@features/finances/components/InvestmentFormSheet';
import { PageHeader } from '@features/personalization/components/PageHeader';

export default function FinancesLayout() {
  const { t } = useTranslation('features.finances');
  const pathname = usePathname();
  const [showTransactionSheet, setShowTransactionSheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showInvestmentSheet, setShowInvestmentSheet] = useState(false);

  const TABS = [
    { key: 'overview', label: t('nav.overview') },
    { key: 'transactions', label: t('nav.history') },
    { key: 'accounts', label: t('nav.accounts') },
    { key: 'investments', label: t('investments.title') },
    { key: 'analytics', label: t('nav.planning') },
  ];

  const getActiveTab = useCallback(() => {
    if (pathname.includes('/transactions')) return 'transactions';
    if (pathname.includes('/accounts')) return 'accounts';
    if (pathname.includes('/investments')) return 'investments';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/budgets')) return 'overview';
    if (pathname.includes('/debts')) return 'overview';
    if (pathname.includes('/savings')) return 'overview';
    if (pathname.includes('/income')) return 'overview';
    if (pathname.includes('/pending')) return 'overview';
    if (pathname.includes('/recurring')) return 'overview';
    return 'overview';
  }, [pathname]);

  const activeTab = getActiveTab();

  const handleTabPress = useCallback((key: string) => {
    const routes: Record<string, string> = {
      overview: '/(app)/(tabs)/finances/',
      transactions: '/(app)/(tabs)/finances/transactions',
      accounts: '/(app)/(tabs)/finances/accounts',
      investments: '/(app)/(tabs)/finances/investments',
      analytics: '/(app)/(tabs)/finances/analytics',
    };
    router.replace(routes[key] as never);
  }, []);

  const handleAdd = useCallback(() => {
    if (pathname.includes('/accounts')) {
      setShowAccountSheet(true);
    } else if (pathname.includes('/investments')) {
      setShowInvestmentSheet(true);
    } else {
      setShowTransactionSheet(true);
    }
  }, [pathname]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <PageHeader
        sectionId="finances"
        title={t('title')}
        actions={
          <Pressable
            onPress={handleAdd}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary active:bg-primary-hover"
            hitSlop={8}
          >
            <Icon as={Plus} size={20} className="text-primary-foreground" />
          </Pressable>
        }
      />

      {/* Pill Tabs */}
      <View className="px-4 pb-3 pt-1">
        <PillTabs tabs={TABS} activeKey={activeTab} onTabPress={handleTabPress} />
      </View>

      {/* Content */}
      <Slot />

      {/* Form Sheets */}
      <TransactionFormSheet
        isOpen={showTransactionSheet}
        onClose={() => setShowTransactionSheet(false)}
      />
      <AccountFormSheet
        isOpen={showAccountSheet}
        onClose={() => setShowAccountSheet(false)}
      />
      <InvestmentFormSheet
        isOpen={showInvestmentSheet}
        onClose={() => setShowInvestmentSheet(false)}
      />
    </SafeAreaView>
  );
}
