/**
 * Notes Routes — HTTP layer (thin controller)
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
import { notesService } from '../services/notes.service'
import { LimitExceededError } from '../lib/limits'
import { parsePaginationLimit, parsePaginationOffset } from '../lib/utils'

export const notesRoutes = new OpenAPIHono<AppEnv>()
notesRoutes.use('*', authMiddleware)

// ─── Shared schemas ──────────────────────────────────────────────────────────

const errorResponse = z.object({ error: z.string() })

const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  categoryId: z.string().nullable(),
  isPinned: z.boolean(),
  isArchived: z.boolean(),
  isDeleted: z.boolean(),
  tags: z.any(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough()

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough()

// ─── GET /notes ──────────────────────────────────────────────────────────────

const listNotesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Notes'],
  summary: 'List notes',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      categoryId: z.string().optional(),
      isPinned: z.enum(['true', 'false']).optional(),
      isArchived: z.enum(['true', 'false']).optional(),
      search: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.array(noteSchema), count: z.number() }) } },
      description: 'Notes list',
    },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(listNotesRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await notesService.listNotes(userId, {
      categoryId: q.categoryId,
      isPinned: q.isPinned !== undefined ? q.isPinned === 'true' : undefined,
      isArchived: q.isArchived !== undefined ? q.isArchived === 'true' : undefined,
      search: q.search,
      limit: q.limit ? parsePaginationLimit(q.limit) : undefined,
      offset: q.offset ? parsePaginationOffset(q.offset) : undefined,
    })

    return c.json(result, 200)
  } catch (error) {
    console.error('[NOTES_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── POST /notes ─────────────────────────────────────────────────────────────

const createNoteBody = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  categoryId: z.string().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

const createNoteRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Notes'],
  summary: 'Create a note',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createNoteBody } } } },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: noteSchema }) } }, description: 'Note created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Invalid input' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(createNoteRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const note = await notesService.createNote(userId, body)
    return c.json({ data: note }, 201)
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return c.json({ error: error.message, limitType: error.limitType }, 409)
    }
    console.error('[NOTES_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── GET /notes/:id ──────────────────────────────────────────────────────────

const getNoteRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Notes'],
  summary: 'Get a note by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: noteSchema }) } }, description: 'Note found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(getNoteRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const note = await notesService.getNote(userId, id)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    console.error('[NOTE_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── PUT /notes/:id ──────────────────────────────────────────────────────────

const updateNoteBody = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

const updateNoteRoute = createRoute({
  method: 'put',
  path: '/:id',
  tags: ['Notes'],
  summary: 'Update a note',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateNoteBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: noteSchema }) } }, description: 'Note updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(updateNoteRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const note = await notesService.updateNote(userId, id, body)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    console.error('[NOTE_PUT]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── DELETE /notes/:id ───────────────────────────────────────────────────────

const deleteNoteRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Notes'],
  summary: 'Soft-delete a note (move to trash)',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: noteSchema }) } }, description: 'Note trashed' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(deleteNoteRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const note = await notesService.deleteNote(userId, id)
    if (!note) return c.json({ error: 'Note not found' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    console.error('[NOTE_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── GET /notes/trash ────────────────────────────────────────────────────────

const trashRoute = createRoute({
  method: 'get',
  path: '/trash',
  tags: ['Notes'],
  summary: 'List trashed notes',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.array(noteSchema), count: z.number() }) } },
      description: 'Trashed notes',
    },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(trashRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const result = await notesService.listTrash(userId)
    return c.json(result, 200)
  } catch (error) {
    console.error('[NOTES_TRASH_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── DELETE /notes/trash ─────────────────────────────────────────────────────

const emptyTrashRoute = createRoute({
  method: 'delete',
  path: '/trash',
  tags: ['Notes'],
  summary: 'Empty trash (permanently delete all trashed notes)',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ deleted: z.number() }) } }, description: 'Trash emptied' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(emptyTrashRoute, async (c) => {
  const { userId } = c.get('user')

  try {
    const deleted = await notesService.emptyTrash(userId)
    return c.json({ deleted }, 200)
  } catch (error) {
    console.error('[NOTES_TRASH_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ─── POST /notes/:id/restore ─────────────────────────────────────────────────

const restoreNoteRoute = createRoute({
  method: 'post',
  path: '/:id/restore',
  tags: ['Notes'],
  summary: 'Restore a note from trash',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: noteSchema }) } }, description: 'Note restored' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found in trash' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(restoreNoteRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const note = await notesService.restoreNote(userId, id)
    if (!note) return c.json({ error: 'Note not found in trash' }, 404)
    return c.json({ data: note }, 200)
  } catch (error) {
    console.error('[NOTE_RESTORE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── GET /notes/categories ───────────────────────────────────────────────────

const listCategoriesRoute = createRoute({
  method: 'get',
  path: '/categories',
  tags: ['Notes'],
  summary: 'List note categories',
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(categorySchema) }) } }, description: 'Categories list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(listCategoriesRoute, (async (c: any) => {
  const { userId } = c.get('user')

  try {
    const categories = await notesService.listCategories(userId)
    return c.json({ data: categories }, 200)
  } catch (error) {
    console.error('[NOTE_CATEGORIES_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── POST /notes/categories ──────────────────────────────────────────────────

const createCategoryBody = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
})

const createCategoryRoute = createRoute({
  method: 'post',
  path: '/categories',
  tags: ['Notes'],
  summary: 'Create a note category',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createCategoryBody } } } },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ data: categorySchema }) } }, description: 'Category created' },
    409: { content: { 'application/json': { schema: errorResponse } }, description: 'Duplicate name' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(createCategoryRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const result = await notesService.createCategory(userId, body)
    if (result.duplicate) return c.json({ error: 'A category with this name already exists' }, 409)
    return c.json({ data: result.category }, 201)
  } catch (error) {
    console.error('[NOTE_CATEGORIES_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── GET /notes/categories/:id ───────────────────────────────────────────────

const getCategoryRoute = createRoute({
  method: 'get',
  path: '/categories/:id',
  tags: ['Notes'],
  summary: 'Get a note category by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: categorySchema }) } }, description: 'Category found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(getCategoryRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const category = await notesService.getCategory(userId, id)
    if (!category) return c.json({ error: 'Category not found' }, 404)
    return c.json({ data: category }, 200)
  } catch (error) {
    console.error('[NOTE_CATEGORY_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── PUT /notes/categories/:id ───────────────────────────────────────────────

const updateCategoryBody = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

const updateCategoryRoute = createRoute({
  method: 'put',
  path: '/categories/:id',
  tags: ['Notes'],
  summary: 'Update a note category',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateCategoryBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: categorySchema }) } }, description: 'Category updated' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    409: { content: { 'application/json': { schema: errorResponse } }, description: 'Duplicate name' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(updateCategoryRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  try {
    const result = await notesService.updateCategory(userId, id, body)
    if (result.notFound) return c.json({ error: 'Category not found' }, 404)
    if (result.duplicate) return c.json({ error: 'A category with this name already exists' }, 409)
    return c.json({ data: result.category }, 200)
  } catch (error) {
    console.error('[NOTE_CATEGORY_PUT]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// ─── DELETE /notes/categories/:id ────────────────────────────────────────────

const deleteCategoryRoute = createRoute({
  method: 'delete',
  path: '/categories/:id',
  tags: ['Notes'],
  summary: 'Delete a note category',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: categorySchema }) } }, description: 'Category deleted' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

notesRoutes.openapi(deleteCategoryRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const category = await notesService.deleteCategory(userId, id)
    if (!category) return c.json({ error: 'Category not found' }, 404)
    return c.json({ data: category }, 200)
  } catch (error) {
    console.error('[NOTE_CATEGORY_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)
