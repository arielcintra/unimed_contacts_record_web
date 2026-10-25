/** Cache keys shared by the use cases (an import can refresh the contacts, for example). */
export const queryKeys = {
  contacts: ['contacts'] as const,
  imports: ['imports'] as const,
  users: ['users'] as const,
}
