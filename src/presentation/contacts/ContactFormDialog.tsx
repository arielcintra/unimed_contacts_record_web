import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { useSaveContact } from '../../application/contacts/useContacts'
import { errorMessage } from '../../application/errors/AppError'
import type { Contact, ContactInput } from '../../domain/contacts/contact'
import { formatPhone } from '../../domain/contacts/phone'
import { useNotify } from '../shared/NotificationProvider'

interface ContactFormDialogProps {
  /** null: new contact. */
  contact: Contact | null
  onClose(): void
}

/** Validation is the API's job: its message (e.g. duplicated phone) is shown as is. */
export function ContactFormDialog({ contact, onClose }: ContactFormDialogProps) {
  const [input, setInput] = useState<ContactInput>(() => ({
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact ? formatPhone(contact.phone) : '',
  }))
  const save = useSaveContact()
  const notify = useNotify()

  const change = (field: keyof ContactInput) => (event: { target: { value: string } }) =>
    setInput((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(
      { id: contact?.id, input },
      {
        onSuccess: () => {
          notify(contact ? 'Contato atualizado.' : 'Contato cadastrado.')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="contact-form-title">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="contact-form-title">{contact ? 'Editar contato' : 'Novo contato'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {save.isError && <Alert severity="error">{errorMessage(save.error)}</Alert>}
            <TextField label="Nome" value={input.name} onChange={change('name')} autoFocus fullWidth />
            <TextField label="E-mail" type="email" value={input.email} onChange={change('email')} fullWidth />
            <TextField
              label="Telefone"
              placeholder="(11) 98765-4321"
              value={input.phone}
              onChange={change('phone')}
              helperText="Fixo ou celular, com DDD."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={save.isPending}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
