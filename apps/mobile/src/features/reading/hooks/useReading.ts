import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { readingService } from '../services/readingService';
import type {
  BookStatus,
  BookPriority,
  AddBookPayload,
  UpdateBookPayload,
} from '../model/types';

const KEYS = {
  books: (params?: Record<string, unknown>) => ['reading', 'books', params] as const,
  bookDetail: (id: string) => ['reading', 'books', id] as const,
  stats: ['reading', 'stats'] as const,
  goals: ['reading', 'goals'] as const,
  search: (q: string) => ['reading', 'search', q] as const,
};

// ── Books ─────────────────────────────────────
export function useUserBooks(params?: {
  status?: BookStatus;
  priority?: BookPriority;
  search?: string;
  favorite?: boolean;
}) {
  return useQuery({
    queryKey: KEYS.books(params as Record<string, unknown>),
    queryFn: () => readingService.getBooks(params),
  });
}

export function useUserBookDetail(id: string) {
  return useQuery({
    queryKey: KEYS.bookDetail(id),
    queryFn: () => readingService.getBookById(id),
    enabled: !!id,
  });
}

// ── Book Mutations ────────────────────────────
export function useAddBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddBookPayload) => readingService.addBook(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading'] });
    },
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBookPayload }) =>
      readingService.updateBook(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading'] });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readingService.deleteBook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading'] });
    },
  });
}

// ── Stats ─────────────────────────────────────
export function useReadingStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: () => readingService.getStats(),
  });
}

// ── Search ────────────────────────────────────
export function useBookSearch(query: string) {
  return useQuery({
    queryKey: KEYS.search(query),
    queryFn: () => readingService.searchBooks(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// ── Goals ─────────────────────────────────────
export function useReadingGoals() {
  return useQuery({
    queryKey: KEYS.goals,
    queryFn: () => readingService.getGoals(),
  });
}

export function useCreateReadingGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      periodType: string;
      targetBooks: number;
      startDate: string;
      endDate: string;
    }) => readingService.createGoal(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.goals });
    },
  });
}

export function useDeleteReadingGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readingService.deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.goals });
    },
  });
}

// ── Debounced Search ──────────────────────────
export function useDebouncedSearch(delay = 400) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useMemo(() => ({ current: null as ReturnType<typeof setTimeout> | null }), []);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(text), delay);
  };

  const searchResult = useBookSearch(debouncedQuery);

  return { query, setQuery: handleSearch, ...searchResult };
}
