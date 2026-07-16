'use server'

import { redirect } from 'next/navigation'
import { type ZodType } from 'zod'

import { env } from '@/env'
import { getServerClient, getServiceRoleClient } from '@shared/supabase/server'

import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  PASSWORD_RESET_ENDPOINT,
  TURNSTILE_VERIFY_ENDPOINT,
  TWO_FACTOR_SEND_ENDPOINT,
  TWO_FACTOR_UPDATE_PHONE_ENDPOINT,
  TWO_FACTOR_VERIFY_ENDPOINT,
} from './constants'
import {
  ForgotPasswordSchema,
  LoginSchema,
  PasswordResetResponseSchema,
  PhoneRequiredSchema,
  RegisterSchema,
  TurnstileVerifyResponseSchema,
  TwoFactorCodeSchema,
  TwoFactorSendResponseSchema,
  TwoFactorVerifyResponseSchema,
  UpdatePhoneResponseSchema,
} from './schema'
import {
  type AuthFlowState,
  type ForgotPasswordState,
  type VerifyCodeState,
  type VerifyEmailState,
} from './types'

const getBearerHeader = async (): Promise<Record<string, string>> => {
  const supabase = await getServerClient()
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const postJson = async (
  path: string,
  body: unknown,
  withAuth: boolean,
): Promise<Response | null> => {
  const authHeader = withAuth ? await getBearerHeader() : {}

  return fetch(`${env.APP_URL}${path}`, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...authHeader },
    method: 'POST',
  }).catch(() => null)
}

// The frozen 2FA/signup endpoints pack meaningful outcomes (e.g. phone_missing,
// invalid_phone_format) into non-2xx bodies, so parsing must not gate on
// response.ok the way the shared apiFetch helper does.
const parseAuthApiResponse = async <T>(
  response: Response,
  schema: ZodType<T>,
): Promise<T | null> => {
  const json: unknown = await response.json().catch(() => null)
  const result = schema.safeParse(json)

  return result.success ? result.data : null
}

const verifyTurnstileToken = async (token: string): Promise<boolean> => {
  const response = await postJson(TURNSTILE_VERIFY_ENDPOINT, { token }, false)

  if (!response) {
    return true
  }

  const result = await parseAuthApiResponse(
    response,
    TurnstileVerifyResponseSchema,
  )

  return result ? result.success : true
}

export const sendTwoFactorCode = async (): Promise<AuthFlowState> => {
  const response = await postJson(TWO_FACTOR_SEND_ENDPOINT, {}, true)
  const result = response
    ? await parseAuthApiResponse(response, TwoFactorSendResponseSchema)
    : null

  if (!result) {
    return {
      error:
        'We konden geen SMS-code versturen. Probeer het over een minuut opnieuw.',
      status: 'error',
    }
  }

  if (result.ok) {
    return { phoneMasked: result.phoneMasked ?? null, status: 'twofa' }
  }

  if (result.error === 'phone_missing') {
    return { status: 'phone-required' }
  }

  return {
    error:
      'We konden geen SMS-code versturen. Probeer het over een minuut opnieuw.',
    status: 'error',
  }
}

export const login = async (
  _prevState: AuthFlowState,
  formData: FormData,
): Promise<AuthFlowState> => {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      error: 'Vul een geldig e-mailadres en wachtwoord in.',
      status: 'error',
    }
  }

  const isHuman = await verifyTurnstileToken(parsed.data.turnstileToken)

  if (!isHuman) {
    return { error: 'Bot-verificatie mislukt. Probeer opnieuw.', status: 'error' }
  }

  const supabase = await getServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      error: 'Onjuiste inloggegevens. Probeer het opnieuw.',
      status: 'error',
    }
  }

  return sendTwoFactorCode()
}

