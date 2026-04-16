import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api'
import { useAuthStore } from '@/shared/stores/auth.store'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          prompt: (cb?: (notification: { isNotDisplayed: () => boolean }) => void) => void
        }
      }
    }
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void
        signIn: () => Promise<{
          authorization: { id_token: string; code: string }
        }>
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export function useOAuth() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const loginSuccess = useAuthStore((s) => s.loginSuccess)
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loginWithGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      setError(t('oauthNotConfigured', 'Google login is not configured'))
      return
    }

    setLoading('google')
    setError(null)

    try {
      await loadScript('https://accounts.google.com/gsi/client')

      const credential = await new Promise<string>((resolve, reject) => {
        window.google!.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              resolve(response.credential)
            } else {
              reject(new Error('No credential returned'))
            }
          },
        })
        window.google!.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            reject(new Error('Google prompt not displayed'))
          }
        })
      })

      const result = await authApi.oauth({
        provider: 'google',
        accessToken: credential,
        idToken: credential,
      })

      loginSuccess(result.token, result.refreshToken, result.user)
      navigate({ to: '/' })
    } catch {
      setError(t('oauthFailed', 'Google login failed. Please try again.'))
    } finally {
      setLoading(null)
    }
  }

  async function loginWithApple() {
    if (!APPLE_CLIENT_ID) {
      setError(t('oauthNotConfigured', 'Apple login is not configured'))
      return
    }

    setLoading('apple')
    setError(null)

    try {
      await loadScript(
        'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
      )

      window.AppleID!.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: APPLE_REDIRECT_URI || window.location.origin,
        usePopup: true,
      })

      const response = await window.AppleID!.auth.signIn()
      const { id_token } = response.authorization

      const result = await authApi.oauth({
        provider: 'apple',
        accessToken: id_token,
        idToken: id_token,
      })

      loginSuccess(result.token, result.refreshToken, result.user)
      navigate({ to: '/' })
    } catch {
      setError(t('oauthFailed', 'Apple login failed. Please try again.'))
    } finally {
      setLoading(null)
    }
  }

  return { loginWithGoogle, loginWithApple, loading, error, clearError: () => setError(null) }
}
