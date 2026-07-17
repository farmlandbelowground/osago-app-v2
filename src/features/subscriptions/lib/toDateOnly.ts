const DATE_ONLY_LENGTH = 10

export const toDateOnly = (date: Date): string =>
  date.toISOString().slice(0, DATE_ONLY_LENGTH)
