import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { errorMessage } from '../../application/errors/AppError'
import { useUsers } from '../../application/users/useUsers'
import type { User } from '../../domain/users/user'
import { ROWS_PER_PAGE_OPTIONS, toPageRequest } from '../shared/pagination'
import { useDebouncedValue } from '../shared/useDebouncedValue'
import { UserFormDialog } from './UserFormDialog'
import { UsersTable } from './UsersTable'

const SEARCH_DEBOUNCE_MS = 300

/** Admin only (AdminRoute): registers and edits common users. */
export function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0])
  // undefined: closed; null: new user; User: editing.
  const [editing, setEditing] = useState<User | null | undefined>(undefined)

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const users = useUsers(debouncedSearch, toPageRequest(page, rowsPerPage))

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Usuários
        </Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setEditing(null)}>
          Novo usuário
        </Button>
      </Stack>

      <TextField
        label="Buscar por e-mail"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(0)
        }}
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {users.isError && <Alert severity="error">{errorMessage(users.error)}</Alert>}

      <Paper>
        {users.isFetching && <LinearProgress />}
        <UsersTable users={users.data?.items ?? []} onEdit={setEditing} />
        <TablePagination
          component="div"
          count={users.data?.totalCount ?? 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
        />
      </Paper>

      {editing !== undefined && (
        <UserFormDialog key={editing?.id ?? 'new'} user={editing} onClose={() => setEditing(undefined)} />
      )}
    </Stack>
  )
}
