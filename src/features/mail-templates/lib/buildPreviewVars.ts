import { type EmailTemplate } from '../schema'

// Ports buildPreviewVars (osago-bundle.js:27112): map each availableVar name to
// its sample value, for the live preview.
export const buildPreviewVars = (
  template: EmailTemplate,
): Record<string, string> => {
  const out: Record<string, string> = {}

  for (const variable of template.availableVars) {
    out[variable.name] = variable.sample
  }

  return out
}
