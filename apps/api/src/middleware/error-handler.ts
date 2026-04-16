import type { ErrorHandler } from 'hono'
import { ZodError } from 'zod'
import * as Sentry from '@sentry/node'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[API Error] ${err.message}`, err.stack)

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
