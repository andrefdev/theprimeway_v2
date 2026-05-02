import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { useApplyAmbassador } from '../queries'
import type { AmbassadorPlatform, ApplyPayload } from '../api'
import { toast } from 'sonner'

const PLATFORMS: AmbassadorPlatform[] = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'NEWSLETTER', 'BLOG', 'PODCAST', 'LINKEDIN', 'OTHER']
const NICHES = ['productivity', 'creator', 'developer', 'design', 'business', 'wellness', 'education', 'finance', 'other']
const PROMO_CHANNELS = ['youtube', 'newsletter', 'blog', 'instagram', 'tiktok', 'twitter', 'community', 'paid_ads']
const COUNTRIES_COMMON = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'España' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'BR', name: 'Brasil' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canadá' },
  { code: 'OT', name: 'Otro' },
]

interface Props {
  onCancel: () => void
  onSubmitted: () => void
}

export function AmbassadorApplyForm({ onCancel, onSubmitted }: Props) {
  const { t } = useTranslation('ambassador')
  const apply = useApplyAmbassador()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('US')
  const [platform, setPlatform] = useState<AmbassadorPlatform>('YOUTUBE')
  const [handle, setHandle] = useState('')
  const [audienceSize, setAudienceSize] = useState('')
  const [niche, setNiche] = useState('productivity')
  const [motivation, setMotivation] = useState('')
  const [promoChannels, setPromoChannels] = useState<string[]>([])
  const [sampleUrls, setSampleUrls] = useState<string[]>(['', '', ''])
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [youtube, setYoutube] = useState('')
  const [twitter, setTwitter] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')
  const [agreed, setAgreed] = useState(false)

  function toggleChannel(c: string) {
    setPromoChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return toast.error(t('form.errors.fullName', { defaultValue: 'Nombre completo requerido' }))
    if (motivation.trim().length < 100) return toast.error(t('form.errors.motivation', { defaultValue: 'Motivación mínimo 100 caracteres' }))
    if (!agreed) return toast.error(t('form.errors.terms', { defaultValue: 'Debes aceptar los términos' }))

    const socialLinks: Record<string, string> = {}
    if (instagram.trim()) socialLinks.instagram = instagram.trim()
    if (tiktok.trim()) socialLinks.tiktok = tiktok.trim()
    if (youtube.trim()) socialLinks.youtube = youtube.trim()
    if (twitter.trim()) socialLinks.twitter = twitter.trim()
    if (linkedin.trim()) socialLinks.linkedin = linkedin.trim()
    if (website.trim()) socialLinks.website = website.trim()

    const payload: ApplyPayload = {
      fullName: fullName.trim(),
      contactPhone: phone.trim() || null,
      country,
      primaryPlatform: platform,
      primaryHandle: handle.trim(),
      audienceSize: audienceSize ? Number(audienceSize) : null,
      niche,
      motivation: motivation.trim(),
      promoChannels,
      sampleUrls: sampleUrls.map((u) => u.trim()).filter(Boolean),
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      agreedToTerms: true,
    }

    try {
      await apply.mutateAsync(payload)
      toast.success(t('form.submitted', { defaultValue: 'Solicitud enviada. Te avisaremos por email y notificación.' }))
      onSubmitted()
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Error'
      toast.error(msg)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('form.title', { defaultValue: 'Aplica como embajador' })}</CardTitle>
        <CardDescription>
          {t('form.description', { defaultValue: 'Cuéntanos sobre ti y tu audiencia. Revisamos cada solicitud manualmente.' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">{t('form.fullName', { defaultValue: 'Nombre completo' })} *</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">{t('form.phone', { defaultValue: 'Teléfono (opcional)' })}</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>{t('form.country', { defaultValue: 'País' })} *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES_COMMON.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('form.niche', { defaultValue: 'Nicho' })}</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('form.platform', { defaultValue: 'Plataforma principal' })} *</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as AmbassadorPlatform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="handle">{t('form.handle', { defaultValue: 'Handle / usuario' })} *</Label>
              <Input id="handle" placeholder="@tucuenta" value={handle} onChange={(e) => setHandle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="audienceSize">{t('form.audienceSize', { defaultValue: 'Tamaño de audiencia' })}</Label>
              <Input id="audienceSize" type="number" placeholder="ej. 50000" value={audienceSize} onChange={(e) => setAudienceSize(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="motivation">{t('form.motivation', { defaultValue: '¿Por qué quieres ser embajador? (mín 100 chars)' })} *</Label>
            <Textarea
              id="motivation"
              rows={5}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder={t('form.motivationPlaceholder', { defaultValue: 'Cuéntanos qué te conecta con ThePrimeWay y cómo planeas compartirlo...' })}
              required
            />
            <div className="text-xs text-muted-foreground mt-1">{motivation.length}/1500</div>
          </div>

          <div>
            <Label className="mb-2 block">{t('form.promoChannels', { defaultValue: 'Cómo lo promoverás' })}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROMO_CHANNELS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={promoChannels.includes(c)} onCheckedChange={() => toggleChannel(c)} />
                  <span className="capitalize">{c.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">{t('form.sampleUrls', { defaultValue: 'URLs de ejemplo (contenido relevante)' })}</Label>
            {sampleUrls.map((url, i) => (
              <Input
                key={i}
                placeholder={`https://...`}
                className="mb-2"
                value={url}
                onChange={(e) => {
                  const copy = [...sampleUrls]
                  copy[i] = e.target.value
                  setSampleUrls(copy)
                }}
              />
            ))}
          </div>

          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium text-sm">
              {t('form.socialLinks', { defaultValue: 'Otras redes sociales (opcional)' })}
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div><Label>Instagram</Label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@user" /></div>
              <div><Label>TikTok</Label><Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@user" /></div>
              <div><Label>YouTube</Label><Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="@channel" /></div>
              <div><Label>Twitter / X</Label><Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@user" /></div>
              <div><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/..." /></div>
              <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." /></div>
            </div>
          </details>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
            <span>
              {t('form.terms', { defaultValue: 'Acepto los términos del programa de embajadores: comisiones recurrentes mientras el referido siga pagando, sin clawback en MVP, posible suspensión por fraude o spam.' })}
            </span>
          </label>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={onCancel}>{t('form.cancel', { defaultValue: 'Cancelar' })}</Button>
            <Button type="submit" disabled={apply.isPending}>
              {apply.isPending ? t('form.submitting', { defaultValue: 'Enviando...' }) : t('form.submit', { defaultValue: 'Enviar solicitud' })}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
