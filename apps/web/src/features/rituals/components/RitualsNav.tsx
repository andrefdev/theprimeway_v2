import { SectionTabs } from '@/shared/components/SectionTabs'

export function RitualsNav() {
  return (
    <SectionTabs
      basePath="/rituals"
      items={[
        { to: '/rituals', label: 'Overview' },
        { to: '/rituals/daily-plan', label: 'Daily Plan' },
        { to: '/rituals/daily-shutdown', label: 'Daily Shutdown' },
        { to: '/rituals/weekly-plan', label: 'Weekly Plan' },
        { to: '/rituals/weekly-review', label: 'Weekly Review' },
        { to: '/rituals/quarterly-review', label: 'Quarterly' },
        { to: '/rituals/annual-review', label: 'Annual' },
      ]}
    />
  )
}
