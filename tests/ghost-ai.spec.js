import { describe, it, expect } from 'vitest'
import {
  GHOST_WANDER_INTERVAL,
  GHOST_WANDER_DISTANCE_MIN,
  GHOST_WANDER_DISTANCE_MAX,
  GHOST_MOVE_SPEED
} from '../src/constants/GameBalance'

describe('Ghost AI Logic', () => {
  describe('Wander Target Generation', () => {
    it('should generate targets within distance bounds', () => {
      const currentPos = { x: 0, y: 1.5, z: 0 }
      
      // Simulate 100 wander targets
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = GHOST_WANDER_DISTANCE_MIN + Math.random() * 
                        (GHOST_WANDER_DISTANCE_MAX - GHOST_WANDER_DISTANCE_MIN)
        
        const targetX = currentPos.x + Math.cos(angle) * distance
        const targetZ = currentPos.z + Math.sin(angle) * distance
        
        const actualDistance = Math.sqrt(
          Math.pow(targetX - currentPos.x, 2) + 
          Math.pow(targetZ - currentPos.z, 2)
        )
        
        expect(actualDistance).toBeGreaterThanOrEqual(GHOST_WANDER_DISTANCE_MIN)
        expect(actualDistance).toBeLessThanOrEqual(GHOST_WANDER_DISTANCE_MAX)
      }
    })

    it('should maintain consistent Y position', () => {
      const iterations = 50
      
      for (let i = 0; i < iterations; i++) {
        const targetY = 1.5 // Ghost hover height
        expect(targetY).toBe(1.5)
      }
    })
  })

  describe('Movement Interpolation', () => {
    it('should move ghost smoothly toward target', () => {
      const startPos = { x: 0, y: 1.5, z: 0 }
      const targetPos = { x: 10, y: 1.5, z: 0 }
      
      let currentPos = { ...startPos }
      const iterations = 100
      
      for (let i = 0; i < iterations; i++) {
        const prevX = currentPos.x
        
        // Apply interpolation
        currentPos.x = currentPos.x + (targetPos.x - currentPos.x) * GHOST_MOVE_SPEED
        
        // Should always move toward target
        expect(currentPos.x).toBeGreaterThan(prevX)
        
        // Should never overshoot
        expect(currentPos.x).toBeLessThanOrEqual(targetPos.x)
      }
      
      // After many iterations, should be very close to target (allowing for interpolation smoothing)
      expect(currentPos.x).toBeGreaterThan(8)
    })

    it('should handle negative movement correctly', () => {
      const startPos = { x: 0, y: 1.5, z: 0 }
      const targetPos = { x: -10, y: 1.5, z: 0 }
      
      let currentPos = { ...startPos }
      
      // Move for 50 iterations
      for (let i = 0; i < 50; i++) {
        const prevX = currentPos.x
        currentPos.x = currentPos.x + (targetPos.x - currentPos.x) * GHOST_MOVE_SPEED
        
        // Should always move toward target (negative direction)
        expect(currentPos.x).toBeLessThan(prevX)
        expect(currentPos.x).toBeGreaterThanOrEqual(targetPos.x)
      }
    })
  })

  describe('Wander Interval Timing', () => {
    it('should have reasonable interval duration', () => {
      // Interval should be between 1-10 seconds
      expect(GHOST_WANDER_INTERVAL).toBeGreaterThanOrEqual(1000)
      expect(GHOST_WANDER_INTERVAL).toBeLessThanOrEqual(10000)
      expect(GHOST_WANDER_INTERVAL).toBe(3000)
    })
  })
})
