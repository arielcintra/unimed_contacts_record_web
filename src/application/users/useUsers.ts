import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageRequest } from '../../domain/shared/page'
import type { UserInput } from '../../domain/users/user'
import { queryKeys } from '../queryKeys'
import { useServices } from '../services'

const usersKey = queryKeys.users

/** Paged search by e-mail; keeps the previous page on screen while the next one loads. */
export function useUsers(search: string, page: PageRequest) {
  const { users } = useServices()
  return useQuery({
    queryKey: [...usersKey, search, page],
    queryFn: () => users.search(search, page),
    placeholderData: keepPreviousData,
  })
}

/** Creates (no id) or updates (with id) a user, then refreshes every user listing. */
export function useSaveUser() {
  const { users } = useServices()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: UserInput }) =>
      id ? users.update(id, input) : users.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  })
}
