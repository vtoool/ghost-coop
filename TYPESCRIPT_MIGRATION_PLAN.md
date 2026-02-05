# TypeScript Migration Plan for Ecto-Busters

## Overview
Converting React + Vite + PlayroomKit codebase from JavaScript to TypeScript for improved type safety, IDE support, and long-term maintainability.

## Migration Strategy

### Phase 1: Infrastructure (Sequential)
1. Install TypeScript dependencies
2. Create tsconfig.json with strict mode
3. Create type declaration files for external libraries
4. Update Vite configuration

### Phase 2: Low-Risk Files (Parallel - Batch 1)
- src/constants/GameBalance.js → .ts
- src/utils/playerStorage.js → .ts
- src/hooks/useShadowTexture.js → .ts
- src/utils/SafeGLTF.jsx → .tsx

### Phase 3: Components (Parallel - Batch 2)
- src/components/DebugOverlay.jsx → .tsx
- src/components/OperatorHUD.jsx → .tsx
- src/components/Game.jsx → .tsx
- src/experience/RoleManager.jsx → .tsx

### Phase 4: Complex Components (Parallel - Batch 3)
- src/components/Lobby.jsx → .tsx (complex state management)
- src/experience/LevelMap.js → .ts (map data structures)

### Phase 5: 3D Experience Files (Parallel - Batch 4)
- src/experience/Environment.jsx → .tsx
- src/experience/MapRenderer.jsx → .tsx
- src/experience/Ghost.jsx → .tsx
- src/experience/GameWorld.jsx → .tsx
- src/experience/HunterController.jsx → .tsx (most complex)

### Phase 6: Root Files (Sequential)
- src/App.jsx → .tsx
- src/main.jsx → .tsx

### Phase 7: Hooks (Sequential)
- src/hooks/usePerformanceLogger.jsx → .tsx (last - depends on other files)

## Type Definitions Needed

### PlayroomKit Types
```typescript
interface Player {
  id: string;
  getState: <T>(key: string) => T | undefined;
  setState: <T>(key: string, value: T, reliable?: boolean) => void;
  getJoystick: () => { x: number; y: number; isActive: boolean } | null;
}

interface MultiplayerState<T> {
  state: T;
  setState: (value: T) => void;
}
```

### Game Balance Types
```typescript
interface GameBalance {
  MOVE_SPEED: number;
  JUMP_VELOCITY: number;
  // ... all constants
}
```

### Component Props Types
- Lobby: no props (uses Playroom hooks)
- Game: no props
- HunterController: no props
- Ghost: { isOperator?: boolean }
- DebugOverlay: { myRole?: 'spectator' | 'hunter' | 'operator' }

## Critical Considerations

1. **Strict Mode**: Enable strict: true for maximum type safety
2. **Allow JS**: Initially allowJs: true for gradual migration
3. **Three.js Types**: @types/three already installed
4. **React Types**: @types/react already installed
5. **PlayroomKit**: No official types - create declarations
6. **Vite**: Update vite.config.ts with proper plugins

## Testing Strategy
1. Run `npm run test:unit` after each batch
2. Run `npm run lint` to catch type errors
3. Run `npm run build` to ensure production build works
4. Manual testing on https://ghost-coop.vercel.app

## Rollback Plan
- Keep git commits small and atomic per batch
- If issues arise, can revert specific batches
- Test thoroughly before pushing to production
