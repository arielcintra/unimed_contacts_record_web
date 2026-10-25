import type { ContactRepository } from '../../application/ports/ContactRepository'
import type { Contact, ContactFilters, ContactInput } from '../../domain/contacts/contact'
import type { Page, PageRequest } from '../../domain/shared/page'
import type { ApiClient } from '../http/ApiClient'
import { pageQuery, toPage, type PageDto } from '../http/pageDto'
import { toDate } from '../http/toDate'

/** ContactOutputDto returned by the API. */
interface ContactDto {
  id: string
  name: string
  email: string | null
  phone: string
  isFavorite: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const toContact = (dto: ContactDto): Contact => ({
  ...dto,
  createdAt: toDate(dto.createdAt),
  updatedAt: toDate(dto.updatedAt),
})

// Sent as typed: the API trims, normalizes and validates (single source of rules).
const toInputDto = (input: ContactInput) => ({ name: input.name, email: input.email, phone: input.phone })

export class HttpContactRepository implements ContactRepository {
  private readonly api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  async search(filters: ContactFilters, page: PageRequest): Promise<Page<Contact>> {
    const dto = await this.api.get<PageDto<ContactDto>>('/contacts', {
      ...pageQuery(page),
      search: filters.search,
      isActive: filters.status === 'all' ? undefined : filters.status === 'active',
      isFavorite: filters.favoritesOnly ? true : undefined,
    })
    return toPage(dto, toContact)
  }

  async create(input: ContactInput): Promise<Contact> {
    return toContact(await this.api.post<ContactDto>('/contacts', toInputDto(input)))
  }

  async update(id: string, input: ContactInput): Promise<Contact> {
    return toContact(await this.api.put<ContactDto>(`/contacts/${id}`, toInputDto(input)))
  }

  async setActive(id: string, active: boolean): Promise<Contact> {
    return toContact(await this.api.patch<ContactDto>(`/contacts/${id}/${active ? 'activate' : 'deactivate'}`))
  }

  async setFavorite(id: string, favorite: boolean): Promise<Contact> {
    const path = `/contacts/${id}/favorite`
    return toContact(await (favorite ? this.api.put<ContactDto>(path) : this.api.delete<ContactDto>(path)))
  }
}
