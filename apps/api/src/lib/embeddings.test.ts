import { describe, expect, it } from 'vitest'
import { EMBEDDING_DIMENSIONS, normalizeConcept, toPgVector } from './embeddings'

describe('normalizeConcept', () => {
  it('lowercases and trims', () => {
    expect(normalizeConcept('  Hello World  ')).toBe('hello world')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeConcept('foo    bar\t\nbaz')).toBe('foo bar baz')
  })

  it('strips punctuation but keeps apostrophes and hyphens', () => {
    expect(normalizeConcept("Andre's project — Phase 1!")).toBe("andre's project phase 1")
    expect(normalizeConcept('co-occurrence')).toBe('co-occurrence')
  })

  it('normalizes smart quotes to ascii apostrophe', () => {
    expect(normalizeConcept('it’s')).toBe("it's")
  })

  it('NFKC-normalizes (full-width digits become ascii)', () => {
    expect(normalizeConcept('Q４ goal')).toBe('q4 goal')
  })

  it('keeps unicode letters (Spanish, accents)', () => {
    expect(normalizeConcept('María García')).toBe('maría garcía')
  })

  it('produces same key for visual duplicates', () => {
    expect(normalizeConcept('My Project!')).toBe(normalizeConcept('  my   project '))
  })
})

describe('toPgVector', () => {
  it('formats as bracketed comma-separated literal', () => {
    const v = new Array(EMBEDDING_DIMENSIONS).fill(0)
    v[0] = 0.5
    v[1] = -0.25
    const out = toPgVector(v)
    expect(out.startsWith('[0.5,-0.25,0,')).toBe(true)
    expect(out.endsWith(']')).toBe(true)
  })

  it('throws on dimension mismatch', () => {
    expect(() => toPgVector([0.1, 0.2, 0.3])).toThrow(/Embedding dimension mismatch/)
  })
})
