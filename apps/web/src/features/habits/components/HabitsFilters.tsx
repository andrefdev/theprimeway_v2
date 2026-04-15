import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { LIFE_PILLARS } from '@repo/shared/constants'

interface HabitsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
}

// Map pillar id to i18n key: health_body -> pillarHealthBody
const pillarI18nKey = (id: string) =>
  'pillar' + id.split('_').map(w => w[0]!.toUpperCase() + w.slice(1)).join('')

export function HabitsFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
}: HabitsFiltersProps) {
  const { t } = useTranslation('habits')

  return (
    <div className="flex items-center gap-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('searchHabits')}
        className="max-w-50"
      />
      <Select value={categoryFilter || '__all__'} onValueChange={(v) => onCategoryChange(v === '__all__' ? '' : v)}>
        <SelectTrigger className="max-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('allPillars')}</SelectItem>
          {LIFE_PILLARS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                {t(pillarI18nKey(p.id) as any)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
