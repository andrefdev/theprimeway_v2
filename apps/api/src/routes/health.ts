import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

export const healthRoutes = new OpenAPIHono()

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
            uptime: z.number(),
          }),
        },
      },
      description: 'Server is healthy',
    },
  },
})

healthRoutes.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})
