import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useAuth, useSessionExpired } from '../../application/auth/AuthProvider'
import { useServices } from '../../application/services'
import type { Credentials } from '../../domain/auth/session'
import { LoginForm } from './LoginForm'

/**
 * Opens over the current screen when the API answers 401. The screen behind it is not unmounted,
 * so whatever the user was editing is kept; after logging in, the pending requests are sent again.
 */
export function SessionExpiredDialog() {
  const expired = useSessionExpired()
  const { login, logout } = useAuth()
  const { sessionExpiry } = useServices()

  const handleLogin = async (credentials: Credentials) => {
    await login(credentials)
    sessionExpiry.reauthenticated()
  }

  return (
    <Dialog open={expired} maxWidth="xs" fullWidth aria-labelledby="session-expired-title">
      <DialogTitle id="session-expired-title">Sessão expirada</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Entre novamente para continuar. O que você estava fazendo não será perdido.
        </DialogContentText>
        <LoginForm onSubmit={handleLogin} submitLabel="Continuar" />
      </DialogContent>
      <DialogActions>
        <Button onClick={logout}>Sair</Button>
      </DialogActions>
    </Dialog>
  )
}
