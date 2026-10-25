import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { errorMessage } from '../../application/errors/AppError'
import { useImportErrors } from '../../application/imports/useImports'
import type { ContactImport, ImportRowErrorKind } from '../../domain/imports/contactImport'
import { ROWS_PER_PAGE_OPTIONS, toPageRequest } from '../shared/pagination'
import { ImportStatusChip } from './ImportStatusChip'

const KIND_LABEL: Record<ImportRowErrorKind, string> = { Invalid: 'Inválida', Duplicate: 'Duplicada' }

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <Stack sx={{ minWidth: 96 }}>
      <Typography variant="h6" component="span">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}

/** Counters of one import and the rows that were not imported, with the reason. */
export function ImportDetailsDialog({ contactImport, onClose }: { contactImport: ContactImport; onClose(): void }) {
  const [kind, setKind] = useState<ImportRowErrorKind | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0])
  const errors = useImportErrors(contactImport, kind, toPageRequest(page, rowsPerPage))

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth aria-labelledby="import-details-title">
      <DialogTitle id="import-details-title">
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <span>{contactImport.fileName}</span>
          <ImportStatusChip status={contactImport.status} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {contactImport.failureReason && <Alert severity="error">{contactImport.failureReason}</Alert>}

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
            <Counter label="Linhas" value={contactImport.totalRows} />
            <Counter label="Importadas" value={contactImport.importedRows} />
            <Counter label="Duplicadas" value={contactImport.duplicateRows} />
            <Counter label="Inválidas" value={contactImport.invalidRows} />
          </Stack>

          <Tabs
            value={kind ?? 'all'}
            onChange={(_, value: ImportRowErrorKind | 'all') => {
              setKind(value === 'all' ? null : value)
              setPage(0)
            }}
          >
            <Tab label="Todas" value="all" />
            <Tab label="Inválidas" value="Invalid" />
            <Tab label="Duplicadas" value="Duplicate" />
          </Tabs>

          {errors.isError && <Alert severity="error">{errorMessage(errors.error)}</Alert>}
          {errors.isFetching && <LinearProgress />}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Linha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Conteúdo</TableCell>
                  <TableCell>Motivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errors.data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Nenhuma linha com erro.
                    </TableCell>
                  </TableRow>
                )}
                {errors.data?.items.map((error) => (
                  <TableRow key={`${error.lineNumber}-${error.kind}`}>
                    <TableCell>{error.lineNumber}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={KIND_LABEL[error.kind]}
                        color={error.kind === 'Invalid' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{error.content}</TableCell>
                    <TableCell>{error.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={errors.data?.totalCount ?? 0}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}
