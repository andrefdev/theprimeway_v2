import type { QueryClient, QueryKey } from '@tanstack/react-query'

export type Snapshot<T> = ReadonlyArray<readonly [QueryKey, T | undefined]>

export async function snapshotQueries<T>(
  qc: QueryClient,
  queryKey: QueryKey,
): Promise<Snapshot<T>> {
  await qc.cancelQueries({ queryKey })
  return qc.getQueriesData<T>({ queryKey })
}

export function patchQueries<T>(
  qc: QueryClient,
  queryKey: QueryKey,
  updater: (cur: T) => T,
): Snapshot<T> {
  const snaps = qc.getQueriesData<T>({ queryKey })
  for (const [key, value] of snaps) {
    if (value === undefined) continue
    qc.setQueryData<T>(key, updater(value))
  }
  return snaps
}

export function rollbackQueries<T>(qc: QueryClient, snapshots: Snapshot<T>) {
  for (const [key, value] of snapshots) qc.setQueryData(key, value)
}

export const listOps = {
  upsert<T extends { id: string }>(arr: T[], item: T): T[] {
    const idx = arr.findIndex((x) => x.id === item.id)
    if (idx === -1) return [...arr, item]
    const next = arr.slice()
    next[idx] = { ...arr[idx], ...item }
    return next
  },

  remove<T extends { id: string }>(arr: T[], id: string): T[] {
    return arr.filter((x) => x.id !== id)
  },

  patch<T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] {
    return arr.map((x) => (x.id === id ? { ...x, ...patch } : x))
  },
}
