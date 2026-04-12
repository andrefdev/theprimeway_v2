/**
 * Compare two semver strings. Returns negative if a < b, 0 if equal, positive if a > b.
 * Handles "1.2.3" format only — sufficient for app version strings.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}
