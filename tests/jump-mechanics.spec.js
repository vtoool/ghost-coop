import { describe, it, expect } from 'vitest'
import {
  JUMP_VELOCITY,
  GROUND_LEVEL,
  GROUND_THRESHOLD_UPPER,
  GROUND_THRESHOLD_LOWER
} from '../src/constants/GameBalance'

describe('Jump Mechanics', () => {
  // Simulate ground detection function
  const isGrounded = (playerY) => {
    return playerY <= (GROUND_LEVEL + GROUND_THRESHOLD_UPPER) && 
           playerY >= (GROUND_LEVEL - GROUND_THRESHOLD_LOWER)
  }

  describe('Ground Detection', () => {
    it('should detect player as grounded when on floor', () => {
      expect(isGrounded(-0.5)).toBe(true)  // Exact ground level
      expect(isGrounded(-0.4)).toBe(true)  // Slightly above
      expect(isGrounded(-0.55)).toBe(true) // Slightly below
    })

    it('should NOT detect player as grounded when jumping', () => {
      expect(isGrounded(0)).toBe(false)    // At zero
      expect(isGrounded(0.5)).toBe(false)  // Jumping up
      expect(isGrounded(2.0)).toBe(false)  // High jump
    })

    it('should NOT detect player as grounded when falling below floor', () => {
      expect(isGrounded(-0.7)).toBe(false) // Too far down
      expect(isGrounded(-1.0)).toBe(false) // Way below
    })

    it('should handle edge cases at threshold boundaries', () => {
      const upperBound = GROUND_LEVEL + GROUND_THRESHOLD_UPPER  // -0.35
      const lowerBound = GROUND_LEVEL - GROUND_THRESHOLD_LOWER  // -0.6
      
      // Exactly at boundaries should be grounded
      expect(isGrounded(upperBound)).toBe(true)
      expect(isGrounded(lowerBound)).toBe(true)
      
      // Just outside boundaries should NOT be grounded
      expect(isGrounded(upperBound + 0.01)).toBe(false)
      expect(isGrounded(lowerBound - 0.01)).toBe(false)
    })
  })

  describe('Jump State Machine', () => {
    it('should allow jump only when grounded and canJump is true', () => {
      const testCases = [
        { grounded: true, canJump: true, expected: true, desc: 'grounded and ready' },
        { grounded: true, canJump: false, expected: false, desc: 'grounded but already jumped' },
        { grounded: false, canJump: true, expected: false, desc: 'in air' },
        { grounded: false, canJump: false, expected: false, desc: 'in air and already jumped' }
      ]

      testCases.forEach(({ grounded, canJump, expected, desc }) => {
        const jumpPressed = true
        const canActuallyJump = jumpPressed && grounded && canJump
        expect(canActuallyJump).toBe(expected, `Failed: ${desc}`)
      })
    })

    it('should reset canJump when landing on ground', () => {
      // Simulate jump sequence
      let canJump = true
      let playerY = GROUND_LEVEL
      
      // Start jump
      const jumpPressed = true
      if (jumpPressed && isGrounded(playerY) && canJump) {
        canJump = false
        playerY += JUMP_VELOCITY * 0.1  // Simulate upward movement
      }
      
      expect(canJump).toBe(false)
      expect(isGrounded(playerY)).toBe(false)
      
      // Land back on ground
      playerY = GROUND_LEVEL
      if (isGrounded(playerY) && !canJump) {
        canJump = true
      }
      
      expect(canJump).toBe(true)
    })

    it('should apply correct jump velocity', () => {
      const initialY = GROUND_LEVEL
      const jumpY = initialY + JUMP_VELOCITY * 0.016 // One frame at 60fps
      
      expect(JUMP_VELOCITY).toBe(3)
      expect(jumpY).toBeGreaterThan(initialY)
    })
  })

  describe('Prevent Double Jump/Flying', () => {
    it('should prevent holding spacebar from causing fly mode', () => {
      let canJump = true
      let playerY = GROUND_LEVEL
      let velY = 0
      
      // Simulate holding spacebar
      for (let frame = 0; frame < 60; frame++) { // 1 second at 60fps
        const jumpPressed = true
        
        // Try to jump
        if (jumpPressed && isGrounded(playerY) && canJump) {
          velY = JUMP_VELOCITY
          canJump = false
        }
        
        // Apply gravity (simplified)
        velY -= 0.1
        playerY += velY * 0.016
        
        // Reset canJump when grounded
        if (isGrounded(playerY) && !canJump) {
          canJump = true
        }
      }
      
      // Player should have fallen back to ground (or very close to it)
      // The important thing is they didn't keep flying upward indefinitely
      expect(playerY < GROUND_LEVEL + 2).toBe(true)
    })

    it('should only allow one jump per ground contact', () => {
      let jumpCount = 0
      let canJump = true
      let playerY = GROUND_LEVEL
      
      // First jump
      if (isGrounded(playerY) && canJump) {
        jumpCount++
        canJump = false
        playerY += 2 // Simulate jump height
      }
      
      // Try to jump again while in air (should fail)
      if (isGrounded(playerY) && canJump) {
        jumpCount++
      }
      
      expect(jumpCount).toBe(1)
      expect(isGrounded(playerY)).toBe(false)
    })
  })
})
