import { create } from 'zustand'

import { type ValuationBandStore } from './types'

export const useValuationBandStore = create<ValuationBandStore>(set => ({
  band: null,
  setBand: band => set({ band }),
}))
