import SearchIcon from '@mui/icons-material/Search'
import StarIcon from '@mui/icons-material/Star'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import type { ContactStatusFilter } from '../../domain/contacts/contact'

interface ContactsToolbarProps {
  search: string
  status: ContactStatusFilter
  favoritesOnly: boolean
  onSearchChange(search: string): void
  onStatusChange(status: ContactStatusFilter): void
  onFavoritesOnlyChange(favoritesOnly: boolean): void
}

export function ContactsToolbar(props: ContactsToolbarProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
      <TextField
        label="Buscar por nome, e-mail ou telefone"
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
        size="small"
        sx={{ flexGrow: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <ToggleButtonGroup
        value={props.status}
        exclusive
        size="small"
        aria-label="Status"
        onChange={(_, status: ContactStatusFilter | null) => status && props.onStatusChange(status)}
      >
        <ToggleButton value="active">Ativos</ToggleButton>
        <ToggleButton value="inactive">Inativos</ToggleButton>
        <ToggleButton value="all">Todos</ToggleButton>
      </ToggleButtonGroup>
      <Chip
        icon={<StarIcon />}
        label="Somente favoritos"
        color={props.favoritesOnly ? 'warning' : 'default'}
        variant={props.favoritesOnly ? 'filled' : 'outlined'}
        onClick={() => props.onFavoritesOnlyChange(!props.favoritesOnly)}
        aria-pressed={props.favoritesOnly}
      />
    </Stack>
  )
}
