export interface Book {
  id: string
  userId: string
  workKey: string
  editionKey: string | null
  title: string
  subtitle: string | null
  description: string | null
  authors: string[]
  coverUrl: string | null
  pages: number | null
  publishYear: number | null
  language: string | null
  subjects: string[]
  status: string
  priority: string
  plannedQuarter: string | null
  currentPage: number
  progressPercent: number
  rating: number | null
  review: string | null
  notes: string | null
  tags: string[]
  favorite: boolean
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

export interface ReadingGoal {
  id: string
  userId: string
  periodType: string
  targetBooks: number
  completedBooks: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export interface ReadingStats {
  totalBooks: number
  booksRead: number
  booksReading: number
  booksToRead: number
  totalPagesRead: number
  averageRating: number | null
}
