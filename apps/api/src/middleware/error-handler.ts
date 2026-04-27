import type { ErrorHandler } from 'hono'
import { ZodError } from 'zod'
import * as Sentry from '@sentry/node'
import { LimitExceededError } from '../lib/limits'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[API Error] ${err.message}`, err.stack)

  if (err instanceof LimitExceededError) {
    return c.json(
      {
        error: err.message,
        code: 'limit_exceeded',
        limitType: err.limitType,
      },
      409,
    )
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation Error',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      400,
    )
  }

  Sentry.captureException(err)

  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500,
  )
}
