import { create } from 'zustand'

export const useGameStore = create((set) => ({
  // Screen state: 'lobby' | 'game'
  screen: 'lobby',
  
  // Host ID (Playroom ID of the room creator)
  hostId: null,
  
  // Local player state
  me: null,
  
  // Actions
  setScreen: (screen) => set({ screen }),
  setHostId: (hostId) => set({ hostId }),
  setMe: (me) => set({ me }),
}))
