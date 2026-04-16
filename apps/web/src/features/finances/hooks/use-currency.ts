import { useCallback } from 'react'
import { useCurrencySettings } from '@/features/settings/hooks/use-currency-settings'
import { formatAmountWithSymbol } from '@/shared/lib/currency'

export function useCurrency() {
  const { settings, loading } = useCurrencySettings()

  const formatCurrency = useCallback(
    (amount: number, currencyCode?: string) => {
      const code = currencyCode || settings?.baseCurrency || 'USD'
      return formatAmountWithSymbol(amount, code)
    },
    [settings],
  )

  return {
    formatCurrency,
    currency: settings?.baseCurrency || 'USD',
    isLoading: loading,
  }
}
