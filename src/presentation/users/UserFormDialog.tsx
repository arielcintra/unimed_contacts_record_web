import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../application/errors/AppError'
import { useSaveUser } from '../../application/users/useUsers'
import type { User, UserInput } from '../../domain/users/user'
import { useNotify } from '../shared/NotificationProvider'

interface UserFormDialogProps {
  /** null: new user. */
  user: User | null
  onClose(): void
}

/** New users are always common. Validation is the API's job: its message is shown as is. */
export function UserFormDialog({ user, onClose }: UserFormDialogProps) {
  const [input, setInput] = useState<UserInput>(() => ({ email: user?.email ?? '', password: '' }))
  const save = useSaveUser()
  const notify = useNotify()

  const change = (field: keyof UserInput) => (event: { target: { value: string } }) =>
    setInput((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(
      { id: user?.id, input },
      {
        onSuccess: () => {
          notify(user ? 'Usuário atualizado.' : 'Usuário cadastrado.')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="user-form-title">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="user-form-title">{user ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {save.isError && <Alert severity="error">{errorMessage(save.error)}</Alert>}
            <TextField
              label="E-mail"
              type="email"
              value={input.email}
              onChange={change('email')}
              autoFocus
              fullWidth
            />
            <TextField
              label={user ? 'Nova senha' : 'Senha'}
              type="password"
              autoComplete="new-password"
              value={input.password}
              onChange={change('password')}
              helperText={user ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 8 caracteres.'}
              fullWidth
            />
            {!user && <Alert severity="info">O usuário será cadastrado com o perfil comum.</Alert>}
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
