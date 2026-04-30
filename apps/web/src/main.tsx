import './shared/lib/sentry'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import { routeTree } from './routeTree.gen'
import './index.css'

// Create query client
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ??
        error?.message ??
        'Something went wrong'
      toast.error(message)
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Create router
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

// Type-safe router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render
const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
