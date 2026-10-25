import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { UserRole } from '../domain/users/user'
import { fakeServices, memoryTokenStorage, validSession } from '../test/fakes'
import { renderWithApp } from '../test/renderWithApp'
import { AdminRoute } from './auth/AdminRoute'
import { AppLayout } from './layout/AppLayout'

/** Same route tree as the router, with placeholders instead of the real screens. */
function renderAppAs(role: UserRole, route: string) {
  const services = fakeServices({ tokenStorage: memoryTokenStorage(validSession('token', role)) })
  return renderWithApp(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/contatos" element={<p>Tela de contatos</p>} />
        <Route element={<AdminRoute />}>
          <Route path="/usuarios" element={<p>Tela de usuários</p>} />
        </Route>
      </Route>
    </Routes>,
    { services, route },
  )
}

describe('role-based access', () => {
  it('shows the users section to the administrator', () => {
    renderAppAs('Admin', '/usuarios')

    expect(screen.getByRole('tab', { name: 'Usuários' })).toBeInTheDocument()
    expect(screen.getByText('Tela de usuários')).toBeInTheDocument()
  })

  it('hides the users section from a common user', () => {
    renderAppAs('Common', '/contatos')

    expect(screen.getByRole('tab', { name: 'Contatos' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Usuários' })).not.toBeInTheDocument()
  })

  it('sends a common user who opens the users URL back to the contacts', () => {
    const { services } = renderAppAs('Common', '/usuarios')

    expect(screen.queryByText('Tela de usuários')).not.toBeInTheDocument()
    expect(screen.getByText('Tela de contatos')).toBeInTheDocument()
    expect(vi.mocked(services.users.search)).not.toHaveBeenCalled()
  })
})
