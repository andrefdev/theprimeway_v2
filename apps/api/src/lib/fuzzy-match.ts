/**
 * Naive fuzzy matcher used by the Second Brain cross-link resolver.
 * Two-stage: case-insensitive substring match first (fast path), then
 * Levenshtein-based similarity. Confidence threshold prevents noisy links.
 *
 * No new dependency — ~30 lines vs pulling in string-similarity/fuse.
 */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

/**
 * Find the best matching candidate by title. Returns null if no candidate
 * passes the threshold — better to drop a cross-link than invent one.
 */
export function bestMatch<T extends { id: string; title: string }>(
  needle: string,
  candidates: T[],
  threshold = 0.7,
): T | null {
  const n = needle.trim().toLowerCase()
  if (!n || candidates.length === 0) return null

  // Fast path: substring either direction.
  for (const c of candidates) {
    const t = c.title.trim().toLowerCase()
    if (t === n || t.includes(n) || n.includes(t)) return c
  }

  let best: T | null = null
  let bestScore = threshold
  for (const c of candidates) {
    const score = similarity(n, c.title.trim().toLowerCase())
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  return best
}
