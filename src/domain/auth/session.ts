import type { UserRole } from '../users/user'

export interface Credentials {
  email: string
  password: string
}

export interface Session {
  accessToken: string
  expiresAt: Date
  /** Only decides what the screens show; the API enforces the permissions on its own. */
  role: UserRole
}

export function isSessionValid(session: Session | null, now: Date = new Date()): session is Session {
  return session !== null && session.expiresAt > now
}
