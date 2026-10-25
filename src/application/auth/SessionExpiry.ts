type Listener = (expired: boolean) => void

/**
 * Coordinates re-authentication when the API answers 401 (Observer pattern).
 * Every request that fails waits on the same promise, so the login dialog opens only once;
 * when the user logs in again all of them are retried, and the current screen is never unmounted.
 */
export class SessionExpiry {
  private pending: { promise: Promise<void>; resolve: () => void; reject: (reason: Error) => void } | null = null
  private readonly listeners = new Set<Listener>()

  /** Called by the HTTP client on 401. Resolves after a new login; rejects if the user gives up. */
  waitForReauthentication(): Promise<void> {
    if (!this.pending) {
      let resolve!: () => void
      let reject!: (reason: Error) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
      })
      this.pending = { promise, resolve, reject }
      this.notify(true)
    }
    return this.pending.promise
  }

  reauthenticated(): void {
    this.pending?.resolve()
    this.finish()
  }

  cancel(): void {
    this.pending?.reject(new Error('Sessão expirada.'))
    this.finish()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  get isExpired(): boolean {
    return this.pending !== null
  }

  private finish(): void {
    this.pending = null
    this.notify(false)
  }

  private notify(expired: boolean): void {
    this.listeners.forEach((listener) => listener(expired))
  }
}
