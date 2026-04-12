import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@repo/shared/validators'
import { useLogin, useRegister } from '../../features/auth/queries'
import { OAuthButtons } from '../../features/auth/components/oauth-buttons'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'

export const Route = createFileRoute('/_auth/login')({
  component: AuthPage,
})

function AuthPage() {
  const { t } = useTranslation('auth')

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center pt-8 pb-4">
          <img
            src="/logo.svg"
            alt="The Prime Way"
            className="h-[100px] w-[100px] transition-transform duration-300 hover:scale-105"
          />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">
          The Prime Way
        </h1>
      </div>

      {/* Card with Tabs */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-xs">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-background"
            >
              {t('loginTitle')}
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-background"
            >
              {t('registerTitle')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="mt-0">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function LoginForm() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const login = useLogin()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginInput) {
    setError(null)
    try {
      await login.mutateAsync(data)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.response?.data?.error || t('loginFailed'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">{t('loginTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{t('email')}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">{t('password')}</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('passwordPlaceholder')}
              className="pr-10"
              {...form.register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </Button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending && (
            <Loader2Icon className="size-4 animate-spin" />
          )}
          {login.isPending ? t('signingIn') : t('signIn')}
        </Button>

        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            {t('forgotPassword')}
          </Link>
        </div>
      </form>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card/50 px-2 text-muted-foreground">
            {t('oauthDivider')}
          </span>
        </div>
      </div>

      <OAuthButtons />
    </div>
  )
}

function RegisterForm() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const register = useRegister()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(data: RegisterInput) {
    setError(null)
    try {
      await register.mutateAsync(data)
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.response?.data?.error || t('registerFailed'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">{t('registerTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('registerSubtitle')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">{t('name')}</Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">{t('email')}</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">{t('passwordNew')}</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('passwordNewPlaceholder')}
              className="pr-10"
              {...form.register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </Button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={register.isPending}
        >
          {register.isPending && (
            <Loader2Icon className="size-4 animate-spin" />
          )}
          {register.isPending ? t('creatingAccount') : t('createAccount')}
        </Button>
      </form>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card/50 px-2 text-muted-foreground">
            {t('oauthDivider')}
          </span>
        </div>
      </div>

      <OAuthButtons />
    </div>
  )
}
