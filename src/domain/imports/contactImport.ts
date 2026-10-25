export type ImportStatus = 'Pending' | 'Processing' | 'Completed' | 'CompletedWithErrors' | 'Failed'

export type ImportRowErrorKind = 'Invalid' | 'Duplicate'

export interface ContactImport {
  id: string
  fileName: string
  status: ImportStatus
  totalRows: number
  importedRows: number
  duplicateRows: number
  invalidRows: number
  failureReason: string | null
  createdAt: Date
  startedAt: Date | null
  finishedAt: Date | null
}

export interface ImportRowError {
  lineNumber: number
  kind: ImportRowErrorKind
  content: string
  reason: string
}

/** Still being handled by the API: the client keeps polling while this is true. */
export function isImportRunning(status: ImportStatus): boolean {
  return status === 'Pending' || status === 'Processing'
}
