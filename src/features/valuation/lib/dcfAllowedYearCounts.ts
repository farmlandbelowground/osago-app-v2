import {
  DCF_MARKT_ONTWIKKELING_LOW_MAX,
  DCF_MARKT_ONTWIKKELING_MID,
  DCF_SCENARIO_YEAR_COUNTS_HIGH,
  DCF_SCENARIO_YEAR_COUNTS_MID,
  DCF_SCENARIO_YEAR_COUNTS_UNRESTRICTED,
} from '../constants/dcf'

// Ports legacy dcfNewAllowedYearCounts (osago-bundle.js:4753-4760): which
// scenario-year counts the customer may choose, given the Mijn-bedrijf
// "in ontwikkeling" slider. An unset/invalid value imposes no restriction.
export const dcfAllowedYearCounts = (
  bedrijfMarktOntwikkeling: number | null,
): readonly number[] => {
  if (
    bedrijfMarktOntwikkeling === null ||
    isNaN(bedrijfMarktOntwikkeling) ||
    bedrijfMarktOntwikkeling <= DCF_MARKT_ONTWIKKELING_LOW_MAX
  ) {
    return DCF_SCENARIO_YEAR_COUNTS_UNRESTRICTED
  }
  if (bedrijfMarktOntwikkeling === DCF_MARKT_ONTWIKKELING_MID) {
    return DCF_SCENARIO_YEAR_COUNTS_MID
  }
  return DCF_SCENARIO_YEAR_COUNTS_HIGH
}
