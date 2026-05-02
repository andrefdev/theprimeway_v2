import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCompleteOnboarding } from '../queries'
import { ambassadorApi } from '@/features/ambassador/api'

const TOTAL_STEPS = 5

const LIFE_AREAS = [
  { key: 'career', emoji: '💼' },
  { key: 'health', emoji: '🏋️' },
  { key: 'finances', emoji: '💰' },
  { key: 'relationships', emoji: '❤️' },
  { key: 'mindset', emoji: '🧠' },
  { key: 'lifestyle', emoji: '✨' },
] as const

export function OnboardingWizard() {
  const { t, i18n } = useTranslation('onboarding')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState(1)
  const [name, setName] = useState(user?.name || '')
  const [referralCode, setReferralCode] = useState('')
  const [referralValidation, setReferralValidation] = useState<{ valid: boolean; ambassadorName?: string } | null>(null)
  const [validating, setValidating] = useState(false)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [dailyGoal, setDailyGoal] = useState('30')
  const completeOnboarding = useCompleteOnboarding()

  // Pre-fill referral code from query param ?ref=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCode(ref)
  }, [])

  // Debounced validation
  useEffect(() => {
    const code = referralCode.trim()
    if (code.length < 3) {
      setReferralValidation(null)
      return
    }
    setValidating(true)
    const handle = setTimeout(async () => {
      try {
        const r = await ambassadorApi.validateCode(code)
        setReferralValidation(r.valid && r.data ? { valid: true, ambassadorName: r.data.ambassadorName } : { valid: false })
      } catch {
        setReferralValidation({ valid: false })
      } finally {
        setValidating(false)
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [referralCode])

  function toggleArea(key: string) {
    setSelectedAreas((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    )
  }

  async function handleComplete() {
    try {
      await completeOnboarding.mutateAsync({
        name: name.trim() !== user?.name ? name.trim() : undefined,
        preferences: {
          locale: i18n.language,
          onboardingCompleted: true,
          focusAreas: selectedAreas,
          dailyGoalMinutes: parseInt(dailyGoal, 10) || 30,
        },
      })

      if (name.trim() && name !== user?.name && user) {
        setUser({ ...user, name: name.trim() })
      }

      // Redeem referral code if present and valid
      if (referralCode.trim() && referralValidation?.valid) {
        try {
          await ambassadorApi.redeemCode(referralCode.trim())
        } catch (e: any) {
          // Non-blocking — user can still complete onboarding
          console.warn('Referral code redemption failed:', e?.response?.data?.error ?? e)
        }
      }

      toast.success(t('setupComplete'))
      navigate({ to: '/' })
    } catch {
      toast.error(t('failedToSave'))
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">&#x1F44B;</div>
            <h2 className="text-2xl font-bold text-foreground">{t('welcomeTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('welcomeDescription')}</p>

            <div className="mt-6 space-y-3 text-left">
              <Label>{t('whatsYourName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                autoFocus
              />
            </div>

            <Button className="w-full mt-6" onClick={() => setStep(2)} disabled={!name.trim()}>
              {t('continue')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Referral code */}
      {step === 2 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">
              <Sparkles className="h-10 w-10 text-indigo-500 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('referralTitle', { defaultValue: '¿Alguien te invitó?' })}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('referralDescription', { defaultValue: 'Si te invitó un embajador, ingresa su código aquí. Es opcional.' })}
            </p>

            <div className="mt-6 space-y-2 text-left">
              <Label>{t('referralLabel', { defaultValue: 'Código de referido' })}</Label>
              <Input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="ej. andre-7k2x"
                autoFocus
              />
              {validating && <p className="text-xs text-muted-foreground">{t('validating', { defaultValue: 'Validando...' })}</p>}
              {referralValidation?.valid && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t('referralValid', { defaultValue: 'Invitado por' })} <strong>{referralValidation.ambassadorName}</strong></span>
                </div>
              )}
              {referralCode.trim().length >= 3 && referralValidation && !referralValidation.valid && !validating && (
                <p className="text-xs text-rose-600">{t('referralInvalid', { defaultValue: 'Código no válido' })}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                {referralCode.trim() ? t('continue') : t('skip', { defaultValue: 'Saltar' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Life Areas */}
      {step === 3 && (
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-foreground text-center">{t('areasTitle')}</h2>
            <p className="text-sm text-muted-foreground text-center mt-1">{t('areasDescription')}</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {LIFE_AREAS.map(({ key, emoji }) => {
                const selected = selectedAreas.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleArea(key)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm font-medium text-foreground">{t(`area_${key}`)}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={() => setStep(4)} disabled={selectedAreas.length === 0} className="flex-1">
                {t('continue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Daily Goal */}
      {step === 4 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">&#x1F3AF;</div>
            <h2 className="text-xl font-bold text-foreground">{t('goalTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('goalDescription')}</p>

            <div className="flex justify-center gap-3 mt-6">
              {['15', '30', '60', '90'].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDailyGoal(mins)}
                  className={`rounded-xl border px-4 py-3 transition-all ${
                    dailyGoal === mins
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <p className="text-lg font-bold text-foreground">{mins}</p>
                  <p className="text-[10px] text-muted-foreground">{t('minutes')}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={() => setStep(5)} className="flex-1">
                {t('continue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Summary */}
      {step === 5 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">&#x1F680;</div>
            <h2 className="text-xl font-bold text-foreground">{t('readyTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('readyDescription')}</p>

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">{t('name')}</span>
                <span className="text-sm font-medium text-foreground">{name}</span>
              </div>
              {referralValidation?.valid && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                  <span className="text-sm text-muted-foreground">{t('referralLabel', { defaultValue: 'Referido' })}</span>
                  <span className="text-sm font-medium text-foreground">{referralValidation.ambassadorName}</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">{t('focusAreas')}</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {selectedAreas.map((a) => (
                    <Badge key={a} variant="secondary" className="text-xs">
                      {t(`area_${a}`)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">{t('dailyGoal')}</span>
                <span className="text-sm font-medium text-foreground">{dailyGoal} {t('minutesPerDay')}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={handleComplete} disabled={completeOnboarding.isPending} className="flex-1">
                {t('getStarted')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
