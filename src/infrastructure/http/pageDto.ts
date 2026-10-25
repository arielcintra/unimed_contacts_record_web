import type { Page, PageRequest } from '../../domain/shared/page'

/** Paged response returned by the API (PagedResultDto). */
export interface PageDto<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export function toPage<TDto, T>(dto: PageDto<TDto>, map: (item: TDto) => T): Page<T> {
  return { ...dto, items: dto.items.map(map) }
}

export function pageQuery(page: PageRequest) {
  return { page: page.page, pageSize: page.pageSize }
}
