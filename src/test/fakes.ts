import { vi } from 'vitest'
import { SessionExpiry } from '../application/auth/SessionExpiry'
import type { AuthGateway } from '../application/ports/AuthGateway'
import type { ContactRepository } from '../application/ports/ContactRepository'
import type { ImportRepository } from '../application/ports/ImportRepository'
import type { TokenStorage } from '../application/ports/TokenStorage'
import type { Services } from '../application/services'
import type { Session } from '../domain/auth/session'
import type { Contact } from '../domain/contacts/contact'
import type { ContactImport } from '../domain/imports/contactImport'
import type { Page } from '../domain/shared/page'

export const validSession = (accessToken = 'token'): Session => ({
  accessToken,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
})

export function pageOf<T>(items: T[], totalCount = items.length): Page<T> {
  return { items, page: 1, pageSize: 10, totalCount }
}

export function aContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: crypto.randomUUID(),
    name: 'Ana Silva',
    email: 'ana@example.com',
    phone: '11987654321',
    isFavorite: false,
    isActive: true,
    createdAt: new Date('2026-10-25T12:00:00Z'),
    updatedAt: new Date('2026-10-25T12:00:00Z'),
    ...overrides,
  }
}

export function aContactImport(overrides: Partial<ContactImport> = {}): ContactImport {
  return {
    id: crypto.randomUUID(),
    fileName: 'contatos.csv',
    status: 'Completed',
    totalRows: 3,
    importedRows: 3,
    duplicateRows: 0,
    invalidRows: 0,
    failureReason: null,
    createdAt: new Date('2026-10-25T12:00:00Z'),
    startedAt: new Date('2026-10-25T12:00:01Z'),
    finishedAt: new Date('2026-10-25T12:00:02Z'),
    ...overrides,
  }
}

export function memoryTokenStorage(initial: Session | null = validSession()): TokenStorage {
  let session = initial
  return {
    get: () => session,
    save: (value) => {
      session = value
    },
    clear: () => {
      session = null
    },
  }
}

export function fakeContactRepository(): ContactRepository {
  return {
    search: vi.fn<ContactRepository['search']>().mockResolvedValue(pageOf([])),
    create: vi.fn<ContactRepository['create']>(),
    update: vi.fn<ContactRepository['update']>(),
    setActive: vi.fn<ContactRepository['setActive']>(),
    setFavorite: vi.fn<ContactRepository['setFavorite']>(),
  }
}

export function fakeImportRepository(): ImportRepository {
  return {
    upload: vi.fn<ImportRepository['upload']>(),
    list: vi.fn<ImportRepository['list']>().mockResolvedValue(pageOf([])),
    errors: vi.fn<ImportRepository['errors']>().mockResolvedValue(pageOf([])),
  }
}

/** Services with in-memory fakes; the user starts logged in unless tokenStorage says otherwise. */
export function fakeServices(overrides: Partial<Services> = {}): Services {
  return {
    contacts: fakeContactRepository(),
    imports: fakeImportRepository(),
    auth: { login: vi.fn<AuthGateway['login']>().mockResolvedValue(validSession('new-token')) },
    tokenStorage: memoryTokenStorage(),
    sessionExpiry: new SessionExpiry(),
    ...overrides,
  }
}

export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
