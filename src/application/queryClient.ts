import { QueryClient } from '@tanstack/react-query'
import { AppError } from './errors/AppError'

const MAX_RETRIES = 2

/** Retries only failures that may be temporary: a 4xx (validation, conflict, not found) won't change. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof AppError && error.isClientError) && failureCount < MAX_RETRIES,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
