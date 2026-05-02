import { useState, useEffect } from 'react'
import { View, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Text } from '@/shared/components/ui/text'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Icon } from '@/shared/components/ui/icon'
import { Sparkles, CheckCircle2, ChevronRight } from 'lucide-react-native'
import { useTranslation } from '@/shared/hooks/useTranslation'
import { ambassadorService } from '@/features/ambassador/services/ambassadorService'

export default function ReferralScreen() {
  const { t } = useTranslation('features.onboarding')
  const [code, setCode] = useState('')
  const [validation, setValidation] = useState<{ valid: boolean; ambassadorName?: string } | null>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    const trimmed = code.trim()
    if (trimmed.length < 3) {
      setValidation(null)
      return
    }
    setValidating(true)
    const handle = setTimeout(async () => {
      try {
        const r = await ambassadorService.validateCode(trimmed)
        setValidation(r.valid && r.data ? { valid: true, ambassadorName: r.data.ambassadorName } : { valid: false })
      } catch {
        setValidation({ valid: false })
      } finally {
        setValidating(false)
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [code])

  async function handleNext() {
    if (code.trim() && validation?.valid) {
      try {
        await ambassadorService.redeemCode(code.trim())
      } catch {
        // Non-blocking
      }
    }
    router.push('/(onboarding)/goals')
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 pt-12">
        <View className="items-center mb-8">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/15 mb-4">
            <Icon as={Sparkles} size={36} className="text-indigo-500" />
          </View>
          <Text className="text-2xl font-bold text-center text-foreground">
            {t('referral.title', { defaultValue: '¿Alguien te invitó?' })}
          </Text>
          <Text className="text-center text-base text-muted-foreground mt-2">
            {t('referral.description', { defaultValue: 'Si te invitó un embajador, ingresa su código aquí. Es opcional.' })}
          </Text>
        </View>

        <View className="space-y-3">
          <Text className="text-sm text-muted-foreground">
            {t('referral.codeLabel', { defaultValue: 'Código de referido' })}
          </Text>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder="ej. andre-7k2x"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {validating && (
            <Text className="text-xs text-muted-foreground">
              {t('referral.validating', { defaultValue: 'Validando...' })}
            </Text>
          )}
          {validation?.valid && (
            <View className="flex-row items-center gap-2">
              <Icon as={CheckCircle2} size={16} className="text-emerald-500" />
              <Text className="text-sm text-emerald-600">
                {t('referral.validBy', { defaultValue: 'Invitado por' })} {validation.ambassadorName}
              </Text>
            </View>
          )}
          {code.trim().length >= 3 && validation && !validation.valid && !validating && (
            <Text className="text-xs text-rose-600">
              {t('referral.invalid', { defaultValue: 'Código no válido' })}
            </Text>
          )}
        </View>
      </View>

      <View className="px-8 pb-6 gap-3">
        <Button size="lg" className="w-full" onPress={handleNext}>
          <Text className="text-base font-semibold text-primary-foreground">
            {code.trim() ? t('buttons.continue', { defaultValue: 'Continuar' }) : t('buttons.skip', { defaultValue: 'Saltar' })}
          </Text>
          <Icon as={ChevronRight} size={20} className="text-primary-foreground" />
        </Button>
      </View>
    </SafeAreaView>
  )
}
