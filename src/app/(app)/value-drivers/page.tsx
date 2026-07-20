import {
  ValueDriversForm,
  getCompanyValuationFields,
} from '@features/valuation'
import { requireSession } from '@shared/auth/session'

export default async function ValueDriversPage() {
  const session = await requireSession()
  const fields = await getCompanyValuationFields(session.user.id)

  return (
    <main className="main">
      <ValueDriversForm initialAnswers={fields?.valueDriverAnswers ?? {}} />
    </main>
  )
}
