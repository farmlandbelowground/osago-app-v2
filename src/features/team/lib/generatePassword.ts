import {
  PASSWORD_GEN_DIGITS,
  PASSWORD_GEN_LENGTH,
  PASSWORD_GEN_LOWER,
  PASSWORD_GEN_SYMBOLS,
  PASSWORD_GEN_UPPER,
} from '../constants'

const randInt = (max: number): number => {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] % max
}

// Ports legacy generatePassword (osago-bundle.js:3227): crypto-random, always
// includes at least one lower/upper/digit/symbol, ambiguity-safe charset.
export const generatePassword = (): string => {
  const all =
    PASSWORD_GEN_LOWER +
    PASSWORD_GEN_UPPER +
    PASSWORD_GEN_DIGITS +
    PASSWORD_GEN_SYMBOLS
  const pick = (set: string): string => set[randInt(set.length)]
  const chars = [
    pick(PASSWORD_GEN_LOWER),
    pick(PASSWORD_GEN_UPPER),
    pick(PASSWORD_GEN_DIGITS),
    pick(PASSWORD_GEN_SYMBOLS),
  ]

  while (chars.length < PASSWORD_GEN_LENGTH) {
    chars.push(pick(all))
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    const temp = chars[i]
    chars[i] = chars[j]
    chars[j] = temp
  }

  return chars.join('')
}
