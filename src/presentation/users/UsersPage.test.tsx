import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../application/errors/AppError'
import type { UserRepository } from '../../application/ports/UserRepository'
import { aUser, fakeServices, fakeUserRepository, pageOf } from '../../test/fakes'
import { renderWithApp } from '../../test/renderWithApp'
import { UsersPage } from './UsersPage'

function renderPage(users: UserRepository = fakeUserRepository()) {
  return renderWithApp(<UsersPage />, { services: fakeServices({ users }) })
}

describe('UsersPage', () => {
  it('lists the users with their profile', async () => {
    const users = fakeUserRepository()
    vi.mocked(users.search).mockResolvedValue(
      pageOf([aUser({ email: 'admin@unimed.local', role: 'Admin' }), aUser({ email: 'bia@unimed.local' })]),
    )

    renderPage(users)

    expect(await screen.findByText('bia@unimed.local')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Comum')).toBeInTheDocument()
  })

  it('searches by e-mail once the user stops typing', async () => {
    const users = fakeUserRepository()
    const { user } = renderPage(users)

    await user.type(screen.getByLabelText('Buscar por e-mail'), 'bia')

    await waitFor(() => expect(vi.mocked(users.search).mock.lastCall?.[0]).toBe('bia'))
  })

  it('creates a common user', async () => {
    const users = fakeUserRepository()
    vi.mocked(users.create).mockResolvedValue(aUser())
    const { user } = renderPage(users)

    await user.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo usuário' })
    await user.type(within(dialog).getByLabelText('E-mail'), 'bia@unimed.local')
    await user.type(within(dialog).getByLabelText('Senha'), 'Senha@123')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(users.create).toHaveBeenCalledWith({ email: 'bia@unimed.local', password: 'Senha@123' })
    expect(await screen.findByText('Usuário cadastrado.')).toBeInTheDocument()
  })

  it('shows the API message and keeps the form when saving fails', async () => {
    const users = fakeUserRepository()
    vi.mocked(users.create).mockRejectedValue(new AppError('Já existe um usuário com este e-mail.', 409))
    const { user } = renderPage(users)

    await user.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo usuário' })
    await user.type(within(dialog).getByLabelText('E-mail'), 'bia@unimed.local')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialog).findByText('Já existe um usuário com este e-mail.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('E-mail')).toHaveValue('bia@unimed.local')
  })

  it('edits a common user keeping the password when left blank', async () => {
    const users = fakeUserRepository()
    const bia = aUser({ email: 'bia@unimed.local' })
    vi.mocked(users.search).mockResolvedValue(pageOf([bia]))
    vi.mocked(users.update).mockResolvedValue(bia)
    const { user } = renderPage(users)

    await user.click(await screen.findByRole('button', { name: 'Editar bia@unimed.local' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar usuário' })
    await user.clear(within(dialog).getByLabelText('E-mail'))
    await user.type(within(dialog).getByLabelText('E-mail'), 'beatriz@unimed.local')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(users.update).toHaveBeenCalledWith(bia.id, { email: 'beatriz@unimed.local', password: '' })
    expect(await screen.findByText('Usuário atualizado.')).toBeInTheDocument()
  })

  it('offers no edit option for the administrator', async () => {
    const users = fakeUserRepository()
    vi.mocked(users.search).mockResolvedValue(
      pageOf([aUser({ email: 'admin@unimed.local', role: 'Admin' }), aUser({ email: 'bia@unimed.local' })]),
    )

    renderPage(users)

    expect(await screen.findByRole('button', { name: 'Editar bia@unimed.local' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar admin@unimed.local' })).not.toBeInTheDocument()
  })
})
