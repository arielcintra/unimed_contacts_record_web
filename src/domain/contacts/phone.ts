/**
 * Display-only formatting of the digits stored by the API: "11987654321" → "(11) 98765-4321".
 * Not a validation rule: anything unexpected is shown as is.
 */
export function formatPhone(digits: string): string {
  const match =
    digits.length === 11
      ? /^(\d{2})(\d{5})(\d{4})$/.exec(digits)
      : digits.length === 10
        ? /^(\d{2})(\d{4})(\d{4})$/.exec(digits)
        : null

  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits
}
