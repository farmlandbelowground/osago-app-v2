export type StartImpersonationResult =
  | { email: string; ok: true; tokenHash: string; type: string }
  | { error: string; ok: false }
