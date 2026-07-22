import { getServerClient } from '@shared/supabase/server'

import { APP_CONFIG_EMAIL_TEMPLATES_KEY } from './constants'
import { EmailTemplatesArraySchema, type EmailTemplate } from './schema'

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', APP_CONFIG_EMAIL_TEMPLATES_KEY)
    .maybeSingle()

  if (error || !data) {
    return []
  }

  const result = EmailTemplatesArraySchema.safeParse(data.value)

  return result.success ? result.data : []
}
