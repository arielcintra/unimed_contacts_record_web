import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { errorMessage } from '../../application/errors/AppError'
import { useImports } from '../../application/imports/useImports'
import type { ContactImport } from '../../domain/imports/contactImport'
import { ROWS_PER_PAGE_OPTIONS, toPageRequest } from '../shared/pagination'
import { ImportDetailsDialog } from './ImportDetailsDialog'
import { ImportsTable } from './ImportsTable'
import { ImportUploadButton } from './ImportUploadButton'

export function ImportsPage() {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0])
  const [openedId, setOpenedId] = useState<string | null>(null)
  const imports = useImports(toPageRequest(page, rowsPerPage))

  // Read from the polled list, so the dialog's counters keep updating while the import runs.
  const opened: ContactImport | undefined = imports.data?.items.find((item) => item.id === openedId)

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack>
          <Typography variant="h5" component="h1">
            Importações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CSV com as colunas nome, email e telefone (separadas por vírgula ou ponto e vírgula), até 5 MB.
          </Typography>
        </Stack>
        <ImportUploadButton />
      </Stack>

      {imports.isError && <Alert severity="error">{errorMessage(imports.error)}</Alert>}

      <Paper>
        {imports.isLoading && <LinearProgress />}
        <ImportsTable imports={imports.data?.items ?? []} onOpen={(item) => setOpenedId(item.id)} />
        <TablePagination
          component="div"
          count={imports.data?.totalCount ?? 0}
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

      {opened && <ImportDetailsDialog contactImport={opened} onClose={() => setOpenedId(null)} />}
    </Stack>
  )
}
