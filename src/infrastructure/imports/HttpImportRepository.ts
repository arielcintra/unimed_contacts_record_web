import type { ImportRepository } from '../../application/ports/ImportRepository'
import type {
  ContactImport,
  ImportRowError,
  ImportRowErrorKind,
  ImportStatus,
} from '../../domain/imports/contactImport'
import type { Page, PageRequest } from '../../domain/shared/page'
import type { ApiClient } from '../http/ApiClient'
import { pageQuery, toPage, type PageDto } from '../http/pageDto'
import { toDate } from '../http/toDate'

/** ContactImportOutputDto returned by the API. */
interface ContactImportDto {
  id: string
  fileName: string
  status: ImportStatus
  totalRows: number
  importedRows: number
  duplicateRows: number
  invalidRows: number
  failureReason: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

const toContactImport = (dto: ContactImportDto): ContactImport => ({
  ...dto,
  createdAt: toDate(dto.createdAt),
  startedAt: toDate(dto.startedAt),
  finishedAt: toDate(dto.finishedAt),
})

export class HttpImportRepository implements ImportRepository {
  private readonly api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  async upload(file: File): Promise<ContactImport> {
    const form = new FormData()
    form.append('file', file)
    return toContactImport(await this.api.post<ContactImportDto>('/imports', form))
  }

  async list(page: PageRequest): Promise<Page<ContactImport>> {
    return toPage(await this.api.get<PageDto<ContactImportDto>>('/imports', pageQuery(page)), toContactImport)
  }

  async errors(importId: string, kind: ImportRowErrorKind | null, page: PageRequest): Promise<Page<ImportRowError>> {
    const dto = await this.api.get<PageDto<ImportRowError>>(`/imports/${importId}/errors`, { ...pageQuery(page), kind })
    return toPage(dto, (error) => error)
  }
}
