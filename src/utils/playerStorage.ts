// Player Profile Persistence Utility
// Saves/restores player name to localStorage for cross-session persistence

import type { PlayerProfile } from '../types/game.types'

const STORAGE_KEY = 'ecto-busters-player-profile'

/**
 * Get stored player profile from localStorage
 * @returns The stored profile or null if not found
 */
export const getStoredProfile = (): PlayerProfile | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as PlayerProfile
    }
  } catch (error) {
    console.error('Failed to read profile from localStorage:', error)
  }
  return null
}

/**
 * Save player profile to localStorage
 * @param profile - The profile object to save (e.g., { name: 'PlayerName' })
 */
export const setStoredProfile = (profile: PlayerProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.error('Failed to save profile to localStorage:', error)
  }
}

/**
 * Clear stored player profile from localStorage
 * Call this when user explicitly leaves the room
 */
export const clearStoredProfile = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear profile from localStorage:', error)
  }
}
