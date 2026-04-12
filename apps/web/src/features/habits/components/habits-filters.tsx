import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

interface HabitsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
}

const CATEGORIES = [
  '', 'health', 'fitness', 'productivity', 'mindfulness',
  'learning', 'social', 'finance', 'other',
]

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
        className="max-w-[200px]"
      />
      <Select value={categoryFilter || '__all__'} onValueChange={(v) => onCategoryChange(v === '__all__' ? '' : v)}>
        <SelectTrigger className="max-w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat || '__all__'} value={cat || '__all__'}>
              {cat ? t(`category${cat.charAt(0).toUpperCase()}${cat.slice(1)}`) : t('allCategories')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
