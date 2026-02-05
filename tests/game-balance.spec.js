import { describe, it, expect } from 'vitest'
import {
  MOVE_SPEED,
  JUMP_VELOCITY,
  GROUND_LEVEL,
  GROUND_THRESHOLD_UPPER,
  GROUND_THRESHOLD_LOWER,
  CAMERA_DISTANCE,
  HERO_LIGHT_COLOR,
  HERO_LIGHT_INTENSITY,
  HERO_LIGHT_DISTANCE,
  GHOST_WANDER_INTERVAL,
  GHOST_WANDER_DISTANCE_MIN,
  GHOST_WANDER_DISTANCE_MAX,
  GHOST_MOVE_SPEED
} from '../src/constants/GameBalance'

describe('GameBalance Constants', () => {
  describe('Player Movement', () => {
    it('should have positive move speed', () => {
      expect(MOVE_SPEED).toBeGreaterThan(0)
      expect(MOVE_SPEED).toBe(3)
    })

    it('should have positive jump velocity', () => {
      expect(JUMP_VELOCITY).toBeGreaterThan(0)
      expect(JUMP_VELOCITY).toBe(3)
    })

    it('should have reasonable camera distance', () => {
      expect(CAMERA_DISTANCE).toBeGreaterThan(0)
      expect(CAMERA_DISTANCE).toBe(3.5)
    })
  })

  describe('Ground Detection', () => {
    it('should have negative ground level (below zero)', () => {
      expect(GROUND_LEVEL).toBe(-0.5)
    })

    it('should have positive threshold values', () => {
      expect(GROUND_THRESHOLD_UPPER).toBeGreaterThan(0)
      expect(GROUND_THRESHOLD_LOWER).toBeGreaterThan(0)
    })

    it('should calculate correct grounded range', () => {
      const minGrounded = GROUND_LEVEL - GROUND_THRESHOLD_LOWER
      const maxGrounded = GROUND_LEVEL + GROUND_THRESHOLD_UPPER
      
      expect(minGrounded).toBe(-0.6)
      expect(maxGrounded).toBe(-0.35)
    })

    it('should detect grounded player correctly', () => {
      const testCases = [
        { y: -0.5, expected: true, desc: 'exactly at ground level' },
        { y: -0.4, expected: true, desc: 'slightly above ground' },
        { y: -0.55, expected: true, desc: 'slightly below ground' },
        { y: -0.3, expected: false, desc: 'too high above ground' },
        { y: -0.7, expected: false, desc: 'too far below ground' },
        { y: 0, expected: false, desc: 'at zero level' },
        { y: 1.5, expected: false, desc: 'jumping high' }
      ]

      testCases.forEach(({ y, expected, desc }) => {
        const isGrounded = y <= (GROUND_LEVEL + GROUND_THRESHOLD_UPPER) && 
                          y >= (GROUND_LEVEL - GROUND_THRESHOLD_LOWER)
        expect(isGrounded).toBe(expected, `Failed for: ${desc} (y=${y})`)
      })
    })
  })

  describe('Hero Light', () => {
    it('should have valid light color format', () => {
      expect(HERO_LIGHT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(HERO_LIGHT_COLOR).toBe('#ffaa44')
    })

    it('should have positive intensity', () => {
      expect(HERO_LIGHT_INTENSITY).toBeGreaterThan(0)
      expect(HERO_LIGHT_INTENSITY).toBe(8)
    })

    it('should have reasonable distance', () => {
      expect(HERO_LIGHT_DISTANCE).toBeGreaterThan(0)
      expect(HERO_LIGHT_DISTANCE).toBe(20)
    })
  })

  describe('Ghost AI', () => {
    it('should have positive wander interval', () => {
      expect(GHOST_WANDER_INTERVAL).toBeGreaterThan(0)
      expect(GHOST_WANDER_INTERVAL).toBe(3000)
    })

    it('should have valid wander distance range', () => {
      expect(GHOST_WANDER_DISTANCE_MIN).toBeGreaterThan(0)
      expect(GHOST_WANDER_DISTANCE_MAX).toBeGreaterThan(GHOST_WANDER_DISTANCE_MIN)
      expect(GHOST_WANDER_DISTANCE_MIN).toBe(3)
      expect(GHOST_WANDER_DISTANCE_MAX).toBe(8)
    })

    it('should have small move speed (interpolation factor)', () => {
      expect(GHOST_MOVE_SPEED).toBeGreaterThan(0)
      expect(GHOST_MOVE_SPEED).toBeLessThan(1)
      expect(GHOST_MOVE_SPEED).toBe(0.02)
    })
  })
})
