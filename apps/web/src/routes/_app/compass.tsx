import { createFileRoute } from '@tanstack/react-router'
import { CompassView } from '@/features/compass/components/CompassView'

export const Route = createFileRoute('/_app/compass')({
  component: CompassPage,
})

function CompassPage() {
  return <CompassView />
}
