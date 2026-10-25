import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { isImportRunning, type ContactImport, type ImportRowErrorKind } from '../../domain/imports/contactImport'
import type { Page, PageRequest } from '../../domain/shared/page'
import { queryKeys } from '../queryKeys'
import { useServices } from '../services'

export const IMPORT_POLLING_INTERVAL_MS = 2000

/** Imports still running are always the most recent ones, so the first page is enough to detect them. */
const RECENT_IMPORTS: PageRequest = { page: 1, pageSize: 20 }

const importsKey = queryKeys.imports

/** Keeps polling while any import on the page is still being processed by the API. */
export function importsPollingInterval(page: Page<ContactImport> | undefined): number | false {
  return page?.items.some((item) => isImportRunning(item.status)) ? IMPORT_POLLING_INTERVAL_MS : false
}

export function runningImportIds(page: Page<ContactImport>): Set<string> {
  return new Set(page.items.filter((item) => isImportRunning(item.status)).map((item) => item.id))
}

/** True when an import that was running before is no longer running now. */
export function hasImportFinished(previouslyRunning: Set<string>, nowRunning: Set<string>): boolean {
  return [...previouslyRunning].some((id) => !nowRunning.has(id))
}

/**
 * Import list with polling. When an import finishes, every cached contact list is marked as stale,
 * so imported contacts are fetched again instead of an old list being shown.
 */
function usePolledImports(page: PageRequest) {
  const { imports } = useServices()
  const queryClient = useQueryClient()
  const running = useRef<Set<string>>(new Set())

  const query = useQuery({
    queryKey: [...importsKey, page],
    queryFn: () => imports.list(page),
    placeholderData: keepPreviousData,
    refetchInterval: (current) => importsPollingInterval(current.state.data),
  })

  useEffect(() => {
    if (!query.data) return
    const nowRunning = runningImportIds(query.data)
    if (hasImportFinished(running.current, nowRunning)) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    }
    running.current = nowRunning
  }, [query.data, queryClient])

  return query
}

export function useImports(page: PageRequest) {
  return usePolledImports(page)
}

/** Whether an import is being processed; shared cache, so several screens cause a single request. */
export function useHasRunningImports(): boolean {
  const { data } = usePolledImports(RECENT_IMPORTS)
  return importsPollingInterval(data) !== false
}

export function useUploadImport() {
  const { imports } = useServices()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => imports.upload(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: importsKey }),
  })
}

/** Rows not imported; refreshed while the import is still running, since new errors keep arriving. */
export function useImportErrors(
  contactImport: ContactImport,
  kind: ImportRowErrorKind | null,
  page: PageRequest,
) {
  const { imports } = useServices()
  return useQuery({
    queryKey: [...importsKey, contactImport.id, 'errors', kind, page],
    queryFn: () => imports.errors(contactImport.id, kind, page),
    placeholderData: keepPreviousData,
    refetchInterval: isImportRunning(contactImport.status) ? IMPORT_POLLING_INTERVAL_MS : false,
  })
}
