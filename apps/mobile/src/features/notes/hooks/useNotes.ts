import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { notesService } from '../services/notesService';
import type { Note, NoteCategory } from '@shared/types/models';

export function useNotes(params?: { search?: string; categoryId?: string; isArchived?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.notes.all, params],
    queryFn: () => notesService.getNotes(params),
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.byId(id),
    queryFn: () => notesService.getNoteById(id),
    enabled: !!id,
  });
}

export function useNoteCategories() {
  return useQuery({
    queryKey: queryKeys.notes.categories,
    queryFn: () => notesService.getCategories(),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Note>) => notesService.createNote(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> }) =>
      notesService.updateNote(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NoteCategory>) => notesService.createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.categories }),
  });
}
