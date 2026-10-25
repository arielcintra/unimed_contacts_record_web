import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../../application/auth/AuthProvider'
import type { Credentials } from '../../domain/auth/session'
import { LoginForm } from './LoginForm'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleLogin = async (credentials: Credentials) => {
    await login(credentials)
    navigate('/', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Agenda de Contatos
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Entre para acessar seus contatos.
          </Typography>
          <LoginForm onSubmit={handleLogin} />
        </CardContent>
      </Card>
    </Box>
  )
}
