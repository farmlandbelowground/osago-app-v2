import { type PreparationScreenId } from '@features/preparation'

import {
  FinancieleGegevensIcon,
  MijnBedrijfIcon,
  PresentatieIcon,
  ValueDriversIcon,
  WaardebepalingIcon,
  WaarderingsrapportIcon,
} from '../assets/icons'
import { type NavLink } from '../types'

// Maps a preparation-screen id → the icon component used in the sidebar,
// so the sidebar can render journey-order screens without duplicating the
// screen catalogue.
export const SCREEN_ICON: Record<
  PreparationScreenId,
  NavLink['icon']
> = {
  'financiele-gegevens': FinancieleGegevensIcon,
  'mijn-bedrijf': MijnBedrijfIcon,
  presentatie: PresentatieIcon,
  'value-drivers': ValueDriversIcon,
  waardebepaling: WaardebepalingIcon,
  waarderingsrapport: WaarderingsrapportIcon,
}
