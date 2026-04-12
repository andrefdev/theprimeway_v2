import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface NotifToggleProps {
  id: string
  label: string
  description: string
  checked: boolean
  onToggle: (value: boolean) => void
}

export function NotifToggle({ id, label, description, checked, onToggle }: NotifToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onToggle(v === true)} />
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
