import { createBrowserRouter, Navigate } from 'react-router'
import { AdminRoute } from './auth/AdminRoute'
import { LoginPage } from './auth/LoginPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { ContactsPage } from './contacts/ContactsPage'
import { ImportsPage } from './imports/ImportsPage'
import { AppLayout } from './layout/AppLayout'
import { UsersPage } from './users/UsersPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/contatos" replace /> },
          { path: 'contatos', element: <ContactsPage /> },
          { path: 'importacoes', element: <ImportsPage /> },
          { element: <AdminRoute />, children: [{ path: 'usuarios', element: <UsersPage /> }] },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
