import { describe, expect, it } from 'vitest'
import { formatPhone } from './phone'

describe('formatPhone', () => {
  it('formats mobile numbers', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('formats landline numbers', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890')
  })

  it('shows unexpected values as they are', () => {
    expect(formatPhone('123')).toBe('123')
  })
})
