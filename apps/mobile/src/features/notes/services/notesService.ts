import { apiClient } from '@shared/api/client';
import { NOTES } from '@shared/api/endpoints';
import type { Note, NoteCategory } from '@shared/types/models';

// API responses are wrapped: { data: [...], count: N }
interface ApiListResponse<T> {
  data: T[];
  count: number;
}

export const notesService = {
  getNotes: async (params?: { search?: string; categoryId?: string; isArchived?: boolean }): Promise<Note[]> => {
    const { data: response } = await apiClient.get<ApiListResponse<Note>>(NOTES.BASE, { params });
    return response.data ?? response as unknown as Note[];
  },

  getNoteById: async (id: string): Promise<Note> => {
    const { data: response } = await apiClient.get<{ data: Note }>(NOTES.BY_ID(id));
    return response.data ?? response as unknown as Note;
  },

  createNote: async (note: Partial<Note>): Promise<Note> => {
    const { data: response } = await apiClient.post<{ data: Note }>(NOTES.BASE, note);
    return response.data ?? response as unknown as Note;
  },

  updateNote: async (id: string, note: Partial<Note>): Promise<Note> => {
    const { data: response } = await apiClient.put<{ data: Note }>(NOTES.BY_ID(id), note);
    return response.data ?? response as unknown as Note;
  },

  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(NOTES.BY_ID(id));
  },

  getCategories: async (): Promise<NoteCategory[]> => {
    const { data: response } = await apiClient.get<ApiListResponse<NoteCategory>>(NOTES.CATEGORIES);
    return response.data ?? response as unknown as NoteCategory[];
  },

  createCategory: async (category: Partial<NoteCategory>): Promise<NoteCategory> => {
    const { data: response } = await apiClient.post<{ data: NoteCategory }>(NOTES.CATEGORIES, category);
    return response.data ?? response as unknown as NoteCategory;
  },

  updateCategory: async (id: string, category: Partial<NoteCategory>): Promise<NoteCategory> => {
    const { data: response } = await apiClient.put<{ data: NoteCategory }>(NOTES.CATEGORY_BY_ID(id), category);
    return response.data ?? response as unknown as NoteCategory;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(NOTES.CATEGORY_BY_ID(id));
  },
};
