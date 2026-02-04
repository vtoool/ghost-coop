# Ecto-Busters — Universal 2-Player Async Co-op Game

> **A real-time multiplayer ghost hunting experience built with React, PlayroomKit, Three.js, and Rapier Physics**

**Live URL:** https://ghost-coop.vercel.app

**Current Phase:** Phase 2 Complete (Multiplayer Core & Level Architecture)

**Last Updated:** 2026-02-04

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack Deep Dive](#tech-stack-deep-dive)
3. [Architecture Patterns](#architecture-patterns)
4. [Level Design System](#level-design-system)
5. [Character Controller](#character-controller)
6. [Known Issues & Solutions](#known-issues--solutions)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Pipeline](#deployment-pipeline)
9. [Next Steps](#next-steps)

---

## Executive Summary

**Ecto-Busters** is a universal async co-op game where one player hosts (displays the 3D game world) and others join as controllers. The architecture works identically across all devices—no "Desktop" vs "Mobile" discrimination.

### Core Philosophy

- **Universal Design:** Host/Join terminology, never Desktop/Mobile
- **Mobile-First:** All interactions work on touch devices
- **Real-time Sync:** PlayroomKit provides WebRTC-based multiplayer
- **Visual Polish:** Spooky orange theme with floating animations
- **Procedural Levels:** ASCII map system with auto-tiling floor generation

### Current State

✅ **Phase 1 (COMPLETE):**
- Lobby system with QR codes and room codes
- Player ready/unready states
- Host-only game start with validation
- LocalStorage profile persistence
- Visual regression testing with Playwright

✅ **Phase 2 (COMPLETE):**
- React Three Fiber 3D scene with Rapier physics
- TPS (Third-Person Shooter) camera with boom-arm rig
- Character controller with physics-based movement
- ASCII map system with procedural tile generation
- Auto-tiling floor: rounded edges + square centers
- Multi-kit asset pipeline (Platformer + Nature + Graveyard kits)
- Solo Dev Mode for testing without multiplayer

⏳ **Phase 3 (PENDING):**
- Ghost entity with AI movement
- Ghost capture mechanics
- Operator role implementation (mocked as 'CPU_MOCK')
- Score system and win conditions
- Mobile virtual joystick controls

---

## Tech Stack Deep Dive

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework with StrictMode |
| **Vite** | 7.3.4 | Build tool, dev server, HMR |
| **PlayroomKit** | 0.0.95 | WebRTC multiplayer networking |
| **Zustand** | 5.0.10 | UI state management (NOT multiplayer state) |

### 3D Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | 0.182.0 | 3D graphics library |
| **React Three Fiber** | 9.5.0 | React renderer for Three.js |
| **Drei** | 10.7.7 | R3F helpers (PointerLockControls, PerspectiveCamera, useAnimations) |
| **Rapier** | 0.13.0 | Physics engine (RigidBody, CapsuleCollider) |

### Physics Configuration

| Component | Type | Settings |
|-----------|------|----------|
| Character | dynamic | enabledRotations: [false, true, false], lockRotations: true |
| Floor Tiles | fixed | colliders: hull |
| Invisible Base | fixed | CuboidCollider args: [50, 1, 50] at y: -1 |

### Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **TailwindCSS** | 4.1.18 | Utility-first CSS |
| **clsx** | 2.1.1 | Conditional class merging |
| **tailwind-merge** | 3.4.0 | Tailwind class deduplication |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **qrcode.react** | 4.2.0 | QR code generation for room joining |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | 1.58.1 | E2E testing, visual regression |
| **ESLint** | 9.39.1 | Code linting with React hooks plugin |

---

## Architecture Patterns

### The Bootstrapper Pattern (CRITICAL)

**Location:** `src/main.jsx`

PlayroomKit initialization **MUST** happen before React renders. This prevents the "Double Lobby" race condition.

```javascript
// ✅ CORRECT — Async bootstrapper
async function bootstrap() {
  try {
    await insertCoin({
      skipLobby: true,
      streamMode: true,
    })
    
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  } catch (error) {
    document.getElementById('root').innerHTML = '...'
  }
}
bootstrap()
```

### State Management Hierarchy

| State Type | Store | Access Pattern | Example |
|------------|-------|----------------|---------|
| **UI State** | Zustand | `useGameStore()` | Screen transitions, local UI |
| **Multiplayer State** | Playroom | `useMultiplayerState()` | `gameStart`, global game state |
| **Player Data** | Playroom | `myPlayer().setState()` | `profile`, `ready` status |
| **Player List** | Playroom | `usePlayersList()` | All connected players |

**CRITICAL RULE:** Never duplicate Playroom state into local React state.

### View Manager Pattern

```
main.jsx (Bootstrapper)
    ↓
App.jsx (View Manager)
    ├── Lobby.jsx (Universal Lobby UI)
    └── Game.jsx (R3F Canvas Wrapper)
        └── GameWorld.jsx
            ├── MapRenderer.jsx (Procedural Map)
            ├── HunterController.jsx (Player)
            └── Ghost (CPU_MOCK)
```

### Universal Design (Host/Join)

**NEVER** use device-specific terminology:

| ❌ Wrong | ✅ Correct |
|----------|------------|
| "Desktop Host" | "HOST" |
| "Mobile Join" | "JOIN" |
| "Desktop View" | "STREAMER VIEW" |
| "Mobile Controller" | "CONTROLLER VIEW" |

---

## Level Design System

### ASCII Map Format

**Location:** `src/experience/LevelMap.js`

Levels are designed as text grids using ASCII characters:

```javascript
export const level1 = [
  "####################",
  "#^...++..L..++...^.#",
  "#...*..*...*..*....#",
  "#..T.....C.....T...#",
  "#..................#",
  "#^.......=.......^.#",
  "####################",
]
```

### Map Legend

| Character | GLB Model | Kit |
|-----------|-----------|-----|
| `#` | iron-fence | Graveyard |
| `^` | pine-crooked | Nature |
| `T` | pine | Nature |
| `+` | gravestone-cross | Graveyard |
| `*` | gravestone-round | Graveyard |
| `C` | crypt | Graveyard |
| `L` | lantern-candle | Graveyard |
| `=` | iron-fence-border-gate | Graveyard |

### Auto-Tiling Floor System

**Location:** `src/experience/MapRenderer.jsx`

The floor system procedurally generates tile edges and centers:

1. **Rounded Edges:** `block-grass.glb` (Platformer Kit) for perimeter tiles
2. **Square Centers:** `block-grass-square.glb` (Nature Kit converted) for interior tiles

```javascript
const isEdge = x === 0 || x === width - 1 || z === 0 || z === height - 1
const model = isEdge ? roundedClone : squareClone
```

### Texture Unification

Different kits use different texture atlases. The system forces visual consistency:

| Asset | Texture Method |
|-------|---------------|
| **Platformer Edges** | `colormap_platformer.png` (applied via GLB) |
| **Nature Squares** | Solid hex color `#63a73c` (UV mismatch workaround) |
| **Graveyard Props** | `colormap_graveyard.png` (applied via GLB) |

**Important:** Nature Kit blocks have UV mapping that doesn't align with Platformer textures. Use solid hex color instead of texture mapping.

### Grid Configuration

```javascript
const gridSize = 2  // 2x2 unit tiles
const offsetX = width * gridSize / 2  // Center the map
const offsetZ = height * gridSize / 2
```

---

## Character Controller

### TPS Camera Rig

**Location:** `src/experience/HunterController.jsx`

The character uses a boom-arm camera pattern:

```
Character (RigidBody)
    └── Boom Arm (Group @ waist height)
            └── Camera (3.5m behind player)
```

```jsx
<group ref={setPivot}>
  <PerspectiveCamera makeDefault position={[0, 0, 3.5]} />
</group>
{pivot && <PointerLockControls camera={pivot} selector="#root" />}
```

### Movement System

**Input Sources:**
1. Keyboard: WASD via `useKeyboardControls`
2. Joystick: Mobile via `player.getJoystick()`

**Direction Calculation:**
```javascript
// Get camera facing direction (ignores Y)
viewDir.negate()  // Camera points AT player, we want AWAY

// Calculate movement vectors
moveDir.add(viewDir)    // Forward
moveDir.sub(viewDir)     // Backward
moveDir.add(viewRight)   // Right
moveDir.sub(viewRight)   // Left
```

### Animation States

The character model (`character-male-a.glb`) supports:

| State | Trigger |
|-------|---------|
| `idle` | No movement input |
| `sprint` | Movement input detected |

**Animation Names:** Kenney assets use lowercase internal names (`"idle"`, `"sprint"`).

### Physics Configuration

```jsx
<RigidBody 
  type="dynamic"
  position={[0, 5, 0]}  // Spawn in air
  enabledRotations={[false, true, false]}  // Y-rotation only
  lockRotations={true}
>
  <CapsuleCollider args={[0.5, 0.3]} />
</RigidBody>
```

### Shadow Bias Fix

To prevent shadow acne on the character:
```jsx
child.castShadow = true
child.receiveShadow = true
// Applied in scene.traverse() on mount
```

---

## Known Issues & Solutions

### Issue 1: Nature Kit Texture Mismatch

**Problem:** Square grass blocks render black/glitchy.

**Cause:** The Nature Kit model's UV mapping doesn't align with `colormap_platformer.png`.

**Solution:** Apply solid hex color instead of texture:
```javascript
child.material = new THREE.MeshStandardMaterial({
  color: '#63a73c',  // Kenney Grass Green
  roughness: 0.8,
})
```

---

### Issue 2: Shadow Acne

**Problem:** Character shows stripey shadow artifacts.

**Solution:** Adjust shadow bias in renderer (already applied in Game.jsx):
```javascript
shadowMap.bias = -0.0001
```

---

### Issue 3: Rounded Edge Gaps

**Problem:** Platformer Kit blocks have rounded corners, creating star-shaped gaps.

**Solution:** Reduce gridSize from 2 to 1.75 for overlap:
```javascript
const gridSize = 1.75  // Forces 0.25 unit overlap
```

---

### Issue 4: PlayroomKit Session Restoration

**Problem:** Previous sessions auto-load, interfering with testing.

**Solution:** Clear storage before tests:
```javascript
await page.evaluate(() => {
  indexedDB.deleteDatabase('playroom')
  localStorage.clear()
})
```

---

### Issue 5: Button Text Mismatch

**Problem:** Tests fail looking for "READY" but button says "READY FOR HAUNT".

**Solution:** Use exact button text in selectors.

---

## Testing Strategy

### Test Types

1. **Visual Regression** (`tests/visual.spec.js`)
   - Welcome screen desktop/mobile
   - Lobby with name entered
   - Style guide verification

2. **Two-Player Flow** (`tests/two-player*.spec.js`)
   - Host creates room
   - Joiner scans QR/enters URL
   - Both ready up, host starts

### Running Tests

```bash
npm run test          # All tests
npm run test:ui       # With UI mode
npx playwright test   # Direct invocation
```

### Testing Limitations

See `testing_limitations.md` for:
- Session restoration interference
- Initialization timing (8+ seconds)
- Multi-context isolation
- Mobile touch simulation

---

## Deployment Pipeline

### Platform: Vercel

**Live URL:** https://ghost-coop.vercel.app

### Deploy Commands

```bash
# Deploy preview (staging)
vercel

# Deploy to production
vercel --prod
```

### CI/CD

Automatic deployments on git push. No manual build step required.

### Pre-Deploy Checklist

- [ ] Run `npm run lint` — no errors
- [ ] Run `npm run test` — all tests pass
- [ ] Verify `STYLE_GUIDE.md` compliance

---

## Next Steps

### Phase 3: Gameplay Mechanics

1. **Ghost Entity**
   - AI-driven movement patterns
   - Sync ghost state via `useMultiplayerState`
   - Collision detection with players
   - Capture/respawn mechanics

2. **Operator Role**
   - Replace 'CPU_MOCK' with real Operator player
   - Orthographic camera (top-down view)
   - Ghost tracking HUD
   - Ability to reveal ghost positions

3. **Mobile Controls**
   - Virtual joystick for movement
   - Action buttons (flashlight, trap)
   - Touch-friendly aim controls

4. **Score System**
   - Points for ghost captures
   - Team score tracking
   - Win/lose conditions

### Asset Requirements

| Asset | Purpose | Source |
|-------|---------|--------|
| Ghost model | Ghost entity | Kenney Ghosts Kit |
| Trap model | Capture mechanic | Kenney Horror Kit |
| Flashlight model | Player item | Kenney Modular |
| UI icons | HUD elements | STYLE_GUIDE.md |

---

## Resources

- **PlayroomKit Docs:** https://docs.joinplayroom.com
- **R3F Docs:** https://docs.pmndrs.react-three-fiber.io
- **Rapier Physics:** https://rapier.react-three-fiber.xyz
- **Tailwind v4:** https://tailwindcss.com/docs/v4-beta
- **Kenney Assets:** https://kenney.nl/assets

---

*Last Updated: 2026-02-04*
*Phase 1 Status: COMPLETE ✅*
*Phase 2 Status: COMPLETE ✅*
*Phase 3 Status: READY TO START ⏳*
