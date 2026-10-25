import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ContactImport } from '../domain/imports/contactImport'
import { aContact, aContactImport, fakeContactRepository, fakeImportRepository, fakeServices, pageOf } from '../test/fakes'
import { renderWithApp } from '../test/renderWithApp'
import { ContactsPage } from './contacts/ContactsPage'
import { ImportsPage } from './imports/ImportsPage'
import { AppLayout } from './layout/AppLayout'

// Real polling interval (2 s): these tests wait for at least one polling cycle.
const POLLING_TIMEOUT = { timeout: 6000 }

const ana = aContact({ name: 'Ana Silva' })
const bia = aContact({ name: 'Bia Souza', phone: '11987650002' })

function renderApp(route: string, services = fakeServices()) {
  return renderWithApp(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/contatos" element={<ContactsPage />} />
        <Route path="/importacoes" element={<ImportsPage />} />
      </Route>
    </Routes>,
    { services, route },
  )
}

/** The API reports the import as running on the first calls and as finished afterwards. */
function importFinishingAfter(runningResponses: number) {
  const imports = fakeImportRepository()
  const running = aContactImport({ id: 'import-1', status: 'Processing', importedRows: 1 })
  const finished: ContactImport = { ...running, status: 'Completed', totalRows: 2, importedRows: 2 }
  let calls = 0
  vi.mocked(imports.list).mockImplementation(async () => pageOf([++calls <= runningResponses ? running : finished]))
  return imports
}

describe('Imported contacts on the contacts screen', () => {
  it('shows contacts imported while the user was on another screen', async () => {
    const contacts = fakeContactRepository()
    vi.mocked(contacts.search).mockResolvedValueOnce(pageOf([])).mockResolvedValue(pageOf([ana]))
    const imports = fakeImportRepository()
    vi.mocked(imports.list).mockResolvedValue(pageOf([aContactImport({ status: 'Completed' })]))
    const { user } = renderApp('/contatos', fakeServices({ contacts, imports }))
    expect(await screen.findByText('Nenhum contato encontrado.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Importações' }))
    await user.click(screen.getByRole('tab', { name: 'Contatos' }))

    // The list cached before the import is not reused: it is fetched again.
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
  })

  it('marks every contact list as stale when an import finishes', async () => {
    const services = fakeServices({ imports: importFinishingAfter(1) })
    const { queryClient } = renderApp('/importacoes', services)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await waitFor(
      () => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['contacts'] }),
      POLLING_TIMEOUT,
    )
  })

  it(
    'keeps refreshing the contacts while an import runs, including the last batch',
    async () => {
      const contacts = fakeContactRepository()
      vi.mocked(contacts.search).mockResolvedValueOnce(pageOf([ana])).mockResolvedValue(pageOf([ana, bia]))
      renderApp('/contatos', fakeServices({ contacts, imports: importFinishingAfter(2) }))

      expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
      expect(await screen.findByText(/importação em andamento/)).toBeInTheDocument()

      // Contacts of the remaining batches appear without any action, and the notice goes away.
      expect(await screen.findByText('Bia Souza', undefined, POLLING_TIMEOUT)).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByText(/importação em andamento/)).not.toBeInTheDocument(), POLLING_TIMEOUT)
    },
    15_000,
  )
})
