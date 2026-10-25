import { describe, expect, it } from 'vitest'
import { SessionTokenStorage } from './SessionTokenStorage'

describe('SessionTokenStorage', () => {
  it('keeps the session in sessionStorage', () => {
    const storage = new SessionTokenStorage()
    const session = { accessToken: 'token', expiresAt: new Date('2026-10-25T13:00:00Z') }

    storage.save(session)

    expect(new SessionTokenStorage().get()).toEqual(session)
  })

  it('clears the session', () => {
    const storage = new SessionTokenStorage()
    storage.save({ accessToken: 'token', expiresAt: new Date() })

    storage.clear()

    expect(storage.get()).toBeNull()
  })

  it('discards unreadable content', () => {
    sessionStorage.setItem('contacts-record.session', 'not json')

    expect(new SessionTokenStorage().get()).toBeNull()
    expect(sessionStorage.getItem('contacts-record.session')).toBeNull()
  })
})
