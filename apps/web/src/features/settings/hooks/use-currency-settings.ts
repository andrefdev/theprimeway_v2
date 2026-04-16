import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/shared/lib/api-client'
import { formatAmountWithSymbol } from '@/shared/lib/currency'

export interface CurrencySettings {
  id?: string
  userId: string
  baseCurrency: string
  preferredCurrencies: string[]
  createdAt?: string
  updatedAt?: string
}

export interface UpdateCurrencySettingsRequest {
  baseCurrency?: string
  preferredCurrencies?: string[]
}

interface UseCurrencySettingsReturn {
  settings: CurrencySettings | null
  loading: boolean
  error: string | null
  updateSettings: (updates: UpdateCurrencySettingsRequest) => Promise<boolean>
  resetSettings: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useCurrencySettings(): UseCurrencySettingsReturn {
  const [settings, setSettings] = useState<CurrencySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: result } = await api.get('/user/currency-settings')

      setSettings(result.data as CurrencySettings)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch currency settings'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(
    async (updates: UpdateCurrencySettingsRequest): Promise<boolean> => {
      try {
        setError(null)

        const { data: result } = await api.post(
          '/user/currency-settings',
          updates,
        )

        setSettings(result.data as CurrencySettings)

        toast.success('Currency settings updated successfully')
        return true
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update currency settings'
        setError(errorMessage)
        toast.error(errorMessage)
        return false
      }
    },
    [],
  )

  const resetSettings = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)

      await api.delete('/user/currency-settings')

      const defaultSettings: CurrencySettings = {
        userId: settings?.userId || '',
        baseCurrency: 'USD',
        preferredCurrencies: ['USD', 'PEN'],
      }

      setSettings(defaultSettings)
      toast.success('Currency settings reset to defaults')
      return true
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to reset currency settings'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [settings?.userId])

  const refresh = useCallback(async () => {
    await fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    refresh,
  }
}

export function useSupportedCurrencies() {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '\u{1F1FA}\u{1F1F8}' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '\u{1F1F5}\u{1F1EA}' },
  ]
}

export function useCurrencyFormatter() {
  const formatCurrency = useCallback(
    (amount: number, currency: string): string => {
      return formatAmountWithSymbol(amount, currency)
    },
    [],
  )

  const formatCurrencyCompact = useCallback(
    (amount: number, currency: string): string => {
      return formatAmountWithSymbol(amount, currency)
    },
    [],
  )

  return {
    formatCurrency,
    formatCurrencyCompact,
  }
}
