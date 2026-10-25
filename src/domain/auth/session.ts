export interface Credentials {
  email: string
  password: string
}

export interface Session {
  accessToken: string
  expiresAt: Date
}

export function isSessionValid(session: Session | null, now: Date = new Date()): session is Session {
  return session !== null && session.expiresAt > now
}
