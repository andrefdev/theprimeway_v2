import { useCallback } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CACHE_TIMES } from '@repo/shared/constants'
import { formatAmountWithSymbol } from '@/shared/lib/currency'
import {
  settingsApi,
  type CurrencySettings,
  type UpdateCurrencySettingsRequest,
} from '../api'

export type { CurrencySettings, UpdateCurrencySettingsRequest } from '../api'

const CURRENCY_KEY = ['settings', 'currency'] as const

interface UseCurrencySettingsReturn {
  settings: CurrencySettings | null
  loading: boolean
  error: string | null
  updateSettings: (updates: UpdateCurrencySettingsRequest) => Promise<boolean>
  resetSettings: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useCurrencySettings(): UseCurrencySettingsReturn {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: CURRENCY_KEY,
    queryFn: () => settingsApi.getCurrencySettings(),
    staleTime: CACHE_TIMES.long,
  })

  const updateMut = useMutation({
    mutationFn: (updates: UpdateCurrencySettingsRequest) =>
      settingsApi.updateCurrencySettings(updates),
    onSuccess: (next) => {
      qc.setQueryData(CURRENCY_KEY, next)
      toast.success('Currency settings updated successfully')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to update currency settings'
      toast.error(msg)
    },
  })

  const resetMut = useMutation({
    mutationFn: () => settingsApi.resetCurrencySettings(),
    onSuccess: () => {
      const fallback: CurrencySettings = {
        userId: query.data?.userId ?? '',
        baseCurrency: 'USD',
        preferredCurrencies: ['USD', 'PEN'],
      }
      qc.setQueryData(CURRENCY_KEY, fallback)
      toast.success('Currency settings reset to defaults')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to reset currency settings'
      toast.error(msg)
    },
  })

  const updateSettings = useCallback(
    async (updates: UpdateCurrencySettingsRequest) => {
      try {
        await updateMut.mutateAsync(updates)
        return true
      } catch {
        return false
      }
    },
    [updateMut],
  )

  const resetSettings = useCallback(async () => {
    try {
      await resetMut.mutateAsync()
      return true
    } catch {
      return false
    }
  }, [resetMut])

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: CURRENCY_KEY })
  }, [qc])

  return {
    settings: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
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
    (amount: number, currency: string): string => formatAmountWithSymbol(amount, currency),
    [],
  )

  const formatCurrencyCompact = useCallback(
    (amount: number, currency: string): string => formatAmountWithSymbol(amount, currency),
    [],
  )

  return { formatCurrency, formatCurrencyCompact }
}
