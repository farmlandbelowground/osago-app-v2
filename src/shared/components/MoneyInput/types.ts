export interface Props {
  onChange: (value: number | null) => void
  value: number | null
  isDisabled?: boolean
  placeholder?: string
}
