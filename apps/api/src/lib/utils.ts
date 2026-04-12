/**
 * API Utilities
 *
 * Note: No case conversion functions needed.
 * The entire API uses camelCase consistently:
 * Prisma (camelCase) → Repository → Service → Route → Client
 */

/** Parse and clamp pagination limit (max 200) */
export function parsePaginationLimit(value: string | undefined, defaultLimit = 50): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 1) return defaultLimit
  return Math.min(parsed, 200)
}

/** Parse pagination offset */
export function parsePaginationOffset(value: string | undefined): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}
