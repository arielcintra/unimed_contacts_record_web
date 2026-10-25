import LogoutIcon from '@mui/icons-material/Logout'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../application/auth/AuthProvider'

const SECTIONS = [
  { path: '/contatos', label: 'Contatos' },
  { path: '/importacoes', label: 'Importações' },
]

export function AppLayout() {
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const current = SECTIONS.find((section) => pathname.startsWith(section.path))?.path ?? false

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 3, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="span" noWrap>
            Agenda de Contatos
          </Typography>
          <Tabs value={current} textColor="inherit" indicatorColor="secondary" sx={{ flexGrow: 1 }}>
            {SECTIONS.map((section) => (
              <Tab key={section.path} label={section.label} value={section.path} component={NavLink} to={section.path} />
            ))}
          </Tabs>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
