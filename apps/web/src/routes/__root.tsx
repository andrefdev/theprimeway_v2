import { Suspense, useEffect } from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '../providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import '../i18n/config'
import { useAuthStore } from '@/stores/auth.store'

// Try to import Tauri API, but don't fail if not available
let invoke: ((command: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null
try {
  // @ts-ignore - Tauri API is only available in Tauri context
  import('@tauri-apps/api/core').then(m => {
    invoke = m.invoke
  }).catch(() => {
    // Not in Tauri context, ignore
  })
} catch {
  // Not in Tauri context, ignore
}

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const authState = useAuthStore()

  // Sync auth token with Tauri when token changes
  useEffect(() => {
    if (!invoke || typeof window === 'undefined') return

    const syncTokenToTauri = async () => {
      if (authState.token && authState.refreshToken) {
        try {
          await invoke('set_auth_token', {
            token: authState.token,
            refreshToken: authState.refreshToken,
          })
        } catch (error) {
          console.error('Failed to sync token to Tauri:', error)
        }
      } else {
        try {
          await invoke('clear_auth_token')
        } catch (error) {
          console.error('Failed to clear token in Tauri:', error)
        }
      }
    }

    syncTokenToTauri()
  }, [authState.token, authState.refreshToken])

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background" />}>
    <ThemeProvider defaultTheme="dark">
      <Outlet />
      <Toaster />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </>
      )}
    </ThemeProvider>
    </Suspense>
  )
}
