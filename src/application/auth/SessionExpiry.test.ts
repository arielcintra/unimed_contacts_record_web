import { describe, expect, it, vi } from 'vitest'
import { SessionExpiry } from './SessionExpiry'

describe('SessionExpiry', () => {
  it('asks for a new login only once, however many requests are waiting', async () => {
    const expiry = new SessionExpiry()
    const listener = vi.fn()
    expiry.subscribe(listener)

    const first = expiry.waitForReauthentication()
    const second = expiry.waitForReauthentication()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(true)
    expect(expiry.isExpired).toBe(true)

    expiry.reauthenticated()

    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined])
    expect(listener).toHaveBeenLastCalledWith(false)
    expect(expiry.isExpired).toBe(false)
  })

  it('rejects the waiting requests when the user gives up', async () => {
    const expiry = new SessionExpiry()
    const waiting = expiry.waitForReauthentication()

    expiry.cancel()

    await expect(waiting).rejects.toThrow('Sessão expirada.')
  })

  it('starts a new wait after the previous one finished', async () => {
    const expiry = new SessionExpiry()
    const first = expiry.waitForReauthentication()
    expiry.reauthenticated()
    await first

    const second = expiry.waitForReauthentication()

    expect(second).not.toBe(first)
    expect(expiry.isExpired).toBe(true)
  })
})
