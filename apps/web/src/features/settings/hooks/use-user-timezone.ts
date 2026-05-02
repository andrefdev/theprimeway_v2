import { useQuery } from '@tanstack/react-query'
import { getDeviceTimeZone } from '@repo/shared/utils'
import { settingsApi } from '../api'

/**
 * Returns the user's IANA timezone from UserSettings, falling back to the
 * device timezone while loading or on miss. Always returns a non-empty string.
 */
export function useUserTimezone(): string {
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return settingsQuery.data?.timezone || getDeviceTimeZone()
}
