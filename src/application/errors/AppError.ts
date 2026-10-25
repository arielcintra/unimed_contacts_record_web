/**
 * Error contract between adapters and the UI: adapters translate transport failures
 * (e.g. HTTP ProblemDetails) into this, so screens never depend on how the API is called.
 */
export class AppError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AppError'
    this.status = status
  }

  /** Errors caused by the request itself (validation, conflict...): retrying won't help. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof AppError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.'
}
