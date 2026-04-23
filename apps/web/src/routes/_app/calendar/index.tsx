import { createFileRoute } from '@tanstack/react-router'
import { GoogleCalendarView } from '@/features/calendar/components/GoogleCalendarView'

export const Route = createFileRoute('/_app/calendar/')({
  component: CalendarPage,
})

function CalendarPage() {
  return <GoogleCalendarView />
}
