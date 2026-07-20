import { type ValueDriverDefinition } from '@features/valuation/constants/valueDrivers'

export interface Props {
  definition: ValueDriverDefinition
  onChange: (value: number) => void
  value: number | undefined
}
