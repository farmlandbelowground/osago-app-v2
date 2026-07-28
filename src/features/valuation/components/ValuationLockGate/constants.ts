import { type CSSProperties } from 'react'

export const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'center',
}

// The four overlay copies (osago-bundle.js:15081-15106).
export const DEFAULT_TITLE = 'Waardering nog niet gemaakt'
export const DEFAULT_BODY =
  'Klik hieronder om jouw indicatieve waardebepaling vast te leggen. Daarna verschijnen de waardes en kun je het PDF-rapport downloaden.'

export const SUBMITTED_TITLE = 'Wacht op vrijschakeling'
export const SUBMITTED_BODY =
  'Een Osago-medewerker controleert jouw indicatieve waardebepaling en schakelt deze vrij — je krijgt dan automatisch bericht.'

export const APPROVED_TITLE = 'Waardering nog niet vastgelegd'
export const APPROVED_BODY =
  'Een Osago-medewerker heeft jouw waardebepaling goedgekeurd. Klik hieronder om deze definitief vast te leggen.'

export const REVIEW_TITLE = 'Indienen ter controle'
export const REVIEW_BODY =
  'Bij het Waardebepaling Premium-pakket controleert een Osago-medewerker eerst jouw indicatieve waardering. Dien het materiaal hieronder in ter controle.'
