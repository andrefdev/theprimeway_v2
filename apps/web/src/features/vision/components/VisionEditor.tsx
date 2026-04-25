import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { visionApi } from '../api'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

export function VisionEditor() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['vision'], queryFn: visionApi.get })
  const vision = data?.data
  const hasVision = !!vision && (
    !!vision.statement?.trim() ||
    (vision.coreValues?.length ?? 0) > 0 ||
    (vision.identityStatements?.length ?? 0) > 0
  )

  const [editing, setEditing] = useState(false)
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vision'] })
      setEditing(false)
    },
  })

  if (isLoading) return null

  // Vision exists and not editing → compact summary card.
  if (hasVision && !editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your vision</CardTitle>
          <CardDescription className="line-clamp-2">{vision.statement}</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </CardAction>
        </CardHeader>
        {(vision.coreValues?.length ?? 0) > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {vision.coreValues!.map((v) => (
                <Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  // No vision yet, or editing → full editor.
  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasVision ? 'Edit vision' : 'Define your vision'}</CardTitle>
        <CardDescription>The 10-year horizon — who you become, what you stand for.</CardDescription>
        {hasVision && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  )
}
