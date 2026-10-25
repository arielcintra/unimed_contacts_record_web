import type { Contact, ContactFilters, ContactInput } from '../../domain/contacts/contact'
import type { Page, PageRequest } from '../../domain/shared/page'

export interface ContactRepository {
  search(filters: ContactFilters, page: PageRequest): Promise<Page<Contact>>
  create(input: ContactInput): Promise<Contact>
  update(id: string, input: ContactInput): Promise<Contact>
  setActive(id: string, active: boolean): Promise<Contact>
  setFavorite(id: string, favorite: boolean): Promise<Contact>
}
