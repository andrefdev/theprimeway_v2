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
import { useLogin, useRegister } from '@/features/auth/queries'
import { OAuthButtons } from '@/features/auth/components/OAuthButtons'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import logoSvg from '@/shared/assets/logo.svg'

export const Route = createFileRoute('/_auth/login')({
  component: AuthPage,
})

function AuthPage() {
  const { t } = useTranslation('auth')

  return (
    <div className="space-y-8">
      {/* Brand — only visible on mobile (desktop shows left panel) */}
      <div className="flex flex-col items-center gap-3 lg:hidden">
        <img src={logoSvg} alt="The Prime Way" className="h-10 w-10" />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          The Prime Way
        </h1>
      </div>

      {/* Desktop heading */}
      <div className="hidden lg:block">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t('loginTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="login" className="text-xs font-medium">
            {t('loginTitle')}
          </TabsTrigger>
          <TabsTrigger value="register" className="text-xs font-medium">
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
      <OAuthButtons />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            {t('oauthDivider')}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">
            {t('email')}
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            className="h-10"
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? 'login-email-error' : undefined}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p id="login-email-error" role="alert" className="text-[11px] text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">
              {t('password')}
            </Label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('passwordPlaceholder')}
              className="h-10 pr-10"
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? 'login-password-error' : undefined}
              {...form.register('password')}
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
          {form.formState.errors.password && (
            <p id="login-password-error" role="alert" className="text-[11px] text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full h-10" disabled={login.isPending}>
          {login.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {t('signIn')}
        </Button>
      </form>
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
      <OAuthButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            {t('oauthDivider')}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="register-name" className="text-xs font-medium text-muted-foreground">
            {t('name')}
          </Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            className="h-10"
            aria-invalid={!!form.formState.errors.name}
            aria-describedby={form.formState.errors.name ? 'register-name-error' : undefined}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p id="register-name-error" role="alert" className="text-[11px] text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email" className="text-xs font-medium text-muted-foreground">
            {t('email')}
          </Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            className="h-10"
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? 'register-email-error' : undefined}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p id="register-email-error" role="alert" className="text-[11px] text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password" className="text-xs font-medium text-muted-foreground">
            {t('passwordNew')}
          </Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('passwordNewPlaceholder')}
              className="h-10 pr-10"
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? 'register-password-error' : undefined}
              {...form.register('password')}
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
          {form.formState.errors.password && (
            <p id="register-password-error" role="alert" className="text-[11px] text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full h-10" disabled={register.isPending}>
          {register.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {t('createAccount')}
        </Button>
      </form>
    </div>
  )
}
