import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../application/errors/AppError'
import type { ContactRepository } from '../../application/ports/ContactRepository'
import { aContact, fakeContactRepository, fakeServices, pageOf } from '../../test/fakes'
import { renderWithApp } from '../../test/renderWithApp'
import { ContactsPage } from './ContactsPage'

function renderPage(contacts: ContactRepository = fakeContactRepository()) {
  return renderWithApp(<ContactsPage />, { services: fakeServices({ contacts }) })
}

const lastSearch = (contacts: ContactRepository) => vi.mocked(contacts.search).mock.lastCall

describe('ContactsPage', () => {
  it('lists the contacts returned by the API, active ones first by default', async () => {
    const contacts = fakeContactRepository()
    vi.mocked(contacts.search).mockResolvedValue(pageOf([aContact({ name: 'Ana Silva', phone: '11987654321' })]))

    renderPage(contacts)

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(lastSearch(contacts)).toEqual([
      { search: '', status: 'active', favoritesOnly: false },
      { page: 1, pageSize: 10 },
    ])
  })

  it('searches once the user stops typing', async () => {
    const contacts = fakeContactRepository()
    const { user } = renderPage(contacts)

    await user.type(screen.getByLabelText(/Buscar por nome/), 'ana')

    await waitFor(() => expect(lastSearch(contacts)?.[0].search).toBe('ana'))
    // Debounced: no request for the partial terms "a" and "an".
    expect(vi.mocked(contacts.search).mock.calls.map(([filters]) => filters.search)).not.toContain('an')
  })

  it('filters by status and favorites', async () => {
    const contacts = fakeContactRepository()
    const { user } = renderPage(contacts)

    await user.click(screen.getByRole('button', { name: 'Inativos' }))
    await user.click(screen.getByRole('button', { name: /Somente favoritos/ }))

    await waitFor(() => expect(lastSearch(contacts)?.[0]).toMatchObject({ status: 'inactive', favoritesOnly: true }))
  })

  it('marks a contact as favorite and inactivates it', async () => {
    const contacts = fakeContactRepository()
    const ana = aContact({ name: 'Ana Silva' })
    vi.mocked(contacts.search).mockResolvedValue(pageOf([ana]))
    vi.mocked(contacts.setFavorite).mockResolvedValue({ ...ana, isFavorite: true })
    vi.mocked(contacts.setActive).mockResolvedValue({ ...ana, isActive: false })
    const { user } = renderPage(contacts)

    await user.click(await screen.findByRole('button', { name: 'Marcar Ana Silva como favorito' }))
    await user.click(screen.getByRole('button', { name: 'Inativar Ana Silva' }))

    expect(contacts.setFavorite).toHaveBeenCalledWith(ana.id, true)
    expect(contacts.setActive).toHaveBeenCalledWith(ana.id, false)
    expect(await screen.findByText('Contato inativado.')).toBeInTheDocument()
  })

  it('creates a contact', async () => {
    const contacts = fakeContactRepository()
    vi.mocked(contacts.create).mockResolvedValue(aContact())
    const { user } = renderPage(contacts)

    await user.click(screen.getByRole('button', { name: 'Novo contato' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo contato' })
    await user.type(within(dialog).getByLabelText('Nome'), 'Bia')
    await user.type(within(dialog).getByLabelText('Telefone'), '(11) 3456-7890')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(contacts.create).toHaveBeenCalledWith({ name: 'Bia', email: '', phone: '(11) 3456-7890' })
    expect(await screen.findByText('Contato cadastrado.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Novo contato' })).not.toBeInTheDocument())
  })

  it('shows the API message and keeps the form when saving fails', async () => {
    const contacts = fakeContactRepository()
    vi.mocked(contacts.create).mockRejectedValue(new AppError('Já existe um contato com este telefone.', 409))
    const { user } = renderPage(contacts)

    await user.click(screen.getByRole('button', { name: 'Novo contato' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo contato' })
    await user.type(within(dialog).getByLabelText('Nome'), 'Bia')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialog).findByText('Já existe um contato com este telefone.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Bia')
  })

  it('edits a contact with its current data filled in', async () => {
    const contacts = fakeContactRepository()
    const ana = aContact({ name: 'Ana Silva', phone: '11987654321' })
    vi.mocked(contacts.search).mockResolvedValue(pageOf([ana]))
    vi.mocked(contacts.update).mockResolvedValue(ana)
    const { user } = renderPage(contacts)

    await user.click(await screen.findByRole('button', { name: 'Editar Ana Silva' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar contato' })
    expect(within(dialog).getByLabelText('Telefone')).toHaveValue('(11) 98765-4321')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(contacts.update).toHaveBeenCalledWith(ana.id, {
      name: 'Ana Silva',
      email: 'ana@example.com',
      phone: '(11) 98765-4321',
    })
  })
})
