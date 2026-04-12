import { api } from '../../lib/api-client'
import type { Note, NoteCategory } from '@repo/shared/types'
import type { CreateNoteInput, UpdateNoteInput } from '@repo/shared/validators'

interface NotesResponse {
  data: Note[]
  count: number
}

export const notesApi = {
  list: (params?: Record<string, string>) =>
    api.get<NotesResponse>('/notes', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<{ data: Note }>(`/notes/${id}`).then((r) => r.data),

  create: (data: CreateNoteInput) =>
    api.post<{ data: Note }>('/notes', data).then((r) => r.data),

  update: (id: string, data: UpdateNoteInput) =>
    api.put<{ data: Note }>(`/notes/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ data: Note }>(`/notes/${id}`).then((r) => r.data),

  restore: (id: string) =>
    api.post<{ data: Note }>(`/notes/${id}/restore`).then((r) => r.data),

  listTrash: () =>
    api.get<NotesResponse>('/notes/trash').then((r) => r.data),

  emptyTrash: () =>
    api.delete<{ deleted: number }>('/notes/trash').then((r) => r.data),

  // Categories
  listCategories: () =>
    api.get<{ data: NoteCategory[] }>('/notes/categories').then((r) => r.data),

  createCategory: (data: { name: string; color?: string; icon?: string }) =>
    api.post<{ data: NoteCategory }>('/notes/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: { name?: string; color?: string; icon?: string }) =>
    api.put<{ data: NoteCategory }>(`/notes/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) =>
    api.delete<{ data: NoteCategory }>(`/notes/categories/${id}`).then((r) => r.data),
}
