import { Suspense } from 'react'
import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/shared/stores/auth.store'
import { SidebarProvider, SidebarInset } from '@/shared/components/ui/sidebar'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { AppSidebar } from '@/shared/components/layout/Sidebar'
import { Header } from '@/shared/components/layout/Topbar'
import { MobileBottomNav } from '@/shared/components/layout/MobileBottomNav'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { useLocaleSync } from '@/i18n/useLocaleSync'
import { useSyncSocket } from '@/shared/hooks/use-sync-socket'
import { RouteLoadingSkeleton } from '@/shared/components/RouteLoadingSkeleton'
import { ChatPanel } from '@/features/ai/components/ChatPanel'
import { CaptureDialog } from '@/features/capture/components/CaptureDialog'
import { useCaptureShortcut } from '@/features/capture/hooks/use-capture-shortcut'
import { useUndoShortcut } from '@/features/scheduling/hooks/use-undo-shortcut'
import { FocusMode } from '@/features/focus/components/FocusMode'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  useLocaleSync()
  useSyncSocket()
  useUndoShortcut()
  const [captureOpen, closeCapture] = useCaptureShortcut()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onAiPage = pathname.startsWith('/ai')
  return (
    <TooltipProvider>
      <SidebarProvider className="h-dvh! min-h-0!">
        <AppSidebar />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main id="app-scroll-region" className="flex-1 overflow-y-auto">
            <ErrorBoundary>
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
          <MobileBottomNav />
        </SidebarInset>
        {!onAiPage && <ChatPanel />}
        <CaptureDialog open={captureOpen} onClose={closeCapture} />
        <FocusMode />
      </SidebarProvider>
    </TooltipProvider>
  )
}
