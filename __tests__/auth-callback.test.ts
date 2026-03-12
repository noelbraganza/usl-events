import { describe, it, expect } from 'vitest'

// Pure function extracted from callback route logic
function resolveRsvpStatus(
  confirmedCount: number,
  capacity: number | null
): 'confirmed' | 'waitlist' {
  const isFull = capacity ? confirmedCount >= capacity : false
  return isFull ? 'waitlist' : 'confirmed'
}

describe('resolveRsvpStatus', () => {
  it('returns confirmed when capacity is null (unlimited)', () => {
    expect(resolveRsvpStatus(100, null)).toBe('confirmed')
  })

  it('returns confirmed when under capacity', () => {
    expect(resolveRsvpStatus(49, 50)).toBe('confirmed')
  })

  it('returns waitlist when at capacity', () => {
    expect(resolveRsvpStatus(50, 50)).toBe('waitlist')
  })

  it('returns waitlist when over capacity', () => {
    expect(resolveRsvpStatus(51, 50)).toBe('waitlist')
  })

  it('returns confirmed when count is 0', () => {
    expect(resolveRsvpStatus(0, 50)).toBe('confirmed')
  })
})
