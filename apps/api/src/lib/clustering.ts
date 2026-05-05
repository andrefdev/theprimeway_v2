/**
 * Agglomerative clustering for the concept graph (Phase 2).
 *
 * Single-linkage agglomerative on cosine similarity. We're working with a
 * per-user concept set whose size will sit in the low thousands at most —
 * O(n²) is fine, and HNSW ANN would add complexity without payoff at this
 * scale. Empirically text-embedding-3-small clusters well at cosine ≥ 0.55
 * for "loosely related" topical groupings (people on the same project, ideas
 * that share vocabulary, etc.).
 *
 * Centroids are arithmetic means of member embeddings, then re-normalized so
 * downstream cosine math stays well-defined.
 */

export interface ClusterableConcept {
  id: string
  embedding: number[]
}

export interface ClusterResult {
  conceptIds: string[]
  centroid: number[]
}

export interface ClusteringOptions {
  /** Minimum cosine similarity to merge two clusters via single-linkage. */
  similarityThreshold?: number
  /** Clusters smaller than this are dropped (concepts go un-clustered). */
  minSize?: number
}

const DEFAULT_THRESHOLD = 0.55
const DEFAULT_MIN_SIZE = 3

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`cosineSimilarity: dim mismatch (${a.length} vs ${b.length})`)
  }
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    const av = a[i]!
    const bv = b[i]!
    dot += av * bv
    na += av * av
    nb += bv * bv
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  if (denom === 0) return 0
  return dot / denom
}

function meanCentroid(members: number[][]): number[] {
  const dim = members[0]!.length
  const out = new Array<number>(dim).fill(0)
  for (const m of members) {
    for (let i = 0; i < dim; i++) out[i]! += m[i]!
  }
  for (let i = 0; i < dim; i++) out[i]! /= members.length
  // L2 normalize so downstream cosine = dot product.
  let norm = 0
  for (let i = 0; i < dim; i++) norm += out[i]! * out[i]!
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < dim; i++) out[i]! /= norm
  }
  return out
}

/**
 * Greedy agglomerative single-linkage. At each step we merge the two clusters
 * with the highest single-linkage similarity (max pairwise cosine across
 * members). Stops when no pair exceeds the threshold.
 *
 * Output: clusters of size ≥ minSize. Concepts in smaller groups are dropped
 * (they remain un-clustered in the DB — clusterId stays null).
 */
export function agglomerativeCluster(
  concepts: ClusterableConcept[],
  opts: ClusteringOptions = {},
): ClusterResult[] {
  const threshold = opts.similarityThreshold ?? DEFAULT_THRESHOLD
  const minSize = opts.minSize ?? DEFAULT_MIN_SIZE

  if (concepts.length === 0) return []

  // Each concept starts as its own singleton cluster.
  let clusters: number[][] = concepts.map((_, i) => [i])
  const embeddings = concepts.map((c) => c.embedding)

  // Pre-compute all pairwise similarities. n²/2 entries — fine up to a few
  // thousand concepts, which is well above any single user's catalog.
  const n = concepts.length
  const sim: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = cosineSimilarity(embeddings[i]!, embeddings[j]!)
      sim[i]![j] = s
      sim[j]![i] = s
    }
  }

  function clusterPairSim(a: number[], b: number[]): number {
    let max = -Infinity
    for (const i of a) {
      for (const j of b) {
        const s = sim[i]![j]!
        if (s > max) max = s
      }
    }
    return max
  }

  // Iterate: find the best pair, merge, repeat.
  // Bounded by n-1 merges, each scan is O(k²) where k = current cluster count.
  while (clusters.length > 1) {
    let bestSim = -Infinity
    let bestA = -1
    let bestB = -1
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const s = clusterPairSim(clusters[i]!, clusters[j]!)
        if (s > bestSim) {
          bestSim = s
          bestA = i
          bestB = j
        }
      }
    }
    if (bestSim < threshold || bestA === -1) break

    const merged = [...clusters[bestA]!, ...clusters[bestB]!]
    const next: number[][] = []
    for (let i = 0; i < clusters.length; i++) {
      if (i !== bestA && i !== bestB) next.push(clusters[i]!)
    }
    next.push(merged)
    clusters = next
  }

  // Drop small clusters; map indices back to ids; compute centroids.
  return clusters
    .filter((c) => c.length >= minSize)
    .map((indices) => ({
      conceptIds: indices.map((idx) => concepts[idx]!.id),
      centroid: meanCentroid(indices.map((idx) => embeddings[idx]!)),
    }))
}
