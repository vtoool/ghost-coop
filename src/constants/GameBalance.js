/**
 * Game Balance Constants
 * 
 * Centralized configuration for game mechanics.
 * Update these values to tune gameplay without hunting through code.
 */

// Player Movement
export const MOVE_SPEED = 3
export const JUMP_VELOCITY = 3
export const ROTATION_SPEED = 0.1

// Ground Detection
export const GROUND_LEVEL = -0.5
export const GROUND_THRESHOLD_UPPER = 0.15  // How high above ground level is "grounded"
export const GROUND_THRESHOLD_LOWER = 0.1   // How far below ground level is "grounded"

// Physics
export const GRAVITY_SCALE = 1
export const PLAYER_MASS = 1
export const AIR_CONTROL = 0.3  // Movement control while in air (0-1)

// Ghost
export const GHOST_WANDER_INTERVAL = 3000  // ms between target changes
export const GHOST_WANDER_DISTANCE_MIN = 3
export const GHOST_WANDER_DISTANCE_MAX = 8
export const GHOST_MOVE_SPEED = 0.02  // Interpolation factor per tick

// Camera
export const CAMERA_DISTANCE = 3.5
export const CAMERA_HEIGHT = 0
export const FOV = 75

// Lighting
export const HERO_LIGHT_COLOR = '#ffaa44'
export const HERO_LIGHT_INTENSITY = 8
export const HERO_LIGHT_DISTANCE = 20

// Debug
export const DEBUG_LANTERNS = false
export const DEBUG_GROUND_DETECTION = false
