import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Loader2Icon } from 'lucide-react'
import { authApi } from '@/features/auth/api'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch {
      setError(t('forgotPasswordFailed'))
    } finally {
      setLoading(false)
    }
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
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">&#x2709;&#xFE0F;</div>
            <h2 className="text-xl font-semibold text-foreground">{t('checkYourEmail')}</h2>
            <p className="text-sm text-muted-foreground">{t('resetEmailSent', { email })}</p>
            <Link to="/login" className="inline-block text-sm text-primary hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t('forgotPasswordTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('forgotPasswordSubtitle')}</p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t('email')}</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading && <Loader2Icon className="size-4 animate-spin" />}
                {t('sendResetLink')}
              </Button>
            </form>

            <div className="text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
