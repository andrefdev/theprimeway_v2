import { createFileRoute } from '@tanstack/react-router'
import { ChannelsManager } from '@/features/channels/components/ChannelsManager'

export const Route = createFileRoute('/_app/channels')({
  component: ChannelsPage,
})

function ChannelsPage() {
  return <ChannelsManager />
}
