import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../application/auth/AuthProvider'

/** Admin-only screens: a common user who types the URL is sent back to the contacts. */
export function AdminRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/contatos" replace />
}
