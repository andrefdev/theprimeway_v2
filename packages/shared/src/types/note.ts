export interface Note {
  id: string
  userId: string
  title: string
  content: string | null
  categoryId: string | null
  isPinned: boolean
  isArchived: boolean
  isDeleted: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  category?: NoteCategory | null
}

export interface NoteCategory {
  id: string
  userId: string
  name: string
  color: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
}
