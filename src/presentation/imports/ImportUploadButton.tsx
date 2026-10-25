import UploadFileIcon from '@mui/icons-material/UploadFile'
import Button from '@mui/material/Button'
import { useRef, type ChangeEvent } from 'react'
import { errorMessage } from '../../application/errors/AppError'
import { useUploadImport } from '../../application/imports/useImports'
import { useNotify } from '../shared/NotificationProvider'

/** Sends the CSV; the API answers right away and processes the file in the background. */
export function ImportUploadButton() {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadImport()
  const notify = useNotify()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allows choosing the same file again (reprocessing).
    event.target.value = ''
    if (!file) return

    upload.mutate(file, {
      onSuccess: () => notify('Arquivo enviado. A importação está em processamento.'),
      onError: (error) => notify(errorMessage(error), 'error'),
    })
  }

  return (
    <>
      <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={handleChange} aria-label="Arquivo CSV" />
      <Button
        variant="contained"
        startIcon={<UploadFileIcon />}
        loading={upload.isPending}
        onClick={() => input.current?.click()}
      >
        Importar CSV
      </Button>
    </>
  )
}
