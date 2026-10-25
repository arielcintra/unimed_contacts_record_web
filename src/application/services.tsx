import { createContext, useContext, type ReactNode } from 'react'
import type { SessionExpiry } from './auth/SessionExpiry'
import type { AuthGateway } from './ports/AuthGateway'
import type { ContactRepository } from './ports/ContactRepository'
import type { ImportRepository } from './ports/ImportRepository'
import type { TokenStorage } from './ports/TokenStorage'

/** Everything the use cases depend on. Wired with real adapters in main.tsx and with fakes in tests. */
export interface Services {
  contacts: ContactRepository
  imports: ImportRepository
  auth: AuthGateway
  tokenStorage: TokenStorage
  sessionExpiry: SessionExpiry
}

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with its provider
export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices must be used inside ServicesProvider.')
  return services
}
