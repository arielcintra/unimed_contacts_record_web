import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { isSessionValid, type Credentials, type Session } from '../../domain/auth/session'
import { useServices } from '../services'

interface AuthContextValue {
  isAuthenticated: boolean
  login(credentials: Credentials): Promise<void>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, tokenStorage, sessionExpiry } = useServices()
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(() => {
    const stored = tokenStorage.get()
    return isSessionValid(stored) ? stored : null
  })

  const login = useCallback(
    async (credentials: Credentials) => {
      const newSession = await auth.login(credentials)
      tokenStorage.save(newSession)
      setSession(newSession)
    },
    [auth, tokenStorage],
  )

  const logout = useCallback(() => {
    sessionExpiry.cancel()
    tokenStorage.clear()
    setSession(null)
    queryClient.clear()
  }, [queryClient, sessionExpiry, tokenStorage])

  const value = useMemo(() => ({ isAuthenticated: session !== null, login, logout }), [session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with its provider
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}

/** True while a request is waiting for the user to log in again. */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with its provider
export function useSessionExpired(): boolean {
  const { sessionExpiry } = useServices()
  return useSyncExternalStore(
    (onChange) => sessionExpiry.subscribe(onChange),
    () => sessionExpiry.isExpired,
  )
}
