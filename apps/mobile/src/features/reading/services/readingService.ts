import { apiClient } from '@shared/api/client';
import { READING } from '@shared/api/endpoints';
import type {
  UserBook,
  ReadingGoal,
  ReadingStats,
  OpenLibrarySearchResult,
  AddBookPayload,
  UpdateBookPayload,
  BookStatus,
  BookPriority,
} from '../model/types';

class ReadingService {
  // ── Search ──────────────────────────────────
  async searchBooks(query: string, limit = 20, offset = 0): Promise<{
    numFound: number;
    docs: OpenLibrarySearchResult[];
  }> {
    const response = await apiClient.get(READING.SEARCH, {
      params: { q: query, limit, offset },
    });
    return response.data;
  }

  async getWorkDetail(workKey: string): Promise<any> {
    const response = await apiClient.get(READING.WORKS(workKey));
    return response.data;
  }

  // ── User Books ──────────────────────────────
  async getBooks(params?: {
    status?: BookStatus;
    priority?: BookPriority;
    search?: string;
    favorite?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: UserBook[]; count: number }> {
    const response = await apiClient.get(READING.BOOKS, {
      params: {
        ...params,
        favorite: params?.favorite ? 'true' : undefined,
      },
    });
    return response.data;
  }

  async getBookById(id: string): Promise<UserBook> {
    const response = await apiClient.get(READING.BOOK_BY_ID(id));
    return response.data.data;
  }

  async addBook(payload: AddBookPayload): Promise<UserBook> {
    const response = await apiClient.post(READING.BOOKS, payload);
    return response.data.data;
  }

  async updateBook(id: string, payload: UpdateBookPayload): Promise<UserBook> {
    const response = await apiClient.put(READING.BOOK_BY_ID(id), payload);
    return response.data.data;
  }

  async deleteBook(id: string): Promise<void> {
    await apiClient.delete(READING.BOOK_BY_ID(id));
  }

  // ── Stats ───────────────────────────────────
  async getStats(): Promise<ReadingStats> {
    const response = await apiClient.get(READING.BOOKS_STATS);
    return response.data.data;
  }

  // ── Goals ───────────────────────────────────
  async getGoals(): Promise<ReadingGoal[]> {
    const response = await apiClient.get(READING.GOALS);
    return response.data.data;
  }

  async createGoal(params: {
    periodType: string;
    targetBooks: number;
    startDate: string;
    endDate: string;
  }): Promise<ReadingGoal> {
    const response = await apiClient.post(READING.GOALS, params);
    return response.data.data;
  }

  async updateGoal(id: string, params: {
    targetBooks?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ReadingGoal> {
    const response = await apiClient.put(READING.GOAL_BY_ID(id), params);
    return response.data.data;
  }

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(READING.GOAL_BY_ID(id));
  }
}

export const readingService = new ReadingService();
