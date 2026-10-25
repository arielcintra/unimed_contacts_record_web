import { describe, expect, it, vi } from 'vitest'
import type { ContactFilters } from '../../domain/contacts/contact'
import { jsonResponse, memoryTokenStorage } from '../../test/fakes'
import { ApiClient } from '../http/ApiClient'
import { HttpContactRepository } from './HttpContactRepository'

const contactDto = {
  id: '1',
  name: 'Ana',
  email: null,
  phone: '11987654321',
  isFavorite: false,
  isActive: true,
  createdAt: '2026-10-25T12:00:00Z',
  updatedAt: '2026-10-25T13:00:00Z',
}

function setup(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  const api = new ApiClient({ baseUrl: '/api', tokenStorage: memoryTokenStorage(), onUnauthorized: vi.fn(), fetch: fetchMock })
  return { repository: new HttpContactRepository(api), fetchMock }
}

const filters = (overrides: Partial<ContactFilters> = {}): ContactFilters => ({
  search: '',
  status: 'all',
  favoritesOnly: false,
  ...overrides,
})

describe('HttpContactRepository', () => {
  it.each([
    [filters(), '/api/contacts?page=1&pageSize=10'],
    [filters({ status: 'active' }), '/api/contacts?page=1&pageSize=10&isActive=true'],
    [filters({ status: 'inactive', favoritesOnly: true }), '/api/contacts?page=1&pageSize=10&isActive=false&isFavorite=true'],
    [filters({ search: 'ana' }), '/api/contacts?page=1&pageSize=10&search=ana'],
  ])('translates filters into the API query string', async (contactFilters, expectedUrl) => {
    const { repository, fetchMock } = setup(jsonResponse(200, { items: [], page: 1, pageSize: 10, totalCount: 0 }))

    await repository.search(contactFilters, { page: 1, pageSize: 10 })

    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl)
  })

  it('maps the API response to domain objects', async () => {
    const { repository } = setup(jsonResponse(200, { items: [contactDto], page: 1, pageSize: 10, totalCount: 1 }))

    const page = await repository.search(filters(), { page: 1, pageSize: 10 })

    expect(page.totalCount).toBe(1)
    expect(page.items[0].updatedAt).toEqual(new Date('2026-10-25T13:00:00Z'))
  })

  it.each([
    [true, 'PUT'],
    [false, 'DELETE'],
  ])('favorite=%s uses %s on the favorite resource', async (favorite, method) => {
    const { repository, fetchMock } = setup(jsonResponse(200, contactDto))

    await repository.setFavorite('1', favorite)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/contacts/1/favorite')
    expect(fetchMock.mock.calls[0][1]?.method).toBe(method)
  })

  it.each([
    [true, '/api/contacts/1/activate'],
    [false, '/api/contacts/1/deactivate'],
  ])('active=%s calls %s', async (active, url) => {
    const { repository, fetchMock } = setup(jsonResponse(200, contactDto))

    await repository.setActive('1', active)

    expect(fetchMock.mock.calls[0][0]).toBe(url)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH')
  })
})
