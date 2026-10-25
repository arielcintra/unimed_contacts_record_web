import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../presentation/AppProviders'
import { fakeServices } from './fakes'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

/** Renders a screen with every real provider, fake services and an in-memory router. */
export function renderWithApp(
  ui: ReactElement,
  { services = fakeServices(), route = '/', queryClient = createTestQueryClient() } = {},
) {
  const user = userEvent.setup()

  const result = render(
    <AppProviders services={services} queryClient={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProviders>,
  )

  return { ...result, services, user, queryClient }
}
