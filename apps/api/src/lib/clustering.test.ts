import { describe, expect, it } from 'vitest'
import { agglomerativeCluster, cosineSimilarity } from './clustering'

// Tiny helpers — all our test embeddings are 4-dim for readability. The
// algorithm is dim-agnostic so this is sufficient.
const vec = (...xs: number[]) => xs

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity(vec(1, 0, 0, 0), vec(1, 0, 0, 0))).toBeCloseTo(1, 6)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity(vec(1, 0, 0, 0), vec(0, 1, 0, 0))).toBeCloseTo(0, 6)
  })

  it('handles zero vectors without dividing by zero', () => {
    expect(cosineSimilarity(vec(0, 0, 0, 0), vec(1, 0, 0, 0))).toBe(0)
  })

  it('throws on dimension mismatch', () => {
    expect(() => cosineSimilarity(vec(1, 0), vec(1, 0, 0))).toThrow(/dim mismatch/)
  })
})

describe('agglomerativeCluster', () => {
  it('returns empty for empty input', () => {
    expect(agglomerativeCluster([])).toEqual([])
  })

  it('drops a single concept (below min size)', () => {
    expect(agglomerativeCluster([{ id: 'a', embedding: vec(1, 0, 0, 0) }])).toEqual([])
  })

  it('groups three near-identical concepts into one cluster', () => {
    const clusters = agglomerativeCluster([
      { id: 'a', embedding: vec(1, 0, 0, 0) },
      { id: 'b', embedding: vec(0.99, 0.05, 0, 0) },
      { id: 'c', embedding: vec(0.95, 0.1, 0, 0) },
    ])
    expect(clusters).toHaveLength(1)
    expect(new Set(clusters[0]!.conceptIds)).toEqual(new Set(['a', 'b', 'c']))
  })

  it('separates two distinct topical groups (above threshold within, below across)', () => {
    const clusters = agglomerativeCluster([
      // Group "tech" — all close to (1,0,0,0)
      { id: 't1', embedding: vec(1, 0, 0, 0) },
      { id: 't2', embedding: vec(0.95, 0.1, 0, 0) },
      { id: 't3', embedding: vec(0.9, 0.15, 0, 0) },
      // Group "people" — all close to (0,0,1,0)
      { id: 'p1', embedding: vec(0, 0, 1, 0) },
      { id: 'p2', embedding: vec(0, 0.1, 0.95, 0) },
      { id: 'p3', embedding: vec(0, 0.05, 0.97, 0) },
    ])
    expect(clusters).toHaveLength(2)
    const allIds = clusters.flatMap((c) => c.conceptIds).sort()
    expect(allIds).toEqual(['p1', 'p2', 'p3', 't1', 't2', 't3'])
    // The two clusters should partition the inputs cleanly.
    const sets = clusters.map((c) => new Set(c.conceptIds))
    const techSet = sets.find((s) => s.has('t1'))!
    expect(techSet).toEqual(new Set(['t1', 't2', 't3']))
  })

  it('drops clusters below minSize and keeps the rest', () => {
    const clusters = agglomerativeCluster(
      [
        { id: 'a', embedding: vec(1, 0, 0, 0) },
        { id: 'b', embedding: vec(0.99, 0.05, 0, 0) },
        { id: 'c', embedding: vec(0.98, 0.05, 0, 0) },
        { id: 'd', embedding: vec(0.97, 0.05, 0, 0) },
        // Pair with no third member at this threshold
        { id: 'x', embedding: vec(0, 0, 1, 0) },
        { id: 'y', embedding: vec(0, 0.05, 0.99, 0) },
      ],
      { minSize: 3 },
    )
    // Only the {a,b,c,d} cluster survives; {x,y} is dropped.
    expect(clusters).toHaveLength(1)
    expect(new Set(clusters[0]!.conceptIds)).toEqual(new Set(['a', 'b', 'c', 'd']))
  })

  it('returns L2-normalized centroids', () => {
    const [cluster] = agglomerativeCluster([
      { id: 'a', embedding: vec(1, 0, 0, 0) },
      { id: 'b', embedding: vec(0.99, 0.05, 0, 0) },
      { id: 'c', embedding: vec(0.95, 0.1, 0, 0) },
    ])
    const norm = Math.sqrt(cluster!.centroid.reduce((acc, x) => acc + x * x, 0))
    expect(norm).toBeCloseTo(1, 6)
  })

  it('respects custom similarity threshold (lower → bigger clusters)', () => {
    const inputs = [
      { id: 'a', embedding: vec(1, 0, 0, 0) },
      { id: 'b', embedding: vec(0.95, 0.1, 0, 0) },
      { id: 'c', embedding: vec(0.6, 0.5, 0.4, 0) },
    ]
    expect(agglomerativeCluster(inputs, { similarityThreshold: 0.9, minSize: 2 })).toHaveLength(
      1,
    )
    expect(agglomerativeCluster(inputs, { similarityThreshold: 0.4, minSize: 2 })).toHaveLength(
      1,
    )
    // At a threshold higher than any pairwise similarity in the set, no merges.
    expect(
      agglomerativeCluster(inputs, { similarityThreshold: 0.999, minSize: 2 }),
    ).toHaveLength(0)
  })
})
