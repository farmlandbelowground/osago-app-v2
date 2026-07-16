import { z } from 'zod'

import { PASSWORD_MIN_LENGTH, TWO_FACTOR_CODE_LENGTH } from './constants'

const stripPhoneFormatting = (value: string): string =>
  value.replace(/[\s\-()]/g, '')

export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Minimaal ${PASSWORD_MIN_LENGTH} tekens.`)
  .refine(value => /[a-zA-Z]/.test(value), { error: 'Minimaal 1 letter.' })
  .refine(value => /[0-9]/.test(value), { error: 'Minimaal 1 cijfer.' })
  .refine(value => /[^a-zA-Z0-9\s]/.test(value), {
    error: 'Minimaal 1 symbool.',
  })

export const PhoneSchema = z
  .string()
  .min(1, 'Vul een telefoonnummer in.')
  .refine(value => /^\+?\d{6,15}$/.test(stripPhoneFormatting(value)), {
    error:
      'Gebruik het internationale formaat, bijvoorbeeld +31 6 1234 5678.',
  })

export const LoginSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
  password: z.string().min(1, 'Vul je wachtwoord in.'),
  turnstileToken: z.string().min(1, 'Bevestig dat je geen robot bent.'),
})

export type LoginInput = z.infer<typeof LoginSchema>

export const RegisterSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
  firstName: z.string().min(1, 'Vul je voornaam in.'),
  lastName: z.string().min(1, 'Vul je achternaam in.'),
  password: PasswordSchema,
  phone: PhoneSchema,
  turnstileToken: z.string().min(1, 'Bevestig dat je geen robot bent.'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>

export const TwoFactorCodeSchema = z.object({
  code: z
    .string()
    .regex(
      new RegExp(`^[0-9]{${TWO_FACTOR_CODE_LENGTH}}$`),
      'Vul de 6-cijferige code in.',
    ),
})

export type TwoFactorCodeInput = z.infer<typeof TwoFactorCodeSchema>

export const PhoneRequiredSchema = z.object({
  phone: PhoneSchema,
})

export type PhoneRequiredInput = z.infer<typeof PhoneRequiredSchema>

export const ForgotPasswordSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Bevestig je nieuwe wachtwoord.'),
    password: PasswordSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    error: 'De twee wachtwoorden komen niet overeen.',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

// ─── /api/* response contracts (frozen backend — see migration-plan.md §1.1) ───

export const TurnstileVerifyResponseSchema = z.object({
  challenge_ts: z.string().optional(),
  error: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
  hostname: z.string().optional(),
  reason: z.string().optional(),
  score: z.number().nullable().optional(),
  skipped: z.boolean().optional(),
  success: z.boolean(),
})

export const TwoFactorSendResponseSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  ok: z.boolean(),
  phoneMasked: z.string().optional(),
  simulated: z.boolean().optional(),
})

export const TwoFactorVerifyResponseSchema = z.object({
  error: z.string().optional(),
  ok: z.boolean(),
  simulated: z.boolean().optional(),
})

export const UpdatePhoneResponseSchema = z.object({
  error: z.string().optional(),
  ok: z.boolean(),
  phone: z.string().optional(),
})

export const PasswordResetResponseSchema = z.object({
  ok: z.literal(true),
})
