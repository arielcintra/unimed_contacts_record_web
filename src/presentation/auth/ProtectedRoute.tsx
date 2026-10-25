import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../application/auth/AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
