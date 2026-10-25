import EditIcon from '@mui/icons-material/Edit'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import type { User } from '../../domain/users/user'
import { formatDateTime } from '../shared/formatDateTime'

interface UsersTableProps {
  users: User[]
  onEdit(user: User): void
}

export function UsersTable({ users, onEdit }: UsersTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>E-mail</TableCell>
            <TableCell>Perfil</TableCell>
            <TableCell>Criado em</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => {
            const isAdmin = user.role === 'Admin'
            return (
              <TableRow key={user.id} hover>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={isAdmin ? 'Administrador' : 'Comum'}
                    color={isAdmin ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(user.createdAt)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {/* The administrator comes from the API configuration: no edit option at all. */}
                  {!isAdmin && (
                    <Tooltip title="Editar">
                      <IconButton aria-label={`Editar ${user.email}`} onClick={() => onEdit(user)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
