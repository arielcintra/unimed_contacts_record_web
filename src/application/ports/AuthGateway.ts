import type { Credentials, Session } from '../../domain/auth/session'

export interface AuthGateway {
  login(credentials: Credentials): Promise<Session>
}
