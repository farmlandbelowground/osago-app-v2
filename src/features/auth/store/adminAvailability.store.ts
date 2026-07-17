import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ADMIN_AVAILABILITY_STORAGE_KEY } from '../constants'
import { type AdminAvailabilityStore } from './types'

export const useAdminAvailabilityStore = create<AdminAvailabilityStore>()(
  persist(
    set => ({
      availabilityByAdminId: {},
      setAvailability: (adminId, availability) =>
        set(state => ({
          availabilityByAdminId: {
            ...state.availabilityByAdminId,
            [adminId]: availability,
          },
        })),
    }),
    {
      name: ADMIN_AVAILABILITY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
