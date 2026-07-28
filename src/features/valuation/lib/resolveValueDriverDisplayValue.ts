import {
  VD_PERCENTAGE_SLIDER_DEFAULT,
  type ValueDriverDefinition,
} from '../constants/valueDrivers'

const LABEL_MIDPOINT_DIVISOR = 2

// The value a value-driver slider is showing, including the fallback it renders
// when the question has no stored answer yet.
//
// Legacy's saveValueDrivers reads the DOM (osago-bundle.js:14513-14532), so it
// persists whatever every slider currently displays — all 27 questions, whether
// or not the customer touched them. v2 keeps answers in React state, where an
// untouched slider fires no change event and its key never exists, so the
// rendered fallback has to be materialised explicitly or the question is
// silently dropped and valueDriversComplete never turns true.
export const resolveValueDriverDisplayValue = (
  definition: ValueDriverDefinition,
  value: number | undefined,
): number => {
  if (value !== undefined) {
    return value
  }
  return definition.type === 'percentage_slider'
    ? VD_PERCENTAGE_SLIDER_DEFAULT
    : Math.floor((definition.labels?.length ?? 0) / LABEL_MIDPOINT_DIVISOR)
}
