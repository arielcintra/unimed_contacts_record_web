import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionExpiry } from '../../application/auth/SessionExpiry'
import { HttpContactRepository } from '../../infrastructure/contacts/HttpContactRepository'
import { ApiClient } from '../../infrastructure/http/ApiClient'
import { fakeServices, jsonResponse, memoryTokenStorage, validSession } from '../../test/fakes'
import { renderWithApp } from '../../test/renderWithApp'
import { ContactFormDialog } from '../contacts/ContactFormDialog'

const createdContact = {
  id: '1',
  name: 'Maria Souza',
  email: null,
  phone: '11987654321',
  isFavorite: false,
  isActive: true,
  createdAt: '2026-10-25T12:00:00Z',
  updatedAt: '2026-10-25T12:00:00Z',
}

/** Real ApiClient + repository + SessionExpiry; only the network (fetch) is simulated. */
function setup() {
  const tokenStorage = memoryTokenStorage(validSession('expired-token'))
  const sessionExpiry = new SessionExpiry()
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(jsonResponse(401))
    .mockResolvedValueOnce(jsonResponse(201, createdContact))
  const api = new ApiClient({
    baseUrl: '/api',
    tokenStorage,
    onUnauthorized: () => sessionExpiry.waitForReauthentication(),
    fetch: fetchMock,
  })
  const services = fakeServices({ contacts: new HttpContactRepository(api), tokenStorage, sessionExpiry })
  const onClose = vi.fn()

  return { ...renderWithApp(<ContactFormDialog contact={null} onClose={onClose} />, { services }), fetchMock, onClose }
}

describe('Session expired while editing', () => {
  it('asks for a new login without losing the form, then saves what was typed', async () => {
    const { user, services, fetchMock, onClose } = setup()
    const form = screen.getByRole('dialog', { name: 'Novo contato' })

    await user.type(within(form).getByLabelText('Nome'), 'Maria Souza')
    await user.type(within(form).getByLabelText('Telefone'), '(11) 98765-4321')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    // The API rejected the expired token: the login dialog opens over the form, which keeps its data.
    const login = await screen.findByRole('dialog', { name: 'Sessão expirada' })
    expect(within(form).getByLabelText('Nome')).toHaveValue('Maria Souza')

    await user.type(within(login).getByLabelText('E-mail'), 'admin@unimed.local')
    await user.type(within(login).getByLabelText('Senha'), 'Admin@123')
    await user.click(within(login).getByRole('button', { name: 'Continuar' }))

    // The same request is sent again with the new token, and the save completes.
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(services.auth.login).toHaveBeenCalledWith({ email: 'admin@unimed.local', password: 'Admin@123' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, retry] = fetchMock.mock.calls[1]
    expect(JSON.parse(retry?.body as string)).toEqual({ name: 'Maria Souza', email: '', phone: '(11) 98765-4321' })
    expect((retry?.headers as Headers).get('Authorization')).toBe('Bearer new-token')
    expect(await screen.findByText('Contato cadastrado.')).toBeInTheDocument()
    // Waits for the closing animation.
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sessão expirada' })).not.toBeInTheDocument())
  })

  it('logs the user out when they choose to leave', async () => {
    const { user, services } = setup()
    const form = screen.getByRole('dialog', { name: 'Novo contato' })

    await user.type(within(form).getByLabelText('Nome'), 'Maria Souza')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))
    const login = await screen.findByRole('dialog', { name: 'Sessão expirada' })
    await user.click(within(login).getByRole('button', { name: 'Sair' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sessão expirada' })).not.toBeInTheDocument())
    expect(services.tokenStorage.get()).toBeNull()
  })
})
