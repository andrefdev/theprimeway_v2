export type BookStatus = 'to_read' | 'in_progress' | 'completed' | 'paused' | 'abandoned';
export type BookPriority = 'low' | 'medium' | 'high';
export type GoalPeriodType = 'monthly' | 'quarterly' | 'yearly';

export interface BookMaster {
  id: string;
  workKey: string;
  editionKey?: string;
  title: string;
  subtitle?: string;
  description?: string;
  authors: Array<{ name: string; key: string }>;
  coverUrl?: string;
  pages?: number;
  publishYear?: number;
  language?: string;
  subjects: string[];
  isbnList: string[];
  openLibraryUrl?: string;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  book: BookMaster;
  status: BookStatus;
  priority: BookPriority;
  plannedQuarter?: string | null;
  plannedStartDate?: string | null;
  targetFinishDate?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  currentPage?: number | null;
  totalPagesSnapshot?: number | null;
  progressPercent: number;
  rating?: number | null;
  review?: string | null;
  notes?: string | null;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingGoal {
  id: string;
  userId: string;
  periodType: GoalPeriodType;
  targetBooks: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingStats {
  toRead: number;
  inProgress: number;
  completed: number;
  paused: number;
  abandoned: number;
  completedThisYear: number;
  favorites: number;
}

export interface OpenLibrarySearchResult {
  key: string;
  title: string;
  authorName?: string[];
  authorKey?: string[];
  coverI?: number;
  firstPublishYear?: number;
  numberOfPagesMedian?: number;
  subject?: string[];
  isbn?: string[];
  language?: string[];
}

export interface AddBookPayload {
  workKey: string;
  editionKey?: string;
  status: BookStatus;
  priority?: BookPriority;
  plannedQuarter?: string;
  title: string;
  subtitle?: string;
  description?: string;
  authors: Array<{ name: string; key: string }>;
  coverUrl?: string;
  pages?: number;
  publishYear?: number;
  language?: string;
  subjects?: string[];
  isbnList?: string[];
  openLibraryUrl?: string;
}

export interface UpdateBookPayload {
  status?: BookStatus;
  priority?: BookPriority;
  plannedQuarter?: string | null;
  currentPage?: number | null;
  totalPagesSnapshot?: number | null;
  rating?: number | null;
  review?: string | null;
  notes?: string | null;
  tags?: string[];
  favorite?: boolean;
}
