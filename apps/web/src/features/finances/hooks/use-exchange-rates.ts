import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface SerializedExchangeRate {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: string
  date: string
}

export function useExchangeRates() {
  return useQuery<SerializedExchangeRate[]>({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data } = await api.get<SerializedExchangeRate[]>(
        '/finances/exchange-rates',
      )
      return data
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}
