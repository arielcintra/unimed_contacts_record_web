import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ContactFilters, ContactInput } from '../../domain/contacts/contact'
import type { PageRequest } from '../../domain/shared/page'
import { IMPORT_POLLING_INTERVAL_MS, useHasRunningImports } from '../imports/useImports'
import { queryKeys } from '../queryKeys'
import { useServices } from '../services'

const contactsKey = queryKeys.contacts

/**
 * Paged search; keeps the previous page on screen while the next one loads.
 * While a CSV import is running the list is refreshed periodically, so imported contacts show up
 * without any action from the user.
 */
export function useContacts(filters: ContactFilters, page: PageRequest) {
  const { contacts } = useServices()
  const importsRunning = useHasRunningImports()
  return useQuery({
    queryKey: [...contactsKey, filters, page],
    queryFn: () => contacts.search(filters, page),
    placeholderData: keepPreviousData,
    refetchInterval: importsRunning ? IMPORT_POLLING_INTERVAL_MS : false,
  })
}

/** Creates (no id) or updates (with id) a contact, then refreshes every contact listing. */
export function useSaveContact() {
  const { contacts } = useServices()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ContactInput }) =>
      id ? contacts.update(id, input) : contacts.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useSetFavorite() {
  const { contacts } = useServices()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) => contacts.setFavorite(id, favorite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useSetActive() {
  const { contacts } = useServices()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => contacts.setActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}
