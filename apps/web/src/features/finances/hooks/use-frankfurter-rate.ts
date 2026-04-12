import { useState, useEffect, useCallback } from 'react'

interface ExchangeRateResult {
  rate: number | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFrankfurterRate(
  fromCurrency: string,
  toCurrency: string,
  enabled = true,
): ExchangeRateResult {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (
      !enabled ||
      !fromCurrency ||
      !toCurrency ||
      fromCurrency === toCurrency
    ) {
      setRate(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchRate() {
      try {
        const res = await fetch(
          `https://open.er-api.com/v6/latest/${encodeURIComponent(fromCurrency)}`,
        )
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        if (data.result === 'success' && data.rates?.[toCurrency] != null) {
          if (!cancelled) setRate(data.rates[toCurrency])
          return
        }
        throw new Error(`No rate for ${toCurrency}`)
      } catch (primaryErr) {
        try {
          const res = await fetch(
            `https://api.frankfurter.app/latest?from=${encodeURIComponent(fromCurrency)}&to=${encodeURIComponent(toCurrency)}`,
          )
          if (!res.ok) throw new Error(`Fallback API error ${res.status}`)
          const data = await res.json()
          if (!cancelled && data.rates?.[toCurrency] != null) {
            setRate(data.rates[toCurrency])
            return
          }
          throw new Error(`No rate for ${toCurrency}`)
        } catch {
          if (!cancelled) {
            const message =
              primaryErr instanceof Error
                ? primaryErr.message
                : 'Unknown error'
            setError(message)
            setRate(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRate()

    return () => {
      cancelled = true
    }
  }, [fromCurrency, toCurrency, enabled, fetchTrigger])

  return { rate, loading, error, refetch }
}
