import { Sparkles, TrendingUp, Award, DollarSign } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useTranslation } from 'react-i18next'

interface Props {
  onApply: () => void
}

export function AmbassadorBanner({ onApply }: Props) {
  const { t } = useTranslation('ambassador')
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-8 text-white shadow-xl">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-widest uppercase">{t('banner.badge', { defaultValue: 'Programa de Embajadores' })}</span>
        </div>
        <h2 className="text-3xl font-bold mb-3">
          {t('banner.title', { defaultValue: 'Conviértete en embajador de ThePrimeWay' })}
        </h2>
        <p className="text-white/90 max-w-2xl mb-6 leading-relaxed">
          {t('banner.subtitle', { defaultValue: 'Comparte ThePrimeWay con tu audiencia y gana comisiones recurrentes por cada usuario que traigas. Mientras más referidos pagos atraigas, más subes de tier y mayor es tu %.' })}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <DollarSign className="h-5 w-5 mb-2" />
            <div className="font-semibold mb-1">{t('banner.perk1Title', { defaultValue: '20% comisión recurrente' })}</div>
            <div className="text-sm text-white/80">{t('banner.perk1Desc', { defaultValue: 'Cada mes que tu referido pague, ganas comisión' })}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <TrendingUp className="h-5 w-5 mb-2" />
            <div className="font-semibold mb-1">{t('banner.perk2Title', { defaultValue: 'Sube de tier' })}</div>
            <div className="text-sm text-white/80">{t('banner.perk2Desc', { defaultValue: 'Bronze → Silver → Gold → Platinum. Hasta 30%' })}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Award className="h-5 w-5 mb-2" />
            <div className="font-semibold mb-1">{t('banner.perk3Title', { defaultValue: 'Perks exclusivos' })}</div>
            <div className="text-sm text-white/80">{t('banner.perk3Desc', { defaultValue: 'Co-marketing, soporte prioritario, partnership custom' })}</div>
          </div>
        </div>

        <Button
          size="lg"
          onClick={onApply}
          className="bg-white text-indigo-700 hover:bg-white/90 font-semibold shadow-lg"
        >
          {t('banner.cta', { defaultValue: 'Aplicar ahora' })}
        </Button>
      </div>
    </div>
  )
}
