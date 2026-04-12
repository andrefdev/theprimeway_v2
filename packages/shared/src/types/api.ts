/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

/** Paginated API response */
export interface PaginatedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/** API error response */
export interface ApiError {
  error: string
  message?: string
  statusCode: number
}
