import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../application/errors/AppError'
import { jsonResponse, memoryTokenStorage, validSession } from '../../test/fakes'
import { ApiClient } from './ApiClient'

function setup(responses: Response[], onUnauthorized = vi.fn().mockResolvedValue(undefined)) {
  const tokenStorage = memoryTokenStorage(validSession('old-token'))
  const fetchMock = vi.fn<typeof fetch>()
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response))
  const api = new ApiClient({ baseUrl: '/api', tokenStorage, onUnauthorized, fetch: fetchMock })
  return { api, fetchMock, tokenStorage, onUnauthorized }
}

const headersOf = (call: Parameters<typeof fetch>) => call[1]?.headers as Headers

describe('ApiClient', () => {
  it('sends the access token and a JSON body', async () => {
    const { api, fetchMock } = setup([jsonResponse(201, { id: '1' })])

    await expect(api.post('/contacts', { name: 'Ana' })).resolves.toEqual({ id: '1' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/contacts')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"name":"Ana"}')
    expect(headersOf(fetchMock.mock.calls[0]).get('Authorization')).toBe('Bearer old-token')
    expect(headersOf(fetchMock.mock.calls[0]).get('Content-Type')).toBe('application/json')
  })

  it('builds the query string skipping empty values', async () => {
    const { api, fetchMock } = setup([jsonResponse(200, {})])

    await api.get('/contacts', { page: 2, search: '', isActive: false, isFavorite: undefined })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/contacts?page=2&isActive=false')
  })

  it('turns ProblemDetails into an AppError with the API message', async () => {
    const { api } = setup([jsonResponse(409, { title: 'Conflict', detail: 'Já existe um contato com este telefone.' })])

    const error = await api.post('/contacts', {}).catch((err: unknown) => err)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ status: 409, message: 'Já existe um contato com este telefone.' })
  })

  it('uses the first validation message when there is no detail', async () => {
    const { api } = setup([jsonResponse(400, { title: 'Invalid', errors: { '': ['Request body too large.'] } })])

    await expect(api.post('/imports', {})).rejects.toThrow('Request body too large.')
  })

  it('on 401 waits for a new login and retries the same request with the new token', async () => {
    const { fetchMock, tokenStorage } = setup([jsonResponse(401), jsonResponse(200, { ok: true })])
    // The "login" performed while the request waits stores a new token.
    const onUnauthorized = vi.fn(async () => tokenStorage.save(validSession('new-token')))
    const api = new ApiClient({ baseUrl: '/api', tokenStorage, onUnauthorized, fetch: fetchMock })

    await expect(api.put('/contacts/1', { name: 'Ana' })).resolves.toEqual({ ok: true })

    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1]?.body).toBe('{"name":"Ana"}')
    expect(headersOf(fetchMock.mock.calls[1]).get('Authorization')).toBe('Bearer new-token')
  })

  it('retries only once', async () => {
    const { api, onUnauthorized } = setup([jsonResponse(401), jsonResponse(401)])

    await expect(api.get('/contacts')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not ask for a new login on requests that are not authenticated', async () => {
    const { api, onUnauthorized, fetchMock } = setup([jsonResponse(401, { detail: 'E-mail ou senha inválidos.' })])

    await expect(api.post('/auth/login', {}, { authenticated: false })).rejects.toThrow('E-mail ou senha inválidos.')
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(headersOf(fetchMock.mock.calls[0]).has('Authorization')).toBe(false)
  })
})
