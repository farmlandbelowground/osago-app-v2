import { getEmailTemplates, MailTemplateViewer } from '@features/mail-templates'
import { requireRole } from '@shared/auth/guards'

export default async function AdminMailTemplatesPage() {
  await requireRole('admin')

  const templates = await getEmailTemplates()

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Email templates</h1>
          <p className="desc" style={{ margin: '4px 0 0' }}>
            Overzicht van alle transactionele mails. Aanpassingen worden in de
            code doorgevoerd, niet via deze pagina.
          </p>
        </div>
      </div>
      <MailTemplateViewer templates={templates} />
    </main>
  )
}
