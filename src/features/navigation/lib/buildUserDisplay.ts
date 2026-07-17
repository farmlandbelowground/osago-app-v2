export const buildInitials = (
  firstName: string | null,
  lastName: string | null,
): string => `${firstName?.[0] ?? '?'}${lastName?.[0] ?? '?'}`.toUpperCase()

export const buildDisplayName = (
  firstName: string | null,
  lastName: string | null,
  email: string,
): string => {
  const name = [firstName, lastName].filter(Boolean).join(' ')
  return name || email
}
