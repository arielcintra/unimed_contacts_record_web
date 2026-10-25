import type { Page, PageRequest } from '../../domain/shared/page'
import type { User, UserInput } from '../../domain/users/user'

/** Admin-only operations: the API answers 403 to common users. */
export interface UserRepository {
  search(search: string, page: PageRequest): Promise<Page<User>>
  create(input: UserInput): Promise<User>
  update(id: string, input: UserInput): Promise<User>
}
