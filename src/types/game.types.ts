// Game Balance Types

export interface GameBalance {
  // Player Movement
  readonly MOVE_SPEED: number;
  readonly JUMP_VELOCITY: number;
  readonly ROTATION_SPEED: number;

  // Ground Detection
  readonly GROUND_LEVEL: number;
  readonly GROUND_THRESHOLD_UPPER: number;
  readonly GROUND_THRESHOLD_LOWER: number;

  // Physics
  readonly GRAVITY_SCALE: number;
  readonly PLAYER_MASS: number;
  readonly AIR_CONTROL: number;

  // Ghost
  readonly GHOST_WANDER_INTERVAL: number;
  readonly GHOST_WANDER_DISTANCE_MIN: number;
  readonly GHOST_WANDER_DISTANCE_MAX: number;
  readonly GHOST_MOVE_SPEED: number;

  // Camera
  readonly CAMERA_DISTANCE: number;
  readonly CAMERA_HEIGHT: number;
  readonly FOV: number;

  // Lighting
  readonly HERO_LIGHT_COLOR: string;
  readonly HERO_LIGHT_INTENSITY: number;
  readonly HERO_LIGHT_DISTANCE: number;

  // Debug
  readonly DEBUG_LANTERNS: boolean;
  readonly DEBUG_GROUND_DETECTION: boolean;
}

// Player Role Types
export type PlayerRole = 'hunter' | 'operator' | 'spectator' | null;

export interface Roles {
  hunter: string | null;
  operator: string | null;
}

// Game State Types
export type GamePhase = 'lobby' | 'playing';

export interface PlayerProfile {
  name: string;
}

export interface PlayerState {
  profile: PlayerProfile;
  ready: boolean;
  pos?: { x: number; y: number; z: number };
}

// Ghost Types
export interface GhostPosition {
  x: number;
  y: number;
  z: number;
}

// Map Types
export type MapLegend = Record<string, string>;
