import { type FC } from 'react'

import { DocumentSection } from '../DocumentSection'
import { type Props } from './types'

// Ports the two source sections of renderDocumentsVault (osago-bundle.js:6770-6797).
// Copy is verbatim per spec §3.7.
export const DocumentVaultSections: FC<Props> = ({
  adminDocuments,
  selfGeneratedDocuments,
}) => {
  return (
    <>
      <DocumentSection
        documents={adminDocuments}
        emptyMessage="Jouw Osago-adviseur heeft nog geen documenten aan jouw dossier toegevoegd."
        metaLabel="Toegevoegd op"
        subtitle="Documenten die door jouw Osago-adviseur aan jouw dossier zijn toegevoegd."
        title="Toegevoegd door Osago"
      />

      <DocumentSection
        documents={selfGeneratedDocuments}
        emptyMessage={
          'Je hebt nog geen documenten via de Osago app gegenereerd. Gebruik bijvoorbeeld de "Genereer NDA"-functie op de Verkoopproces-pagina.'
        }
        metaLabel="Gegenereerd op"
        subtitle="Documenten die je via de Osago app heeft gegenereerd en gedownload, zoals NDA’s en rapporten."
        title="Door uzelf gegenereerd"
      />
    </>
  )
}
