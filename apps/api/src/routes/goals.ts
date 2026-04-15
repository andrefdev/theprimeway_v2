/**
 * Goals Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request (query params, body, path params)
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { authMiddleware } from '../middleware/auth'
import { goalsService } from '../services/goals.service'
import { LimitExceededError } from '../lib/limits'
import { parsePaginationLimit, parsePaginationOffset } from '../lib/utils'
import { GOAL_TEMPLATES, GOAL_TEMPLATE_CATEGORIES } from '@repo/shared/constants'

export const goalsRoutes = new OpenAPIHono<AppEnv>()
goalsRoutes.use('*', authMiddleware)

// ─── Shared schemas ──────────────────────────────────────────────────────────

const errorResponse = z.object({ error: z.string() })
const genericData = z.any()

// ═══════════════════════════════════════════════════════════════════════════════
// GOALS (legacy / simple goals)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals
const listGoalsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Goals'],
  summary: 'List goals',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      search: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Goals list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listGoalsRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await goalsService.listGoals(userId, {
      status: q.status,
      type: q.type,
      search: q.search,
      limit: parsePaginationLimit(q.limit, 50),
      offset: parsePaginationOffset(q.offset),
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[GOALS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /goals
const createGoalBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  type: z.string().default('short-term'),
  status: z.string().default('in-progress'),
  relatedTasks: z.array(z.string()).optional(),
})

const createGoalRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Goals'],
  summary: 'Create a goal',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createGoalBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Goal created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    409: { content: { 'application/json': { schema: z.object({ error: z.string(), limitType: z.string() }) } }, description: 'Limit exceeded' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createGoalRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const goal = await goalsService.createGoal(userId, body)
    return c.json(goal, 200)
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return c.json({ error: error.message, limitType: error.limitType }, 409)
    }
    console.error('[GOALS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/dashboard-summary
const getDashboardSummaryRoute = createRoute({
  method: 'get',
  path: '/dashboard-summary',
  tags: ['Goals'],
  summary: 'Get high-level goal progress overview',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Dashboard summary' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(getDashboardSummaryRoute, async (c) => {
  const { userId } = c.get('user')

  try {
    const summary = await goalsService.getDashboardSummary(userId)
    return c.json(summary, 200)
  } catch (error) {
    console.error('[GOALS_DASHBOARD_SUMMARY]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GOAL TREE
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/tree
const getGoalTreeRoute = createRoute({
  method: 'get',
  path: '/tree',
  tags: ['Goals'],
  summary: 'Get complete goal hierarchy tree',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      visionId: z.string().optional(),
      threeYearId: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Goal tree' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(getGoalTreeRoute, async (c) => {
  const { userId } = c.get('user')
  const { visionId, threeYearId } = c.req.valid('query')

  try {
    const tree = await goalsService.getGoalTree(userId, { visionId, threeYearId })
    return c.json(tree, 200)
  } catch (error) {
    console.error('[GOALS_TREE_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES (OBJ-F09)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/templates
const listTemplatesRoute = createRoute({
  method: 'get',
  path: '/templates',
  tags: ['Goals - Templates'],
  summary: 'List all goal templates',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ categories: z.array(z.string()), templates: z.array(genericData) }) } }, description: 'All templates' },
  },
})

goalsRoutes.openapi(listTemplatesRoute, async (c) => {
  return c.json({ categories: [...GOAL_TEMPLATE_CATEGORIES], templates: GOAL_TEMPLATES }, 200)
})

// GET /goals/templates/:category
const listTemplatesByCategoryRoute = createRoute({
  method: 'get',
  path: '/templates/:category',
  tags: ['Goals - Templates'],
  summary: 'List goal templates by category',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ category: z.string() }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ category: z.string(), templates: z.array(genericData) }) } }, description: 'Templates for category' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Category not found' },
  },
})

goalsRoutes.openapi(listTemplatesByCategoryRoute, async (c) => {
  const { category } = c.req.valid('param')
  if (!GOAL_TEMPLATE_CATEGORIES.includes(category as any)) {
    return c.json({ error: `Unknown category: ${category}` }, 404)
  }
  const templates = GOAL_TEMPLATES.filter((t) => t.category === category)
  return c.json({ category, templates }, 200)
})

// ═══════════════════════════════════════════════════════════════════════════════
// VISIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/visions
const listVisionsRoute = createRoute({
  method: 'get',
  path: '/visions',
  tags: ['Goals - Visions'],
  summary: 'List visions',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Visions list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listVisionsRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await goalsService.listVisions(userId, {
      status: q.status, search: q.search,
      limit: parsePaginationLimit(q.limit, 50), offset: parsePaginationOffset(q.offset),
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[VISIONS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /goals/visions
const createVisionBody = z.object({
  title: z.string().min(1),
  narrative: z.string().optional(),
  status: z.string().optional(),
})

const createVisionRoute = createRoute({
  method: 'post',
  path: '/visions',
  tags: ['Goals - Visions'],
  summary: 'Create a vision',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createVisionBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Vision created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createVisionRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const vision = await goalsService.createVision(userId, body)
    return c.json(vision, 200)
  } catch (error) {
    console.error('[VISIONS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /goals/visions/:id
const updateVisionBody = createVisionBody.partial()

const updateVisionRoute = createRoute({
  method: 'patch',
  path: '/visions/:id',
  tags: ['Goals - Visions'],
  summary: 'Update a vision',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateVisionBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Vision updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(updateVisionRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const vision = await goalsService.updateVision(userId, id, body)
    if (!vision) return c.json({ error: 'Not found' }, 404)
    return c.json(vision, 200)
  } catch (error) {
    console.error('[VISION_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/visions/:id
const deleteVisionRoute = createRoute({
  method: 'delete',
  path: '/visions/:id',
  tags: ['Goals - Visions'],
  summary: 'Delete a vision',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Vision deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteVisionRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteVision(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[VISION_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PILLARS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/pillars
const listPillarsRoute = createRoute({
  method: 'get',
  path: '/three-year',
  tags: ['Goals - Pillars'],
  summary: 'List pillars',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      visionId: z.string().optional(),
      area: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Pillars list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listPillarsRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await goalsService.listThreeYearGoals(userId, {
      visionId: q.visionId, area: q.area,
      limit: parsePaginationLimit(q.limit, 50), offset: parsePaginationOffset(q.offset),
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[PILLARS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /goals/pillars
const createPillarBody = z.object({
  visionId: z.string().min(1),
  area: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
})

const createPillarRoute = createRoute({
  method: 'post',
  path: '/three-year',
  tags: ['Goals - Pillars'],
  summary: 'Create a pillar',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createPillarBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Pillar created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createPillarRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const pillar = await goalsService.createThreeYearGoal(userId, body)
    return c.json(pillar, 200)
  } catch (error) {
    console.error('[PILLARS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /goals/pillars/:id
const updatePillarBody = createPillarBody.partial()

const updatePillarRoute = createRoute({
  method: 'patch',
  path: '/pillars/:id',
  tags: ['Goals - Pillars'],
  summary: 'Update a pillar',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updatePillarBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Pillar updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(updatePillarRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const pillar = await goalsService.updateThreeYearGoal(userId, id, body)
    if (!pillar) return c.json({ error: 'Not found' }, 404)
    return c.json(pillar, 200)
  } catch (error) {
    console.error('[PILLAR_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/pillars/:id
const deletePillarRoute = createRoute({
  method: 'delete',
  path: '/pillars/:id',
  tags: ['Goals - Pillars'],
  summary: 'Delete a pillar',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Pillar deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deletePillarRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteThreeYearGoal(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[PILLAR_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// OUTCOMES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/outcomes
const listOutcomesRoute = createRoute({
  method: 'get',
  path: '/annual',
  tags: ['Goals - Outcomes'],
  summary: 'List outcomes',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      threeYearGoalId: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Outcomes list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listOutcomesRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await goalsService.listAnnualGoals(userId, {
      threeYearGoalId: q.threeYearGoalId,
      limit: parsePaginationLimit(q.limit, 50), offset: parsePaginationOffset(q.offset),
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[OUTCOMES_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /goals/outcomes
const createOutcomeBody = z.object({
  threeYearGoalId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  targetMetrics: z.any().optional(),
  targetDate: z.string().optional(),
})

const createOutcomeRoute = createRoute({
  method: 'post',
  path: '/annual',
  tags: ['Goals - Outcomes'],
  summary: 'Create an outcome',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createOutcomeBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Outcome created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createOutcomeRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const outcome = await goalsService.createAnnualGoal(userId, body)
    return c.json(outcome, 200)
  } catch (error) {
    console.error('[OUTCOMES_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /goals/outcomes/:id
const updateOutcomeBody = createOutcomeBody.partial()

const updateOutcomeRoute = createRoute({
  method: 'patch',
  path: '/outcomes/:id',
  tags: ['Goals - Outcomes'],
  summary: 'Update an outcome',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateOutcomeBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Outcome updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(updateOutcomeRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const outcome = await goalsService.updateAnnualGoal(userId, id, body)
    if (!outcome) return c.json({ error: 'Not found' }, 404)
    return c.json(outcome, 200)
  } catch (error) {
    console.error('[OUTCOME_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/outcomes/:id
const deleteOutcomeRoute = createRoute({
  method: 'delete',
  path: '/outcomes/:id',
  tags: ['Goals - Outcomes'],
  summary: 'Delete an outcome',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Outcome deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteOutcomeRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteAnnualGoal(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[OUTCOME_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUSES (Quarter Focus)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/focuses
const listFocusesRoute = createRoute({
  method: 'get',
  path: '/quarterly',
  tags: ['Goals - Focuses'],
  summary: 'List quarterly focuses',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      annualGoalId: z.string().optional(),
      year: z.string().optional(),
      quarter: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Focuses list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listFocusesRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await goalsService.listQuarterlyGoals(userId, {
      annualGoalId: q.annualGoalId,
      year: q.year ? parseInt(q.year) : undefined,
      quarter: q.quarter ? parseInt(q.quarter) : undefined,
      limit: parsePaginationLimit(q.limit, 50), offset: parsePaginationOffset(q.offset),
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[FOCUSES_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /goals/focuses
const createFocusBody = z.object({
  annualGoalId: z.string().optional(),
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4),
  title: z.string().min(1),
  objectives: z.array(z.any()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const createFocusRoute = createRoute({
  method: 'post',
  path: '/quarterly',
  tags: ['Goals - Focuses'],
  summary: 'Create a quarterly focus',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createFocusBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Focus created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createFocusRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const focus = await goalsService.createQuarterlyGoal(userId, body)
    return c.json(focus, 200)
  } catch (error) {
    console.error('[FOCUSES_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /goals/focuses/:id
const updateFocusBody = createFocusBody.partial()

const updateFocusRoute = createRoute({
  method: 'patch',
  path: '/focuses/:id',
  tags: ['Goals - Focuses'],
  summary: 'Update a quarterly focus',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateFocusBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Focus updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(updateFocusRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const focus = await goalsService.updateQuarterlyGoal(userId, id, body)
    if (!focus) return c.json({ error: 'Not found' }, 404)
    return c.json(focus, 200)
  } catch (error) {
    console.error('[FOCUS_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/focuses/:id
const deleteFocusRoute = createRoute({
  method: 'delete',
  path: '/focuses/:id',
  tags: ['Goals - Focuses'],
  summary: 'Delete a quarterly focus',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Focus deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteFocusRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteQuarterlyGoal(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[FOCUS_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY GOALS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/weekly
const listWeeklyRoute = createRoute({
  method: 'get',
  path: '/weekly',
  tags: ['Goals - Weekly'],
  summary: 'List weekly goals',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      quarterlyGoalId: z.string().optional(),
      weekStartDate: z.string().optional(),
      status: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Weekly goals list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listWeeklyRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await goalsService.listWeeklyGoals(userId, {
      quarterlyGoalId: q.quarterlyGoalId, weekStartDate: q.weekStartDate, status: q.status,
      limit: parsePaginationLimit(q.limit, 50), offset: parsePaginationOffset(q.offset),
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[WEEKLY_GOALS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /goals/weekly
const createWeeklyBody = z.object({
  quarterlyGoalId: z.string().optional(),
  weekStartDate: z.string(),
  title: z.string().min(1),
  status: z.string().default('not-started'),
})

const createWeeklyRoute = createRoute({
  method: 'post',
  path: '/weekly',
  tags: ['Goals - Weekly'],
  summary: 'Create a weekly goal',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createWeeklyBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Weekly goal created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createWeeklyRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const goal = await goalsService.createWeeklyGoal(userId, body)
    return c.json(goal, 200)
  } catch (error) {
    console.error('[WEEKLY_GOALS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /goals/weekly/:id
const updateWeeklyBody = createWeeklyBody.partial()

const updateWeeklyRoute = createRoute({
  method: 'patch',
  path: '/weekly/:id',
  tags: ['Goals - Weekly'],
  summary: 'Update a weekly goal',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateWeeklyBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Weekly goal updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(updateWeeklyRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const goal = await goalsService.updateWeeklyGoal(userId, id, body)
    if (!goal) return c.json({ error: 'Not found' }, 404)
    return c.json(goal, 200)
  } catch (error) {
    console.error('[WEEKLY_GOAL_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/weekly/:id
const deleteWeeklyRoute = createRoute({
  method: 'delete',
  path: '/weekly/:id',
  tags: ['Goals - Weekly'],
  summary: 'Delete a weekly goal',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Weekly goal deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteWeeklyRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteWeeklyGoal(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[WEEKLY_GOAL_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/health-snapshots
const listSnapshotsRoute = createRoute({
  method: 'get',
  path: '/health-snapshots',
  tags: ['Goals - Health Snapshots'],
  summary: 'List goal health snapshots',
  security: [{ Bearer: [] }],
  request: { query: z.object({ quarterlyGoalId: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Snapshots list' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Missing quarterlyGoalId' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listSnapshotsRoute, (async (c: any) => {
  const q = c.req.valid('query')

  try {
    const data = await goalsService.listHealthSnapshots(q.quarterlyGoalId)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[HEALTH_SNAPSHOTS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /goals/health-snapshots
const createSnapshotBody = z.object({
  quarterlyGoalId: z.string(),
  weekStart: z.string(),
  momentumScore: z.number().min(0).max(100),
  status: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
})

const createSnapshotRoute = createRoute({
  method: 'post',
  path: '/health-snapshots',
  tags: ['Goals - Health Snapshots'],
  summary: 'Create a goal health snapshot',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createSnapshotBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Snapshot created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createSnapshotRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const snapshot = await goalsService.createHealthSnapshot(userId, body)
    return c.json(snapshot, 200)
  } catch (error) {
    console.error('[HEALTH_SNAPSHOTS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS LINKS — Tasks
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/focus-links/tasks
const listFocusTaskLinksRoute = createRoute({
  method: 'get',
  path: '/focus-links/tasks',
  tags: ['Goals - Focus Links'],
  summary: 'List focus-task links',
  security: [{ Bearer: [] }],
  request: { query: z.object({ quarterlyGoalId: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Links list' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Missing quarterlyGoalId' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listFocusTaskLinksRoute, (async (c: any) => {
  const q = c.req.valid('query')

  try {
    const data = await goalsService.listFocusTaskLinks(q.quarterlyGoalId)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[FOCUS_TASK_LINKS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /goals/focus-links/tasks
const createFocusTaskLinkBody = z.object({
  quarterlyGoalId: z.string(),
  taskId: z.string(),
  weight: z.number().optional(),
})

const createFocusTaskLinkRoute = createRoute({
  method: 'post',
  path: '/focus-links/tasks',
  tags: ['Goals - Focus Links'],
  summary: 'Create a focus-task link',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createFocusTaskLinkBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Link created' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createFocusTaskLinkRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const link = await goalsService.createFocusTaskLink(userId, body)
    return c.json(link, 200)
  } catch (error) {
    console.error('[FOCUS_TASK_LINKS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/focus-links/tasks/:id
const deleteFocusTaskLinkRoute = createRoute({
  method: 'delete',
  path: '/focus-links/tasks/:id',
  tags: ['Goals - Focus Links'],
  summary: 'Delete a focus-task link',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Link deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteFocusTaskLinkRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteFocusTaskLink(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[FOCUS_TASK_LINK_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS LINKS — Habits
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/focus-links/habits
const listFocusHabitLinksRoute = createRoute({
  method: 'get',
  path: '/focus-links/habits',
  tags: ['Goals - Focus Links'],
  summary: 'List focus-habit links',
  security: [{ Bearer: [] }],
  request: { query: z.object({ quarterlyGoalId: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Links list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listFocusHabitLinksRoute, (async (c: any) => {
  const q = c.req.valid('query')

  try {
    const data = await goalsService.listFocusHabitLinks(q.quarterlyGoalId)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[FOCUS_HABIT_LINKS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /goals/focus-links/habits
const createFocusHabitLinkBody = z.object({
  quarterlyGoalId: z.string(),
  habitId: z.string(),
  weight: z.number().optional(),
})

const createFocusHabitLinkRoute = createRoute({
  method: 'post',
  path: '/focus-links/habits',
  tags: ['Goals - Focus Links'],
  summary: 'Create a focus-habit link',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createFocusHabitLinkBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Link created' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createFocusHabitLinkRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const link = await goalsService.createFocusHabitLink(userId, body)
    return c.json(link, 200)
  } catch (error) {
    console.error('[FOCUS_HABIT_LINKS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/focus-links/habits/:id
const deleteFocusHabitLinkRoute = createRoute({
  method: 'delete',
  path: '/focus-links/habits/:id',
  tags: ['Goals - Focus Links'],
  summary: 'Delete a focus-habit link',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Link deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteFocusHabitLinkRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteFocusHabitLink(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[FOCUS_HABIT_LINK_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS LINKS — Finances
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/focus-links/finances
const listFocusFinanceLinksRoute = createRoute({
  method: 'get',
  path: '/focus-links/finances',
  tags: ['Goals - Focus Links'],
  summary: 'List focus-finance links',
  security: [{ Bearer: [] }],
  request: { query: z.object({ quarterlyGoalId: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Links list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(listFocusFinanceLinksRoute, (async (c: any) => {
  const q = c.req.valid('query')

  try {
    const data = await goalsService.listFocusFinanceLinks(q.quarterlyGoalId)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[FOCUS_FINANCE_LINKS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /goals/focus-links/finances
const createFocusFinanceLinkBody = z.object({
  quarterlyGoalId: z.string(),
  savingsGoalId: z.string().optional(),
  budgetId: z.string().optional(),
  type: z.enum(['saving', 'budget']).default('saving'),
  targetAmount: z.number().optional(),
})

const createFocusFinanceLinkRoute = createRoute({
  method: 'post',
  path: '/focus-links/finances',
  tags: ['Goals - Focus Links'],
  summary: 'Create a focus-finance link',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createFocusFinanceLinkBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Link created' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(createFocusFinanceLinkRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const link = await goalsService.createFocusFinanceLink(userId, body)
    return c.json(link, 200)
  } catch (error) {
    console.error('[FOCUS_FINANCE_LINKS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/focus-links/finances/:id
const deleteFocusFinanceLinkRoute = createRoute({
  method: 'delete',
  path: '/focus-links/finances/:id',
  tags: ['Goals - Focus Links'],
  summary: 'Delete a focus-finance link',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Link deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteFocusFinanceLinkRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteFocusFinanceLink(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[FOCUS_FINANCE_LINK_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ---------------------------------------------------------------------------
// GET /api/goals/ai/child-suggestions
// ---------------------------------------------------------------------------
const childSuggestionsRoute = createRoute({
  method: 'get',
  path: '/ai/child-suggestions',
  tags: ['Goals', 'AI'],
  summary: 'AI suggests sub-goals, tasks, and habits for a goal',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      goalId: z.string(),
      level: z.enum(['ThreeYearGoal', 'AnnualGoal', 'QuarterlyGoal', 'WeeklyGoal']),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            suggestions: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
                type: z.enum(['AnnualGoal', 'QuarterlyGoal', 'WeeklyGoal', 'Task', 'Habit']),
              }),
            ),
          }),
        },
      },
      description: 'Child suggestions',
    },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Goal not found' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed to generate suggestions' },
  },
})

goalsRoutes.openapi(childSuggestionsRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { goalId, level } = c.req.valid('query')

  try {
    const suggestions = await goalsService.generateChildSuggestions(userId, goalId, level)
    return c.json({ suggestions }, 200)
  } catch (err: any) {
    if (err?.message === 'Goal not found') {
      return c.json({ error: 'Goal not found' }, 404)
    }
    return c.json({ error: 'Failed to generate suggestions' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// POST /api/goals/ai/suggest
// ---------------------------------------------------------------------------
const suggestSubGoalsRoute = createRoute({
  method: 'post',
  path: '/ai/suggest',
  tags: ['Goals', 'AI'],
  summary: 'Generate sub-goal suggestions using AI',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            goalId: z.string(),
            type: z.enum(['three-year', 'annual', 'quarterly', 'weekly']),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            suggestions: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
              }),
            ),
          }),
        },
      },
      description: 'Sub-goal suggestions',
    },
    404: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Goal not found' },
    400: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Failed to generate suggestions' },
  },
})

goalsRoutes.openapi(suggestSubGoalsRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { goalId, type } = c.req.valid('json')

  try {
    const result = await goalsService.suggestSubGoals(userId, goalId, type)
    return c.json(result, 200)
  } catch (err) {
    return c.json({ error: 'Failed to generate suggestions' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /api/goals/ai/quarterly-review
// ---------------------------------------------------------------------------
const quarterlyReviewRoute = createRoute({
  method: 'get',
  path: '/ai/quarterly-review',
  tags: ['Goals', 'AI'],
  summary: 'Get AI-generated quarterly review',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      quarter: z.coerce.number().int().min(1).max(4),
      year: z.coerce.number().int(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            summary: z.string(),
            topAchievements: z.array(z.string()),
            stuckAreas: z.array(z.string()),
            proposedFocuses: z.array(z.string()),
          }),
        },
      },
      description: 'Quarterly review',
    },
    400: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Failed to generate review' },
  },
})

goalsRoutes.openapi(quarterlyReviewRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { quarter, year } = c.req.valid('query')

  try {
    const result = await goalsService.getQuarterlyReview(userId, quarter as 1 | 2 | 3 | 4, year)
    return c.json(result, 200)
  } catch (err) {
    return c.json({ error: 'Failed to generate review' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /api/goals/ai/conflicts
// ---------------------------------------------------------------------------
const conflictsRoute = createRoute({
  method: 'get',
  path: '/ai/conflicts',
  tags: ['Goals', 'AI'],
  summary: 'Detect goal conflicts and overcommitment',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Conflict analysis' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed' },
  },
})

goalsRoutes.openapi(conflictsRoute, (async (c: any) => {
  const userId = c.get('user').userId
  try {
    const data = await goalsService.detectConflicts(userId)
    return c.json({ data }, 200)
  } catch (err) {
    return c.json({ error: 'Failed to detect conflicts' }, 400)
  }
}) as any)

// ---------------------------------------------------------------------------
// GET /api/goals/ai/inactive
// ---------------------------------------------------------------------------
const inactiveRoute = createRoute({
  method: 'get',
  path: '/ai/inactive',
  tags: ['Goals', 'AI'],
  summary: 'Detect inactive goals (no activity in N days)',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      days: z.coerce.number().int().min(1).optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Inactive goals' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Failed' },
  },
})

goalsRoutes.openapi(inactiveRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const { days } = c.req.valid('query')
  try {
    const data = await goalsService.detectInactiveGoals(userId, days || 14)
    return c.json({ data }, 200)
  } catch (err) {
    return c.json({ error: 'Failed to detect inactive goals' }, 400)
  }
}) as any)

// ═══════════════════════════════════════════════════════════════════════════════
// GOAL CRUD (:id routes) — Registered LAST to avoid shadowing named routes
// ═══════════════════════════════════════════════════════════════════════════════

// GET /goals/:id
const getGoalRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Goals'],
  summary: 'Get a goal by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Goal found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(getGoalRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const goal = await goalsService.getGoal(userId, id)
    if (!goal) return c.json({ error: 'Not found' }, 404)
    return c.json(goal, 200)
  } catch (error) {
    console.error('[GOAL_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /goals/:id
const updateGoalBody = createGoalBody.partial()

const updateGoalRoute = createRoute({
  method: 'patch',
  path: '/:id',
  tags: ['Goals'],
  summary: 'Update a goal',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateGoalBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: genericData } }, description: 'Goal updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(updateGoalRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const goal = await goalsService.updateGoal(userId, id, body)
    if (!goal) return c.json({ error: 'Not found' }, 404)
    return c.json(goal, 200)
  } catch (error) {
    console.error('[GOAL_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /goals/:id
const deleteGoalRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Goals'],
  summary: 'Delete a goal',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Goal deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

goalsRoutes.openapi(deleteGoalRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const deleted = await goalsService.deleteGoal(userId, id)
    if (!deleted) return c.json({ error: 'Not found' }, 404)
    return c.body(null, 204)
  } catch (error) {
    console.error('[GOAL_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
