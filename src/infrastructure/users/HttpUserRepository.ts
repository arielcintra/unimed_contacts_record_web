import type { UserRepository } from '../../application/ports/UserRepository'
import type { Page, PageRequest } from '../../domain/shared/page'
import type { User, UserInput, UserRole } from '../../domain/users/user'
import type { ApiClient } from '../http/ApiClient'
import { pageQuery, toPage, type PageDto } from '../http/pageDto'
import { toDate } from '../http/toDate'

/** UserOutputDto returned by the API. */
interface UserDto {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

const toUser = (dto: UserDto): User => ({ ...dto, createdAt: toDate(dto.createdAt) })

// Sent as typed: the API normalizes the e-mail and validates both fields.
const toInputDto = (input: UserInput) => ({ email: input.email, password: input.password })

export class HttpUserRepository implements UserRepository {
  private readonly api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  async search(search: string, page: PageRequest): Promise<Page<User>> {
    const dto = await this.api.get<PageDto<UserDto>>('/users', { ...pageQuery(page), search })
    return toPage(dto, toUser)
  }

  async create(input: UserInput): Promise<User> {
    return toUser(await this.api.post<UserDto>('/users', toInputDto(input)))
  }

  async update(id: string, input: UserInput): Promise<User> {
    return toUser(await this.api.put<UserDto>(`/users/${id}`, toInputDto(input)))
  }
}
