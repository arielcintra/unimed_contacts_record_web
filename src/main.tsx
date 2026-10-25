import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { SessionExpiry } from './application/auth/SessionExpiry'
import { createQueryClient } from './application/queryClient'
import type { Services } from './application/services'
import { HttpAuthGateway } from './infrastructure/auth/HttpAuthGateway'
import { SessionTokenStorage } from './infrastructure/auth/SessionTokenStorage'
import { HttpContactRepository } from './infrastructure/contacts/HttpContactRepository'
import { ApiClient } from './infrastructure/http/ApiClient'
import { HttpImportRepository } from './infrastructure/imports/HttpImportRepository'
import { HttpUserRepository } from './infrastructure/users/HttpUserRepository'
import { AppProviders } from './presentation/AppProviders'
import { router } from './presentation/router'

// Composition root: the only place that knows the concrete adapters behind each port.
const tokenStorage = new SessionTokenStorage()
const sessionExpiry = new SessionExpiry()
const api = new ApiClient({
  baseUrl: '/api',
  tokenStorage,
  onUnauthorized: () => sessionExpiry.waitForReauthentication(),
})

const services: Services = {
  contacts: new HttpContactRepository(api),
  imports: new HttpImportRepository(api),
  users: new HttpUserRepository(api),
  auth: new HttpAuthGateway(api),
  tokenStorage,
  sessionExpiry,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders services={services} queryClient={createQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
