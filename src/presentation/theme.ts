import { createTheme } from '@mui/material/styles'
import { ptBR } from '@mui/material/locale'

/** Unimed brand palette (to be checked against the official brand manual). */
const unimed = {
  green: '#00995D',
  darkGreen: '#0A5F55',
  lightGreen: '#B1D34B',
  orange: '#F47920',
}

// ptBR translates built-in texts such as the table pagination labels.
export const theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: { main: unimed.green, dark: unimed.darkGreen, contrastText: '#FFFFFF' },
      secondary: { main: unimed.lightGreen, contrastText: unimed.darkGreen },
      success: { main: unimed.green, dark: unimed.darkGreen, contrastText: '#FFFFFF' },
      warning: { main: unimed.orange, contrastText: '#FFFFFF' },
      background: { default: '#F5F7F6' },
    },
    shape: { borderRadius: 8 },
  },
  ptBR,
)
