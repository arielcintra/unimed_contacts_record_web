import type { TokenStorage } from '../../application/ports/TokenStorage'
import type { Session } from '../../domain/auth/session'
import { isUserRole } from '../../domain/users/user'

const STORAGE_KEY = 'contacts-record.session'

/**
 * Keeps the session in sessionStorage: survives a page reload, is discarded when the tab is closed.
 * Trade-offs and the safer alternative (HttpOnly cookie) are described in the README.
 */
export class SessionTokenStorage implements TokenStorage {
  private readonly storage: Storage

  constructor(storage: Storage = sessionStorage) {
    this.storage = storage
  }

  get(): Session | null {
    const raw = this.storage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
      const { accessToken, expiresAt, role } = JSON.parse(raw) as { accessToken: string; expiresAt: string; role: unknown }
      // Sessions saved before roles existed have none: the user simply logs in again.
      if (!isUserRole(role)) throw new Error('Session without a valid role.')
      return { accessToken, expiresAt: new Date(expiresAt), role }
    } catch {
      this.clear()
      return null
    }
  }

  save(session: Session): void {
    this.storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: session.accessToken,
        expiresAt: session.expiresAt.toISOString(),
        role: session.role,
      }),
    )
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEY)
  }
}
