import { useEffect } from 'react'
import * as Sentry from '@sentry/react'

export function UnhandledErrorListener() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[UnhandledRejection]', event.reason)
      Sentry.captureException(event.reason)
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('[WindowError]', event.error)
      Sentry.captureException(event.error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      )
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}
