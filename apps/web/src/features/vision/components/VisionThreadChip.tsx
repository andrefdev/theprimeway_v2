import { useQuery } from '@tanstack/react-query'
import { visionApi } from '../api'

export function VisionThreadChip({ taskId }: { taskId: string }) {
  const { data } = useQuery({
    queryKey: ['vision-thread', taskId],
    queryFn: () => visionApi.thread(taskId),
    enabled: !!taskId,
    staleTime: 60_000,
  })

  const chains = data?.data.chains ?? []
  if (chains.length === 0) return null

  // Take the deepest chain to render breadcrumb
  const chain = chains.reduce<typeof chains[number]>(
    (best, c) => (c.length > best.length ? c : best),
    chains[0] ?? [],
  )
  if (!chain || chain.length === 0) return null

  return (
    <div className="text-xs text-muted-foreground italic">
      ↳ {chain.map((g) => g.title).join(' → ')}
    </div>
  )
}
