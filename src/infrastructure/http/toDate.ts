/** ISO-8601 strings sent by the API → Date. */
export function toDate(value: string): Date
export function toDate(value: string | null): Date | null
export function toDate(value: string | null): Date | null {
  return value === null ? null : new Date(value)
}
