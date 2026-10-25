import Alert, { type AlertColor } from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Notify = (message: string, severity?: AlertColor) => void

const NotificationContext = createContext<Notify | null>(null)

/** Short feedback messages ("Contato salvo.") shown at the bottom of the screen. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{ message: string; severity: AlertColor } | null>(null)

  const notify = useCallback<Notify>((message, severity = 'success') => setNotification({ message, severity }), [])
  const close = () => setNotification(null)

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        open={notification !== null}
        autoHideDuration={4000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={close} severity={notification?.severity} variant="filled" sx={{ width: '100%' }}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with its provider
export function useNotify(): Notify {
  const notify = useContext(NotificationContext)
  if (!notify) throw new Error('useNotify must be used inside NotificationProvider.')
  return notify
}
