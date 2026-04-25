import { Suspense } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/shared/stores/auth.store'
import logo_full_text from '@/shared/assets/logo_full_text.png'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { t } = useTranslation('auth')

  return (
    <div className="flex min-h-dvh">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-neutral-950 overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-primary/5" />

        <div className="relative z-10 flex flex-col items-center gap-2 px-12 text-center">
          <img src={logo_full_text} alt="" className="h-24 w-auto brightness-0 invert opacity-90" />
          <div>
            <p className="mt-2 max-w-xs text-sm text-neutral-400">
              {t('brandTagline', { defaultValue: 'Your personal system for goals, habits, and productivity.' })}
            </p>
          </div>
        </div>

        {/* Decorative grid dots */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="h-96" />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
