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
import { goalsRoutes } from './routes/goals'
import { pomodoroRoutes } from './routes/pomodoro'
import { calendarRoutes } from './routes/calendar'
import { chatRoutes } from './routes/chat'
import { gamificationRoutes } from './routes/gamification'
import { subscriptionRoutes } from './routes/subscriptions'
import { notificationRoutes } from './routes/notifications'
import { cronRoutes } from './routes/cron'
import { dashboardRoutes } from './routes/dashboard'
import { featuresRoutes } from './routes/features'
import { adminRoutes } from './routes/admin'
import { visionRoutes } from './routes/vision'
import { channelsRoutes } from './routes/channels'
import { workingSessionsRoutes } from './routes/working-sessions'
import { workingHoursRoutes } from './routes/working-hours'
import { recurringSeriesRoutes } from './routes/recurring-series'
import { ritualsRoutes } from './routes/rituals'
import { commandsRoutes } from './routes/commands'
import { schedulingRoutes } from './routes/scheduling'
import { apiKeysRoutes } from './routes/api-keys'
import { webhooksRoutes } from './routes/webhooks'
import { subtasksRoutes } from './routes/subtasks'
import { fatigueRoutes } from './routes/fatigue'
import { brainRoutes } from './routes/brain'

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
app.route('/api/goals', goalsRoutes)
app.route('/api/pomodoro', pomodoroRoutes)
app.route('/api/calendar', calendarRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/gamification', gamificationRoutes)
app.route('/api/subscriptions', subscriptionRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/cron', cronRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/features', featuresRoutes)
app.route('/api/admin', adminRoutes)

// Vision-to-Execution OS (Phase 1)
app.route('/api/vision', visionRoutes)
app.route('/api/channels', channelsRoutes)
app.route('/api/working-sessions', workingSessionsRoutes)
app.route('/api/working-hours', workingHoursRoutes)
app.route('/api/recurring-series', recurringSeriesRoutes)
app.route('/api/rituals', ritualsRoutes)
app.route('/api/commands', commandsRoutes)
app.route('/api/scheduling', schedulingRoutes)
app.route('/api/api-keys', apiKeysRoutes)
app.route('/api/webhooks', webhooksRoutes)
app.route('/api', subtasksRoutes)
app.route('/api/fatigue', fatigueRoutes)
app.route('/api/brain', brainRoutes)

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
