import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthProvider } from '../application/auth/AuthProvider'
import { ServicesProvider, type Services } from '../application/services'
import { SessionExpiredDialog } from './auth/SessionExpiredDialog'
import { NotificationProvider } from './shared/NotificationProvider'
import { theme } from './theme'

interface AppProvidersProps {
  services: Services
  queryClient: QueryClient
  children: ReactNode
}

/** Every provider the screens need. Used by the app and by the component tests (with fake services). */
export function AppProviders({ services, queryClient, children }: AppProvidersProps) {
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotificationProvider>
            <AuthProvider>
              {children}
              {/* Outside the routes: opens over whatever screen is mounted, without replacing it. */}
              <SessionExpiredDialog />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ServicesProvider>
  )
}
