import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Loader2Icon } from 'lucide-react'

interface OtpFormProps {
  email: string
  onSubmit: (code: string) => Promise<void> | void
  onResend: () => Promise<void> | void
  onChangeEmail?: () => void
  submitting?: boolean
  resending?: boolean
  error?: string | null
  submitLabel?: string
  trailing?: React.ReactNode
}

export function OtpForm({
  email,
  onSubmit,
  onResend,
  onChangeEmail,
  submitting,
  resending,
  error,
  submitLabel,
  trailing,
}: OtpFormProps) {
  const { t } = useTranslation('auth')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(30)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6 || submitting) return
    await onSubmit(code)
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return
    await onResend()
    setCooldown(30)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">{t('verifyEmailTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('verifyEmailSubtitle', { email })}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="otp-code" className="text-xs font-medium text-muted-foreground">
            {t('otpCode')}
          </Label>
          <Input
            id="otp-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder={t('otpPlaceholder')}
            className="h-12 text-center text-2xl font-mono tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
          />
        </div>

        {trailing}

        <Button type="submit" className="w-full h-10" disabled={submitting || code.length !== 6}>
          {submitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {submitLabel || t('verify')}
        </Button>
      </form>

      <div className="flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {cooldown > 0 ? t('resendCooldown', { seconds: cooldown }) : t('resendCode')}
        </button>
        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('changeEmail')}
          </button>
        )}
      </div>
    </div>
  )
}
