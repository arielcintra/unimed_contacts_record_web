import type { Session } from '../../domain/auth/session'

export interface TokenStorage {
  get(): Session | null
  save(session: Session): void
  clear(): void
}
