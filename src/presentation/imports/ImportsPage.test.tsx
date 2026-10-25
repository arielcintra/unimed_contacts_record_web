import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../application/errors/AppError'
import { aContactImport, fakeImportRepository, fakeServices, pageOf } from '../../test/fakes'
import { renderWithApp } from '../../test/renderWithApp'
import { ImportsPage } from './ImportsPage'

const csvFile = () => new File(['nome,email,telefone\nAna,,11987654321'], 'contatos.csv', { type: 'text/csv' })

describe('ImportsPage', () => {
  it('lists imports with their status and counters', async () => {
    const imports = fakeImportRepository()
    vi.mocked(imports.list).mockResolvedValue(
      pageOf([aContactImport({ fileName: 'janeiro.csv', status: 'Processing', totalRows: 40, importedRows: 38 })]),
    )

    renderWithApp(<ImportsPage />, { services: fakeServices({ imports }) })

    expect(await screen.findByText('janeiro.csv')).toBeInTheDocument()
    expect(screen.getByText('Processando')).toBeInTheDocument()
    expect(screen.getByLabelText('Processando')).toBeInTheDocument()
    expect(screen.getByText('38')).toBeInTheDocument()
  })

  it('uploads the chosen CSV file', async () => {
    const imports = fakeImportRepository()
    vi.mocked(imports.upload).mockResolvedValue(aContactImport({ status: 'Pending' }))
    const { user } = renderWithApp(<ImportsPage />, { services: fakeServices({ imports }) })
    const file = csvFile()

    await user.upload(screen.getByLabelText('Arquivo CSV'), file)

    expect(imports.upload).toHaveBeenCalledWith(file)
    expect(await screen.findByText('Arquivo enviado. A importação está em processamento.')).toBeInTheDocument()
    // The list is fetched again to show the new import.
    await waitFor(() => expect(imports.list).toHaveBeenCalledTimes(2))
  })

  it('shows the API message when the upload is rejected', async () => {
    const imports = fakeImportRepository()
    vi.mocked(imports.upload).mockRejectedValue(new AppError('O arquivo deve ter a extensão .csv.', 400))
    const { user } = renderWithApp(<ImportsPage />, { services: fakeServices({ imports }) })

    await user.upload(screen.getByLabelText('Arquivo CSV'), csvFile())

    expect(await screen.findByText('O arquivo deve ter a extensão .csv.')).toBeInTheDocument()
  })

  it('shows the rows not imported, filtered by kind', async () => {
    const imports = fakeImportRepository()
    const contactImport = aContactImport({ status: 'CompletedWithErrors', duplicateRows: 1, invalidRows: 1 })
    vi.mocked(imports.list).mockResolvedValue(pageOf([contactImport]))
    vi.mocked(imports.errors).mockResolvedValue(
      pageOf([
        { lineNumber: 4, kind: 'Invalid', content: 'Bia,,123', reason: 'Telefone inválido.' },
        {
          lineNumber: 5,
          kind: 'Duplicate',
          content: 'Ana,,11987654321',
          reason: 'Telefone 11987654321 já cadastrado para o contato "Ana Silva" (ativo).',
        },
      ]),
    )
    const { user } = renderWithApp(<ImportsPage />, { services: fakeServices({ imports }) })

    await user.click(await screen.findByRole('button', { name: 'Detalhes' }))
    const dialog = screen.getByRole('dialog')

    expect(await within(dialog).findByText('Telefone inválido.')).toBeInTheDocument()
    expect(within(dialog).getByText(/já cadastrado para o contato "Ana Silva"/)).toBeInTheDocument()
    expect(imports.errors).toHaveBeenLastCalledWith(contactImport.id, null, { page: 1, pageSize: 10 })

    await user.click(within(dialog).getByRole('tab', { name: 'Duplicadas' }))

    await waitFor(() =>
      expect(imports.errors).toHaveBeenLastCalledWith(contactImport.id, 'Duplicate', { page: 1, pageSize: 10 }),
    )
  })

  it('shows why a failed import could not be processed', async () => {
    const imports = fakeImportRepository()
    vi.mocked(imports.list).mockResolvedValue(
      pageOf([aContactImport({ status: 'Failed', failureReason: 'Cabeçalho inválido. Colunas obrigatórias: nome, email, telefone.' })]),
    )
    const { user } = renderWithApp(<ImportsPage />, { services: fakeServices({ imports }) })

    await user.click(await screen.findByRole('button', { name: 'Detalhes' }))

    expect(within(screen.getByRole('dialog')).getByText(/Cabeçalho inválido/)).toBeInTheDocument()
  })
})
