import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppEnv } from './types/env'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { errorHandler } from './middleware/error-handler'
import { authRoutes } from './routes/auth'
import { healthRoutes } from './routes/health'
import { userRoutes } from './routes/user'
import { taskRoutes } from './routes/tasks'
import { habitRoutes } from './routes/habits'
import { notesRoutes } from './routes/notes'
import { goalsRoutes } from './routes/goals'
import { financesRoutes } from './routes/finances'
import { pomodoroRoutes } from './routes/pomodoro'
import { calendarRoutes } from './routes/calendar'
import { chatRoutes } from './routes/chat'
import { gamificationRoutes } from './routes/gamification'
import { readingRoutes } from './routes/reading'
import { subscriptionRoutes } from './routes/subscriptions'
import { notificationRoutes } from './routes/notifications'
import { cronRoutes } from './routes/cron'
import { dashboardRoutes } from './routes/dashboard'
import { featuresRoutes } from './routes/features'
import { adminRoutes } from './routes/admin'

// Create app with OpenAPI support
export const app = new OpenAPIHono<AppEnv>()

// Global middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173', // Vite dev
      'http://localhost:3000', // Legacy Next.js
      'https://app.theprimeway.app',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Error handler
app.onError(errorHandler)

// Routes
app.route('/api/health', healthRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/user', userRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/habits', habitRoutes)
app.route('/api/notes', notesRoutes)
app.route('/api/goals', goalsRoutes)
app.route('/api/finances', financesRoutes)
app.route('/api/pomodoro', pomodoroRoutes)
app.route('/api/calendar', calendarRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/gamification', gamificationRoutes)
app.route('/api/reading', readingRoutes)
app.route('/api/subscriptions', subscriptionRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/cron', cronRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/features', featuresRoutes)
app.route('/api/admin', adminRoutes)

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

// OpenAPI spec endpoint
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'The Prime Way API',
    version: '1.0.0',
    description: 'REST API for The Prime Way productivity platform',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Development' },
    { url: 'https://api.theprimeway.app', description: 'Production' },
  ],
})
