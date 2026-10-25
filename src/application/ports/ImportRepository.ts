import type { ContactImport, ImportRowError, ImportRowErrorKind } from '../../domain/imports/contactImport'
import type { Page, PageRequest } from '../../domain/shared/page'

export interface ImportRepository {
  upload(file: File): Promise<ContactImport>
  list(page: PageRequest): Promise<Page<ContactImport>>
  errors(importId: string, kind: ImportRowErrorKind | null, page: PageRequest): Promise<Page<ImportRowError>>
}
