import { SectionTabs } from '@/components/SectionTabs'
import { useTranslation } from 'react-i18next'

export function FinancesNav() {
  const { t } = useTranslation('finances')

  return (
    <SectionTabs
      basePath="/finances"
      items={[
        { to: '/finances', label: t('navOverview') },
        { to: '/finances/accounts', label: t('navAccounts') },
        { to: '/finances/monthly', label: t('navBudgets') },
        { to: '/finances/history', label: t('navTransactions') },
        { to: '/finances/investments', label: t('navInvestments') },
        { to: '/finances/debts', label: t('navDebts') },
        { to: '/finances/recurring', label: t('navRecurring') },
        { to: '/finances/savings', label: t('navSavings') },
        { to: '/finances/income', label: t('navIncome') },
      ]}
    />
  )
}
