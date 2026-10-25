import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../application/errors/AppError'
import { fakeServices, memoryTokenStorage } from '../../test/fakes'
import { renderWithApp } from '../../test/renderWithApp'
import { LoginPage } from './LoginPage'
import { ProtectedRoute } from './ProtectedRoute'

function renderApp() {
  const services = fakeServices({ tokenStorage: memoryTokenStorage(null) })
  return renderWithApp(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<p>Área logada</p>} />
      </Route>
    </Routes>,
    { services, route: '/' },
  )
}

describe('LoginPage', () => {
  it('redirects to the login when there is no session', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Agenda de Contatos' })).toBeInTheDocument()
    expect(screen.queryByText('Área logada')).not.toBeInTheDocument()
  })

  it('logs in, stores the session and opens the app', async () => {
    const { user, services } = renderApp()

    await user.type(screen.getByLabelText('E-mail'), 'admin@unimed.local')
    await user.type(screen.getByLabelText('Senha'), 'Admin@123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Área logada')).toBeInTheDocument()
    expect(services.tokenStorage.get()?.accessToken).toBe('new-token')
  })

  it('shows the API message when the credentials are wrong', async () => {
    const { user, services } = renderApp()
    vi.mocked(services.auth.login).mockRejectedValue(new AppError('E-mail ou senha inválidos.', 401))

    await user.type(screen.getByLabelText('E-mail'), 'admin@unimed.local')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
    expect(services.tokenStorage.get()).toBeNull()
  })
})
