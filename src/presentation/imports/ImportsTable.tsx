import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { isImportRunning, type ContactImport } from '../../domain/imports/contactImport'
import { formatDateTime } from '../shared/formatDateTime'
import { ImportStatusChip } from './ImportStatusChip'

interface ImportsTableProps {
  imports: ContactImport[]
  onOpen(contactImport: ContactImport): void
}

export function ImportsTable({ imports, onOpen }: ImportsTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Arquivo</TableCell>
            <TableCell>Enviado em</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Linhas</TableCell>
            <TableCell align="right">Importadas</TableCell>
            <TableCell align="right">Duplicadas</TableCell>
            <TableCell align="right">Inválidas</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {imports.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Nenhuma importação enviada.
              </TableCell>
            </TableRow>
          )}
          {imports.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.fileName}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.createdAt)}</TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  <ImportStatusChip status={item.status} />
                  {isImportRunning(item.status) && <LinearProgress aria-label="Processando" />}
                </Stack>
              </TableCell>
              <TableCell align="right">{item.totalRows}</TableCell>
              <TableCell align="right">{item.importedRows}</TableCell>
              <TableCell align="right">{item.duplicateRows}</TableCell>
              <TableCell align="right">{item.invalidRows}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => onOpen(item)}>
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
