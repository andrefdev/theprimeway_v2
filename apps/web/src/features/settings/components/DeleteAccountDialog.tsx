import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangleIcon, Loader2Icon, ShieldAlertIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Textarea } from '@/shared/components/ui/textarea'
import { useAuthStore } from '@/shared/stores/auth.store'
import {
  useRequestAccountDeletion,
  useConfirmAccountDeletion,
} from '@/features/auth/queries'

type Step = 'warning' | 'reason' | 'identity' | 'otp'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation('settings')
  const user = useAuthStore((s) => s.user)
  const requestDeletion = useRequestAccountDeletion()
  const confirmDeletion = useConfirmAccountDeletion()

  const [step, setStep] = useState<Step>('warning')
  const [acknowledged, setAcknowledged] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [reasonNote, setReasonNote] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!open) {
      // small reset delay so animation finishes cleanly
      const id = setTimeout(() => {
        setStep('warning')
        setAcknowledged(false)
        setReason('')
        setReasonNote('')
        setConfirmEmail('')
        setPassword('')
        setCode('')
        setResendCooldown(0)
      }, 200)
      return () => clearTimeout(id)
    }
  }, [open])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const userEmail = user?.email ?? ''
  const emailMatches = confirmEmail.trim().toLowerCase() === userEmail.toLowerCase()

  async function sendCode() {
    if (!emailMatches) {
      toast.error(t('deleteAccount_emailMismatch'))
      return
    }
    try {
      await requestDeletion.mutateAsync({
        confirmEmail: confirmEmail.trim(),
        password: password || undefined,
        reason: buildReasonString(),
      })
      setStep('otp')
      setResendCooldown(30)
      toast.success(t('deleteAccount_codeSent'))
    } catch (err: any) {
      const msg = err?.response?.data?.error || ''
      if (msg.toLowerCase().includes('password')) {
        toast.error(t('deleteAccount_invalidPassword'))
      } else if (msg.toLowerCase().includes('many')) {
        toast.error(t('deleteAccount_rateLimited'))
      } else {
        toast.error(t('deleteAccount_sendFailed'))
      }
    }
  }

  function buildReasonString(): string | undefined {
    const parts: string[] = []
    if (reason) parts.push(reason)
    if (reasonNote.trim()) parts.push(reasonNote.trim())
    if (parts.length === 0) return undefined
    return parts.join(' — ').slice(0, 500)
  }

  async function handleConfirm() {
    if (code.length !== 6) return
    try {
      await confirmDeletion.mutateAsync(code)
      toast.success(t('deleteAccount_deleted'))
      onOpenChange(false)
      // Hard redirect — user no longer exists
      window.location.href = '/login'
    } catch (err: any) {
      const msg = err?.response?.data?.error || ''
      if (msg.toLowerCase().includes('attempts')) {
        toast.error(t('deleteAccount_tooManyAttempts'))
        setStep('identity')
        setCode('')
      } else {
        toast.error(t('deleteAccount_invalidCode'))
      }
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    try {
      await requestDeletion.mutateAsync({
        confirmEmail: confirmEmail.trim(),
        password: password || undefined,
        reason: buildReasonString(),
      })
      toast.success(t('deleteAccount_codeResent'))
      setResendCooldown(30)
    } catch {
      toast.error(t('deleteAccount_sendFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'warning' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangleIcon className="size-5" />
                <DialogTitle>{t('deleteAccount_warningTitle')}</DialogTitle>
              </div>
              <DialogDescription>{t('deleteAccount_warningSubtitle')}</DialogDescription>
            </DialogHeader>

            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-xs font-medium text-destructive">{t('deleteAccount_willLose')}</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>{t('deleteAccount_lossTasks')}</li>
                <li>{t('deleteAccount_lossHabits')}</li>
                <li>{t('deleteAccount_lossCalendar')}</li>
                <li>{t('deleteAccount_lossGoals')}</li>
                <li>{t('deleteAccount_lossSettings')}</li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">{t('deleteAccount_irreversible')}</p>

            <label className="flex items-start gap-2 cursor-pointer text-xs select-none">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                className="mt-0.5"
              />
              <span>{t('deleteAccount_ackCheckbox')}</span>
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('deleteAccount_stay')}
              </Button>
              <Button
                variant="destructive"
                disabled={!acknowledged}
                onClick={() => setStep('reason')}
              >
                {t('deleteAccount_continue')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'reason' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('deleteAccount_reasonTitle')}</DialogTitle>
              <DialogDescription>{t('deleteAccount_reasonSubtitle')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {(
                [
                  'not_using',
                  'too_complex',
                  'too_expensive',
                  'privacy',
                  'found_alternative',
                  'temporary_break',
                  'other',
                ] as const
              ).map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer rounded-md border p-2 text-xs hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={opt}
                    checked={reason === opt}
                    onChange={() => setReason(opt)}
                  />
                  <span>{t(`deleteAccount_reasonOpt_${opt}`)}</span>
                </label>
              ))}

              <Textarea
                placeholder={t('deleteAccount_reasonPlaceholder')}
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                maxLength={500}
                rows={2}
              />
            </div>

            {reason === 'temporary_break' && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                {t('deleteAccount_breakHint')}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('deleteAccount_stay')}
              </Button>
              <Button variant="destructive" onClick={() => setStep('identity')}>
                {t('deleteAccount_continue')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'identity' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldAlertIcon className="size-5 text-destructive" />
                <DialogTitle>{t('deleteAccount_identityTitle')}</DialogTitle>
              </div>
              <DialogDescription>
                {t('deleteAccount_identitySubtitle', { email: userEmail })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="confirm-email" className="text-xs">
                  {t('deleteAccount_typeEmail')}
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  autoComplete="off"
                  placeholder={userEmail}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs">
                  {t('deleteAccount_password')}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('deleteAccount_passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('deleteAccount_passwordHint')}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('reason')}>
                {t('deleteAccount_back')}
              </Button>
              <Button
                variant="destructive"
                onClick={sendCode}
                disabled={!emailMatches || requestDeletion.isPending}
              >
                {requestDeletion.isPending && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                {t('deleteAccount_sendCode')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('deleteAccount_otpTitle')}</DialogTitle>
              <DialogDescription>
                {t('deleteAccount_otpSubtitle', { email: userEmail })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="delete-otp" className="text-xs">
                {t('deleteAccount_codeLabel')}
              </Label>
              <Input
                id="delete-otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                className="h-12 text-center text-2xl font-mono tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || requestDeletion.isPending}
              className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50 self-start"
            >
              {resendCooldown > 0
                ? t('deleteAccount_resendIn', { seconds: resendCooldown })
                : t('deleteAccount_resend')}
            </button>

            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {t('deleteAccount_finalWarning')}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('deleteAccount_cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={code.length !== 6 || confirmDeletion.isPending}
              >
                {confirmDeletion.isPending && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                {t('deleteAccount_confirmDelete')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
