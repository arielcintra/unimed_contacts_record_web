import type { PageRequest } from '../../domain/shared/page'

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50]

/** MUI's TablePagination counts pages from 0; the API counts from 1. */
export function toPageRequest(muiPage: number, rowsPerPage: number): PageRequest {
  return { page: muiPage + 1, pageSize: rowsPerPage }
}
