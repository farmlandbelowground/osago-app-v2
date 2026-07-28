export interface Props {
  // ± offset for the slider labels. Legacy derives this from the DCF total,
  // not from the enterprise value — see the note in DcfResultCard.
  band: number
  totalen: { waardeScenario: number; waardeRest: number; totaal: number }
}
