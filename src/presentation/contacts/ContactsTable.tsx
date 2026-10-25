import BlockIcon from '@mui/icons-material/Block'
import EditIcon from '@mui/icons-material/Edit'
import RestoreIcon from '@mui/icons-material/Restore'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import type { Contact } from '../../domain/contacts/contact'
import { formatPhone } from '../../domain/contacts/phone'
import { formatDateTime } from '../shared/formatDateTime'

interface ContactsTableProps {
  contacts: Contact[]
  onEdit(contact: Contact): void
  onToggleFavorite(contact: Contact): void
  onToggleActive(contact: Contact): void
}

export function ContactsTable({ contacts, onEdit, onToggleFavorite, onToggleActive }: ContactsTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>Nome</TableCell>
            <TableCell>E-mail</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Atualizado em</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Nenhum contato encontrado.
              </TableCell>
            </TableRow>
          )}
          {contacts.map((contact) => (
            <TableRow key={contact.id} hover>
              <TableCell padding="checkbox">
                <Tooltip title={contact.isFavorite ? 'Desmarcar favorito' : 'Marcar como favorito'}>
                  <IconButton
                    aria-label={`${contact.isFavorite ? 'Desmarcar' : 'Marcar'} ${contact.name} como favorito`}
                    onClick={() => onToggleFavorite(contact)}
                    color={contact.isFavorite ? 'warning' : 'default'}
                  >
                    {contact.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.email ?? '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatPhone(contact.phone)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={contact.isActive ? 'Ativo' : 'Inativo'}
                  color={contact.isActive ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(contact.updatedAt)}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                <Tooltip title="Editar">
                  <IconButton aria-label={`Editar ${contact.name}`} onClick={() => onEdit(contact)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={contact.isActive ? 'Inativar' : 'Reativar'}>
                  <IconButton
                    aria-label={`${contact.isActive ? 'Inativar' : 'Reativar'} ${contact.name}`}
                    onClick={() => onToggleActive(contact)}
                  >
                    {contact.isActive ? <BlockIcon /> : <RestoreIcon />}
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
