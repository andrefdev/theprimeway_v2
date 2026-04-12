/**
 * Reading Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { FEATURES } from '@repo/shared/constants'
import { addBookSchema, updateBookSchema, createReadingGoalSchema, updateReadingGoalSchema } from '@repo/shared/validators'
import { authMiddleware } from '../middleware/auth'
import { requireFeature } from '../middleware/feature-gate'
import { parsePaginationLimit, parsePaginationOffset } from '../lib/utils'
import { readingService } from '../services/reading.service'

export const readingRoutes = new OpenAPIHono<AppEnv>()

readingRoutes.use('*', authMiddleware)
readingRoutes.use('*', requireFeature(FEATURES.READING_MODULE))

const errorResponse = z.object({ error: z.string() })

// ---------------------------------------------------------------------------
// GET /books
// ---------------------------------------------------------------------------
const listBooksRoute = createRoute({
  method: 'get',
  path: '/books',
  tags: ['Reading'],
  summary: 'List books',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()), count: z.number() }) } }, description: 'Books' },
  },
})

readingRoutes.openapi(listBooksRoute, async (c) => {
  const userId = c.get('user').userId
  const q = c.req.query()

  const { books, count } = await readingService.listBooks(userId, {
    status: q.status || undefined,
    priority: q.priority || undefined,
    plannedQuarter: q.plannedQuarter || q.planned_quarter || undefined,
    favorite: q.favorite === 'true' ? true : undefined,
    search: q.search || undefined,
    limit: parsePaginationLimit(q.limit, 50),
    offset: parsePaginationOffset(q.offset),
  })

  return c.json({ data: books, count }, 200)
})

// ---------------------------------------------------------------------------
// POST /books
// ---------------------------------------------------------------------------
const addBookRoute = createRoute({
  method: 'post',
  path: '/books',
  tags: ['Reading'],
  summary: 'Add a book to library',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: addBookSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Book added' },
    409: { content: { 'application/json': { schema: z.object({ error: z.string(), data: z.any() }) } }, description: 'Already exists' },
  },
})

readingRoutes.openapi(addBookRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const result = await readingService.addBook(userId, body)

  if ('error' in result && result.error === 'already_exists') {
    return c.json({ error: 'Book already in library', data: result.data }, 409)
  }

  return c.json({ data: result.data }, 201)
})

// ---------------------------------------------------------------------------
// GET /books/stats
// ---------------------------------------------------------------------------
const statsRoute = createRoute({
  method: 'get',
  path: '/books/stats',
  tags: ['Reading'],
  summary: 'Get reading stats',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Stats' },
  },
})

readingRoutes.openapi(statsRoute, async (c) => {
  const userId = c.get('user').userId
  const data = await readingService.getStats(userId)
  return c.json({ data }, 200)
})

// ---------------------------------------------------------------------------
// GET /books/:id
// ---------------------------------------------------------------------------
const getBookRoute = createRoute({
  method: 'get',
  path: '/books/:id',
  tags: ['Reading'],
  summary: 'Get a book',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Book' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

readingRoutes.openapi(getBookRoute, async (c) => {
  const userId = c.get('user').userId
  const book = await readingService.getBook(userId, c.req.param('id'))
  if (!book) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: book }, 200)
})

// ---------------------------------------------------------------------------
// PUT /books/:id
// ---------------------------------------------------------------------------
const updateBookRoute = createRoute({
  method: 'put',
  path: '/books/:id',
  tags: ['Reading'],
  summary: 'Update a book',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updateBookSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

readingRoutes.openapi(updateBookRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const book = await readingService.updateBook(userId, c.req.param('id'), body)
  if (!book) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: book }, 200)
})

// ---------------------------------------------------------------------------
// DELETE /books/:id
// ---------------------------------------------------------------------------
const deleteBookRoute = createRoute({
  method: 'delete',
  path: '/books/:id',
  tags: ['Reading'],
  summary: 'Delete a book',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'Deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

readingRoutes.openapi(deleteBookRoute, async (c) => {
  const userId = c.get('user').userId
  const deleted = await readingService.deleteBook(userId, c.req.param('id'))
  if (!deleted) return c.json({ error: 'Not Found' }, 404)
  return c.json({ message: 'Deleted' }, 200)
})

// ---------------------------------------------------------------------------
// GET /goals
// ---------------------------------------------------------------------------
const listGoalsRoute = createRoute({
  method: 'get',
  path: '/goals',
  tags: ['Reading'],
  summary: 'List reading goals',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } }, description: 'Goals' },
  },
})

readingRoutes.openapi(listGoalsRoute, (async (c: any) => {
  const userId = c.get('user').userId
  const goals = await readingService.listGoals(userId)
  return c.json({ data: goals }, 200)
}) as any)

// ---------------------------------------------------------------------------
// POST /goals
// ---------------------------------------------------------------------------
const createGoalRoute = createRoute({
  method: 'post',
  path: '/goals',
  tags: ['Reading'],
  summary: 'Create a reading goal',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createReadingGoalSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Goal created' },
  },
})

readingRoutes.openapi(createGoalRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const goal = await readingService.createGoal(userId, body)
  return c.json({ data: goal }, 201)
})

// ---------------------------------------------------------------------------
// PUT /goals/:id
// ---------------------------------------------------------------------------
const updateGoalRoute = createRoute({
  method: 'put',
  path: '/goals/:id',
  tags: ['Reading'],
  summary: 'Update a reading goal',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: updateReadingGoalSchema } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.any() }) } }, description: 'Updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

readingRoutes.openapi(updateGoalRoute, async (c) => {
  const userId = c.get('user').userId
  const body = c.req.valid('json')
  const goal = await readingService.updateGoal(userId, c.req.param('id'), body)
  if (!goal) return c.json({ error: 'Not Found' }, 404)
  return c.json({ data: goal }, 200)
})

// ---------------------------------------------------------------------------
// DELETE /goals/:id
// ---------------------------------------------------------------------------
const deleteGoalRoute = createRoute({
  method: 'delete',
  path: '/goals/:id',
  tags: ['Reading'],
  summary: 'Delete a reading goal',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'Deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

readingRoutes.openapi(deleteGoalRoute, async (c) => {
  const userId = c.get('user').userId
  const deleted = await readingService.deleteGoal(userId, c.req.param('id'))
  if (!deleted) return c.json({ error: 'Not Found' }, 404)
  return c.json({ message: 'Deleted' }, 200)
})

// ---------------------------------------------------------------------------
// GET /search
// ---------------------------------------------------------------------------
const searchRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Reading'],
  summary: 'Search Open Library',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Search results' },
  },
})

readingRoutes.openapi(searchRoute, (async (c: any) => {
  const query = c.req.query('q')
  const limit = parsePaginationLimit(c.req.query('limit'), 20)
  const offset = parsePaginationOffset(c.req.query('offset'))

  if (!query) return c.json({ num_found: 0, docs: [] }, 200)

  const data = await readingService.searchOpenLibrary(query, limit, offset)
  if (!data) return c.json({ error: 'Open Library search failed' }, 502)
  return c.json(data, 200)
}) as any)

// ---------------------------------------------------------------------------
// GET /works/:key
// ---------------------------------------------------------------------------
const getWorkRoute = createRoute({
  method: 'get',
  path: '/works/:key',
  tags: ['Reading'],
  summary: 'Get Open Library work',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'Work details' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
  },
})

readingRoutes.openapi(getWorkRoute, (async (c: any) => {
  const key = c.req.param('key')
  if (!key) return c.json({ error: 'Missing work key' }, 400)

  const data = await readingService.getWorkFromOpenLibrary(key)
  if (!data) return c.json({ error: 'Open Library work not found' }, 404)
  return c.json(data, 200)
}) as any)
