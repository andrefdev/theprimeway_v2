import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '../../../stores/auth.store'
import { useCompleteOnboarding } from '../queries'

const TOTAL_STEPS = 4

const LIFE_AREAS = [
  { key: 'career', emoji: '\uD83D\uDCBC' },
  { key: 'health', emoji: '\uD83C\uDFCB\uFE0F' },
  { key: 'finances', emoji: '\uD83D\uDCB0' },
  { key: 'relationships', emoji: '\u2764\uFE0F' },
  { key: 'mindset', emoji: '\uD83E\uDDE0' },
  { key: 'lifestyle', emoji: '\u2728' },
] as const

export function OnboardingWizard() {
  const { t, i18n } = useTranslation('onboarding')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState(1)
  const [name, setName] = useState(user?.name || '')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [dailyGoal, setDailyGoal] = useState('30')
  const completeOnboarding = useCompleteOnboarding()

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

      {/* Step 2: Life Areas */}
      {step === 2 && (
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
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={() => setStep(3)} disabled={selectedAreas.length === 0} className="flex-1">
                {t('continue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Daily Goal */}
      {step === 3 && (
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
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                {t('continue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
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
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">{t('focusAreas')}</span>
                <div className="flex gap-1">
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
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
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
