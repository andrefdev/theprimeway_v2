import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '../components/layout/sidebar'
import { Header } from '../components/layout/topbar'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useLocaleSync } from '../i18n/useLocaleSync'

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
  return (
    <TooltipProvider>
      <SidebarProvider className="h-dvh! min-h-0!">
        <AppSidebar />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main id="app-scroll-region" className="flex-1 overflow-y-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
          <MobileBottomNav />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
