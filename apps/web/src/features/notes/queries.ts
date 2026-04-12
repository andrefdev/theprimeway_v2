import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import type { CreateNoteInput, UpdateNoteInput } from '@repo/shared/validators'

export const notesQueries = {
  all: () => ['notes'] as const,

  list: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...notesQueries.all(), 'list', params],
      queryFn: () => notesApi.list(params),
      staleTime: CACHE_TIMES.standard,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...notesQueries.all(), 'detail', id],
      queryFn: () => notesApi.get(id),
      staleTime: CACHE_TIMES.standard,
    }),

  trash: () =>
    queryOptions({
      queryKey: [...notesQueries.all(), 'trash'],
      queryFn: () => notesApi.listTrash(),
      staleTime: CACHE_TIMES.standard,
    }),

  categories: () =>
    queryOptions({
      queryKey: [...notesQueries.all(), 'categories'],
      queryFn: () => notesApi.listCategories(),
      staleTime: CACHE_TIMES.long,
    }),
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNoteInput) => notesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteInput }) =>
      notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
    },
  })
}

export function useRestoreNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueries.all() })
    },
  })
}
