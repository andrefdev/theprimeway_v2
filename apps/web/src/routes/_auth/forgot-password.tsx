import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import { OtpForm } from '@/features/auth/components/OtpForm'
import { useForgotPassword, useResendOtp, useResetPassword } from '@/features/auth/queries'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

type Step = 'email' | 'otp' | 'done'

function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')

  const forgot = useForgotPassword()
  const resend = useResendOtp()
  const reset = useResetPassword()

  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setError(null)
    try {
      await forgot.mutateAsync(trimmed)
      setEmail(trimmed)
      setStep('otp')
    } catch {
      setError(t('forgotPasswordFailed'))
    }
  }

  async function handleReset(code: string) {
    setError(null)
    if (password.length < 8) {
      setError(t('passwordTooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('passwordMismatch'))
      return
    }
    try {
      await reset.mutateAsync({ email, code, password })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.error || t('invalidCode'))
    }
  }

  async function handleResend() {
    setError(null)
    try {
      await resend.mutateAsync({ email, purpose: 'reset' })
    } catch {
      setError(t('forgotPasswordFailed'))
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
        {step === 'email' && (
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

            <form onSubmit={handleRequest} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={forgot.isPending || !email.trim()}>
                {forgot.isPending && <Loader2Icon className="size-4 animate-spin" />}
                {t('sendCode')}
              </Button>
            </form>

            <div className="text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <OtpForm
            email={email}
            onSubmit={handleReset}
            onResend={handleResend}
            onChangeEmail={() => setStep('email')}
            submitting={reset.isPending}
            resending={resend.isPending}
            error={error}
            submitLabel={t('resetPasswordButton')}
            trailing={
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-medium text-muted-foreground">
                    {t('newPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('passwordNewPlaceholder')}
                      className="h-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-1 -translate-y-1/2 size-8 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={t('togglePasswordVisibility')}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-3.5" />
                      ) : (
                        <EyeIcon className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground">
                    {t('confirmPassword')}
                  </Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    className="h-10"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </>
            }
          />
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">&#x2705;</div>
            <h2 className="text-xl font-semibold text-foreground">{t('passwordResetSuccess')}</h2>
            <p className="text-sm text-muted-foreground">{t('passwordResetSuccessDescription')}</p>
            <Button className="w-full" onClick={() => navigate({ to: '/login' })}>
              {t('signIn')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
