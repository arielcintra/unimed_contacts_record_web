import Chip, { type ChipProps } from '@mui/material/Chip'
import type { ImportStatus } from '../../domain/imports/contactImport'

const APPEARANCE: Record<ImportStatus, { label: string; color: ChipProps['color'] }> = {
  Pending: { label: 'Na fila', color: 'default' },
  Processing: { label: 'Processando', color: 'info' },
  Completed: { label: 'Concluída', color: 'success' },
  CompletedWithErrors: { label: 'Concluída com erros', color: 'warning' },
  Failed: { label: 'Falhou', color: 'error' },
}

export function ImportStatusChip({ status }: { status: ImportStatus }) {
  const { label, color } = APPEARANCE[status]
  return <Chip size="small" label={label} color={color} />
}
