import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { visionApi } from '../api'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Input } from '@/shared/components/ui/input'

export function VisionEditor() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['vision'], queryFn: visionApi.get })
  const vision = data?.data

  const [statement, setStatement] = useState('')
  const [valuesText, setValuesText] = useState('')
  const [identityText, setIdentityText] = useState('')

  useEffect(() => {
    if (!vision) return
    setStatement(vision.statement ?? '')
    setValuesText((vision.coreValues ?? []).join(', '))
    setIdentityText((vision.identityStatements ?? []).join('\n'))
  }, [vision])

  const save = useMutation({
    mutationFn: () =>
      visionApi.upsert({
        statement,
        coreValues: valuesText.split(',').map((s) => s.trim()).filter(Boolean),
        identityStatements: identityText.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision'] }),
  })

  if (isLoading) return <div className="text-muted-foreground">Loading vision…</div>

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">10-year statement</label>
        <Textarea
          rows={4}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="By 2036 I am…"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Core values (comma-separated, max 5)</label>
        <Input
          value={valuesText}
          onChange={(e) => setValuesText(e.target.value)}
          placeholder="craft, integrity, learning"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Identity statements (one per line)</label>
        <Textarea
          rows={4}
          value={identityText}
          onChange={(e) => setIdentityText(e.target.value)}
          placeholder={'I am a person who…\nI am a person who…'}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save vision'}
        </Button>
      </div>
    </div>
  )
}