export const register = async (
  _prevState: AuthFlowState,
  formData: FormData,
): Promise<AuthFlowState> => {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: 'Controleer de ingevulde gegevens.', status: 'error' }
  }

  const isHuman = await verifyTurnstileToken(parsed.data.turnstileToken)

  if (!isHuman) {
    return { error: 'Bot-verificatie mislukt. Probeer opnieuw.', status: 'error' }
  }

  const { email, firstName, lastName, password, phone } = parsed.data

  const serviceRoleClient = getServiceRoleClient()
  const { data: signupData, error: signupError } =
    await serviceRoleClient.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'customer',
      },
    })

  if (signupError || !signupData.user) {
    return {
      error:
        signupError?.message ?? 'Er ging iets mis bij het aanmaken van je account.',
      status: 'error',
    }
  }

  await serviceRoleClient
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName, phone })
    .eq('id', signupData.user.id)

  const supabase = await getServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error:
        'Account aangemaakt, maar inloggen is mislukt. Probeer in te loggen.',
      status: 'error',
    }
  }

  return sendTwoFactorCode()
}

export const verifyTwoFactorCode = async (
  _prevState: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> => {
  const parsed = TwoFactorCodeSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      error: 'Vul de 6-cijferige code uit de SMS in.',
      status: 'error',
    }
  }

  const response = await postJson(
    TWO_FACTOR_VERIFY_ENDPOINT,
    { code: parsed.data.code },
    true,
  )
  const result = response
    ? await parseAuthApiResponse(response, TwoFactorVerifyResponseSchema)
    : null

  if (!result) {
    return {
      error: 'Er ging iets mis. Controleer je verbinding en probeer het opnieuw.',
      status: 'error',
    }
  }

  if (!result.ok) {
    const message =
      result.error === 'invalid_code'
        ? 'Onjuiste of verlopen code. Probeer opnieuw of vraag een nieuwe SMS aan.'
        : 'Verifiëren mislukt. Probeer het opnieuw of neem contact op met Osago.'

    return { error: message, status: 'error' }
  }

  redirect(DASHBOARD_PATH)
}

export const updatePhoneAndResendCode = async (
  _prevState: AuthFlowState,
  formData: FormData,
): Promise<AuthFlowState> => {
  const parsed = PhoneRequiredSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      error: 'Vul een geldig mobiel telefoonnummer in.',
      status: 'phone-required',
    }
  }

  const response = await postJson(
    TWO_FACTOR_UPDATE_PHONE_ENDPOINT,
    { phone: parsed.data.phone },
    true,
  )
  const result = response
    ? await parseAuthApiResponse(response, UpdatePhoneResponseSchema)
    : null

  if (!result) {
    return {
      error: 'Opslaan van het telefoonnummer is mislukt. Probeer het opnieuw.',
      status: 'phone-required',
    }
  }

  if (!result.ok) {
    const message =
      result.error === 'invalid_phone_format'
        ? 'Dit lijkt geen geldig telefoonnummer. Gebruik het internationaal formaat, bijvoorbeeld +31 6 1234 5678.'
        : 'Opslaan van het telefoonnummer is mislukt. Probeer het opnieuw.'

    return { error: message, status: 'phone-required' }
  }

  return sendTwoFactorCode()
}

export const cancelTwoFactor = async (): Promise<never> => {
  const supabase = await getServerClient()
  await supabase.auth.signOut()
  redirect(LOGIN_PATH)
}

export const requestPasswordReset = async (
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> => {
  const parsed = ForgotPasswordSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: 'Vul een geldig e-mailadres in.', status: 'error' }
  }

  const response = await postJson(
    PASSWORD_RESET_ENDPOINT,
    { email: parsed.data.email },
    false,
  )
  const result = response
    ? await parseAuthApiResponse(response, PasswordResetResponseSchema)
    : null

  if (!result) {
    return {
      error: 'Er ging iets mis. Controleer je verbinding en probeer het opnieuw.',
      status: 'error',
    }
  }

  return { status: 'sent' }
}

export const verifyEmailCode = async (
  _prevState: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> => {
  const parsed = TwoFactorCodeSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: 'Vul de 6-cijferige code in.', status: 'error' }
  }

  return {
    message: 'E-mailverificatie is momenteel niet beschikbaar.',
    status: 'unavailable',
  }
}
