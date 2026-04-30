import { Suspense, useEffect } from 'react'
import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '@/shared/providers/theme-provider'
import { Toaster } from '@/shared/components/ui/sonner'
import '../i18n/config'
import { useAuthStore } from '@/shared/stores/auth.store'

// Try to import Tauri API, but don't fail if not available
let invoke: ((command: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null

// Load Tauri dynamically - construct path to prevent Vite static analysis
const initTauri = async () => {
  try {
    // Construct module name dynamically so Vite doesn't try to resolve it statically
    const modulePath = '@tauri-apps' + '/' + 'api' + '/' + 'core'
    const m = await import(/* @vite-ignore */ modulePath)
    invoke = m.invoke
  } catch {
    // Not in Tauri context, ignore
  }
}

initTauri()

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
          await invoke!('set_auth_token', {
            token: authState.token,
            refreshToken: authState.refreshToken,
          })
        } catch (error) {
          console.error('Failed to sync token to Tauri:', error)
        }
      } else {
        try {
          await invoke!('clear_auth_token')
        } catch (error) {
          console.error('Failed to clear token in Tauri:', error)
        }
      }
    }

    syncTokenToTauri()
  }, [authState.token, authState.refreshToken])

  const router = useRouter()
  useEffect(() => {
    let unlisten: (() => void) | null = null
    const setup = async () => {
      try {
        const modulePath = '@tauri-apps' + '/' + 'api' + '/' + 'event'
        const m = await import(/* @vite-ignore */ modulePath)
        unlisten = await m.listen('tray-navigate', (e: { payload: string }) => {
          if (typeof e.payload === 'string') router.navigate({ to: e.payload })
        })
      } catch {
        // Not in Tauri context
      }
    }
    setup()
    return () => unlisten?.()
  }, [router])

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
