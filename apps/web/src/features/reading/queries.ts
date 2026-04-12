import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { readingApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const readingQueries = {
  all: () => ['reading'] as const,

  books: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...readingQueries.all(), 'books', params],
      queryFn: () => readingApi.listBooks(params),
      staleTime: CACHE_TIMES.standard,
    }),

  book: (id: string) =>
    queryOptions({
      queryKey: [...readingQueries.all(), 'book', id],
      queryFn: () => readingApi.getBook(id),
      staleTime: CACHE_TIMES.standard,
    }),

  stats: () =>
    queryOptions({
      queryKey: [...readingQueries.all(), 'stats'],
      queryFn: () => readingApi.stats(),
      staleTime: CACHE_TIMES.standard,
    }),

  goals: () =>
    queryOptions({
      queryKey: [...readingQueries.all(), 'goals'],
      queryFn: () => readingApi.listGoals(),
      staleTime: CACHE_TIMES.standard,
    }),
}

export function useAddBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => readingApi.addBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingQueries.all() })
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      readingApi.updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingQueries.all() })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => readingApi.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingQueries.all() })
    },
  })
}
