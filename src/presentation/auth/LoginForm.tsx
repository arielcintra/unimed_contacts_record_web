import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../application/errors/AppError'
import type { Credentials } from '../../domain/auth/session'

interface LoginFormProps {
  onSubmit(credentials: Credentials): Promise<void>
  submitLabel?: string
}

/** Shared by the login page and the "session expired" dialog. */
export function LoginForm({ onSubmit, submitLabel = 'Entrar' }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ email, password })
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="E-mail"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoFocus
        fullWidth
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" loading={submitting}>
        {submitLabel}
      </Button>
    </Stack>
  )
}
