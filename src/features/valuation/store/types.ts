export interface ValuationBandStore {
  // null = no local edit in progress; consumers fall back to the server value.
  band: number | null
  setBand: (band: number | null) => void
}
