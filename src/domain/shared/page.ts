/** 1-based page request, as the API expects. */
export interface PageRequest {
  page: number
  pageSize: number
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}
