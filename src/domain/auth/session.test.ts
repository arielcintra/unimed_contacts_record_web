import { describe, expect, it } from 'vitest'
import { isSessionValid } from './session'

describe('isSessionValid', () => {
  const now = new Date('2026-10-25T12:00:00Z')

  it('accepts a session that has not expired', () => {
    expect(isSessionValid({ accessToken: 't', expiresAt: new Date('2026-10-25T13:00:00Z'), role: 'Common' }, now)).toBe(true)
  })

  it('rejects an expired or missing session', () => {
    expect(isSessionValid({ accessToken: 't', expiresAt: new Date('2026-10-25T11:59:59Z'), role: 'Common' }, now)).toBe(false)
    expect(isSessionValid(null, now)).toBe(false)
  })
})
