export interface Contact {
  id: string
  name: string
  email: string | null
  /** Digits only (DDD + number), as normalized by the API. */
  phone: string
  isFavorite: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/** Data typed by the user. Validation and normalization are done by the API, never duplicated here. */
export interface ContactInput {
  name: string
  email: string
  phone: string
}

export type ContactStatusFilter = 'active' | 'inactive' | 'all'

export interface ContactFilters {
  search: string
  status: ContactStatusFilter
  favoritesOnly: boolean
}
