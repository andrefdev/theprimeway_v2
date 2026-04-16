import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Loader2Icon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { authApi } from '@/features/auth/api'
import { z } from 'zod'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/_auth/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const { token } = useSearch({ from: '/_auth/reset-password' })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(t('passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }
    if (!token) {
      setError(t('invalidResetToken'))
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
    } catch {
      setError(t('resetPasswordFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div>
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center pt-8 pb-4">
            <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl bg-primary text-4xl font-bold text-primary-foreground">
              P
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-sm text-center space-y-4">
          <p className="text-sm text-destructive">{t('invalidResetToken')}</p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl bg-primary text-4xl font-bold text-primary-foreground">
            P
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">The Prime Way</h1>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-xs">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">&#x2705;</div>
            <h2 className="text-xl font-semibold text-foreground">{t('passwordResetSuccess')}</h2>
            <p className="text-sm text-muted-foreground">{t('passwordResetSuccessDescription')}</p>
            <Button asChild className="w-full">
              <Link to="/login">{t('backToLogin')}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t('resetPasswordTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('resetPasswordSubtitle')}</p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('passwordNewPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={t('togglePasswordVisibility')}
                  >
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !password || !confirmPassword}>
                {loading && <Loader2Icon className="size-4 animate-spin" />}
                {t('resetPasswordButton')}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
