import AddIcon from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { useContacts, useSetActive, useSetFavorite } from '../../application/contacts/useContacts'
import { errorMessage } from '../../application/errors/AppError'
import { useHasRunningImports } from '../../application/imports/useImports'
import type { Contact, ContactFilters, ContactStatusFilter } from '../../domain/contacts/contact'
import { useNotify } from '../shared/NotificationProvider'
import { ROWS_PER_PAGE_OPTIONS, toPageRequest } from '../shared/pagination'
import { useDebouncedValue } from '../shared/useDebouncedValue'
import { ContactFormDialog } from './ContactFormDialog'
import { ContactsTable } from './ContactsTable'
import { ContactsToolbar } from './ContactsToolbar'

const SEARCH_DEBOUNCE_MS = 300

/** Container: holds filters and paging, delegates rendering to presentational components. */
export function ContactsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ContactStatusFilter>('active')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0])
  // undefined: closed; null: new contact; Contact: editing.
  const [editing, setEditing] = useState<Contact | null | undefined>(undefined)

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const filters = useMemo<ContactFilters>(
    () => ({ search: debouncedSearch, status, favoritesOnly }),
    [debouncedSearch, status, favoritesOnly],
  )

  const contacts = useContacts(filters, toPageRequest(page, rowsPerPage))
  const importsRunning = useHasRunningImports()
  const setFavorite = useSetFavorite()
  const setActive = useSetActive()
  const notify = useNotify()

  // Any filter change goes back to the first page.
  const withFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(0)
    }

  const toggleFavorite = (contact: Contact) =>
    setFavorite.mutate(
      { id: contact.id, favorite: !contact.isFavorite },
      { onError: (error) => notify(errorMessage(error), 'error') },
    )

  const toggleActive = (contact: Contact) =>
    setActive.mutate(
      { id: contact.id, active: !contact.isActive },
      {
        onSuccess: () => notify(contact.isActive ? 'Contato inativado.' : 'Contato reativado.'),
        onError: (error) => notify(errorMessage(error), 'error'),
      },
    )

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Contatos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
          Novo contato
        </Button>
      </Stack>

      <ContactsToolbar
        search={search}
        status={status}
        favoritesOnly={favoritesOnly}
        onSearchChange={withFirstPage(setSearch)}
        onStatusChange={withFirstPage(setStatus)}
        onFavoritesOnlyChange={withFirstPage(setFavoritesOnly)}
      />

      {importsRunning && (
        <Alert severity="info">Há uma importação em andamento: a lista é atualizada automaticamente.</Alert>
      )}
      {contacts.isError && <Alert severity="error">{errorMessage(contacts.error)}</Alert>}

      <Paper>
        {contacts.isFetching && <LinearProgress />}
        <ContactsTable
          contacts={contacts.data?.items ?? []}
          onEdit={setEditing}
          onToggleFavorite={toggleFavorite}
          onToggleActive={toggleActive}
        />
        <TablePagination
          component="div"
          count={contacts.data?.totalCount ?? 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(event) => withFirstPage(setRowsPerPage)(Number(event.target.value))}
        />
      </Paper>

      {editing !== undefined && (
        <ContactFormDialog key={editing?.id ?? 'new'} contact={editing} onClose={() => setEditing(undefined)} />
      )}
    </Stack>
  )
}
