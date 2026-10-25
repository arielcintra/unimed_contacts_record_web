import type { AuthGateway } from '../../application/ports/AuthGateway'
import type { Credentials, Session } from '../../domain/auth/session'
import type { ApiClient } from '../http/ApiClient'
import { toDate } from '../http/toDate'

/** LoginOutputDto returned by the API. */
interface LoginDto {
  accessToken: string
  expiresAt: string
}

export class HttpAuthGateway implements AuthGateway {
  private readonly api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  async login(credentials: Credentials): Promise<Session> {
    const dto = await this.api.post<LoginDto>('/auth/login', credentials, { authenticated: false })
    return { accessToken: dto.accessToken, expiresAt: toDate(dto.expiresAt) }
  }
}
