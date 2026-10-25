/** Admin: the account from the API configuration, the only one that manages users. */
export type UserRole = 'Admin' | 'Common'

export const USER_ROLES: readonly UserRole[] = ['Admin', 'Common']

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
}

/** Data typed by the admin. On update, a blank password keeps the current one. */
export interface UserInput {
  email: string
  password: string
}

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}
