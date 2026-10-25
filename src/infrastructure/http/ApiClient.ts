import { AppError } from '../../application/errors/AppError'
import type { TokenStorage } from '../../application/ports/TokenStorage'

type QueryValue = string | number | boolean | null | undefined

export interface ApiClientOptions {
  /** Relative "/api": nginx (Docker) or the Vite proxy (dev) forwards it to the API. */
  baseUrl: string
  tokenStorage: TokenStorage
  /** Called on 401; resolves after the user logs in again, so the request can be retried. */
  onUnauthorized: () => Promise<void>
  fetch?: typeof fetch
}

interface RequestOptions {
  query?: Record<string, QueryValue>
  body?: unknown
  /** false for the login itself: no token is sent and a 401 is a plain error. */
  authenticated?: boolean
}

/** RFC 9457 body returned by the API on errors. */
interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

/**
 * HTTP client shared by every adapter (Interceptor): adds the access token, turns ProblemDetails
 * into AppError and, on 401, waits for a new login and retries the same request once.
 */
export class ApiClient {
  private readonly baseUrl: string
  private readonly tokenStorage: TokenStorage
  private readonly onUnauthorized: () => Promise<void>
  private readonly fetchFn: typeof fetch

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl
    this.tokenStorage = options.tokenStorage
    this.onUnauthorized = options.onUnauthorized
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis)
  }

  get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    return this.request<T>('GET', path, { query })
  }

  post<T>(path: string, body?: unknown, options: { authenticated?: boolean } = {}): Promise<T> {
    return this.request<T>('POST', path, { body, ...options })
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body })
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body })
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path, {})
  }

  private async request<T>(method: string, path: string, options: RequestOptions, isRetry = false): Promise<T> {
    const authenticated = options.authenticated ?? true
    const response = await this.fetchFn(this.url(path, options.query), {
      method,
      headers: this.headers(options.body, authenticated),
      body: serialize(options.body),
    })

    // Session expired: the screen stays mounted while the user logs in again, then the same request is sent.
    if (response.status === 401 && authenticated && !isRetry) {
      await this.onUnauthorized()
      return this.request<T>(method, path, options, true)
    }

    if (!response.ok) throw await toAppError(response)
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  private url(path: string, query: Record<string, QueryValue> = {}): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
    }
    const search = params.toString()
    return `${this.baseUrl}${path}${search ? `?${search}` : ''}`
  }

  private headers(body: unknown, authenticated: boolean): Headers {
    const headers = new Headers({ Accept: 'application/json' })
    // FormData sets its own multipart Content-Type (with the boundary).
    if (body !== undefined && !(body instanceof FormData)) headers.set('Content-Type', 'application/json')

    const session = authenticated ? this.tokenStorage.get() : null
    if (session) headers.set('Authorization', `Bearer ${session.accessToken}`)
    return headers
  }
}

function serialize(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  return body instanceof FormData ? body : JSON.stringify(body)
}

async function toAppError(response: Response): Promise<AppError> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null
  const validationMessage = problem?.errors ? Object.values(problem.errors).flat()[0] : undefined
  const message = problem?.detail ?? validationMessage ?? problem?.title ?? `Erro ${response.status}.`
  return new AppError(message, response.status)
}
