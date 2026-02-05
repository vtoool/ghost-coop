/**
 * Game Balance Constants
 * 
 * Centralized configuration for game mechanics.
 * Update these values to tune gameplay without hunting through code.
 */

// Player Movement
export const MOVE_SPEED = 3 as const;
export const JUMP_VELOCITY = 3 as const;
export const ROTATION_SPEED = 0.1 as const;

// Ground Detection
export const GROUND_LEVEL = -0.5 as const;
export const GROUND_THRESHOLD_UPPER = 0.15 as const;  // How high above ground level is "grounded"
export const GROUND_THRESHOLD_LOWER = 0.1 as const;   // How far below ground level is "grounded"

// Physics
export const GRAVITY_SCALE = 1 as const;
export const PLAYER_MASS = 1 as const;
export const AIR_CONTROL = 0.3 as const;  // Movement control while in air (0-1)

// Ghost
export const GHOST_WANDER_INTERVAL = 3000 as const;  // ms between target changes
export const GHOST_WANDER_DISTANCE_MIN = 3 as const;
export const GHOST_WANDER_DISTANCE_MAX = 8 as const;
export const GHOST_MOVE_SPEED = 0.02 as const;  // Interpolation factor per tick

// Camera
export const CAMERA_DISTANCE = 3.5 as const;
export const CAMERA_HEIGHT = 0 as const;
export const FOV = 75 as const;

// Lighting
export const HERO_LIGHT_COLOR = '#ffaa44' as const;
export const HERO_LIGHT_INTENSITY = 8 as const;
export const HERO_LIGHT_DISTANCE = 20 as const;

// Debug
export const DEBUG_LANTERNS = false as const;
export const DEBUG_GROUND_DETECTION = false as const;
