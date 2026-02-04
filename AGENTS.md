# ECTO-BUSTERS — Agentic Workflow Protocol

> **Universal 2-Player Async Co-op Game**
> Stack: React + Vite + PlayroomKit + R3F + Rapier + Tailwind

---

## 🎯 Project Identity

**Name:** Ecto-Busters
**Type:** Universal Host/Join Async Co-op Game
**Core Stack:** React 19 + Vite + PlayroomKit + React Three Fiber + Rapier Physics + TailwindCSS

---

## 📊 Current Status

**Phase 1: COMPLETE** ✅
Lobby & Connection Architecture — Foundation deployed and stable.

**Phase 2: COMPLETE** ✅
3D Game World Integration — Auto-tiling map, TPS camera, physics character.

**Phase 3: PENDING** ⏳
Gameplay Mechanics — Ghost entity, Operator role, capture mechanics.

---

## 🏗️ Architecture

### Network Gate Pattern (Phase 1 Stability Fix)

**Problem Solved:** Eliminates React StrictMode race conditions with PlayroomKit.

```
┌─────────────────────────────────────────┐
│  index.html (Loading Spinner CSS)       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  main.jsx (The Gatekeeper)              │
│  1. await insertCoin()                  │
│  2. Poll for myPlayer().id (confirms)   │
│  3. Wait for isHost() ready             │
│  4. ONLY THEN render React             │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  App.jsx + Lobby.jsx (Dumb UI)          │
│  • Assume network is ready              │
│  • No defensive null checks             │
│  • DebugOverlay shows live state        │
└─────────────────────────────────────────┘
```

**Key Insight:** `insertCoin()` resolves before `myPlayer()` is fully populated. The Gatekeeper polls until `myPlayer().id` exists, guaranteeing React only renders when the network is 100% ready.

### State Discipline

| State Type | Store | Access Pattern |
|------------|-------|----------------|
| UI State | Zustand | `useGameStore()` |
| Multiplayer | Playroom | `useMultiplayerState()` |
| Player Data | Playroom | `myPlayer().getState()` |

**Rule:** Never duplicate multiplayer state into local React state.

**New Rule:** UI components assume network is ready (enforced by Gatekeeper).

---

## 🎮 Player Roles

### Hunter (Functional)

**Location:** `src/experience/HunterController.jsx`

The Hunter is the playable character controlled by the Host:

- **TPS Camera:** Boom-arm rig with PointerLockControls
- **Movement:** Physics-based with WASD + optional joystick
- **Animation:** Idle/Sprint states from `character-male-a.glb`
- **Position Sync:** Broadcasts position via `player.setState('pos', {...})`

**Role Detection:**
```javascript
const role = isHost() ? 'HUNTER' : 'OPERATOR'
```

### Operator (Mocked)

**Current State:** `CPU_MOCK` placeholder in `GameWorld.jsx`

The Operator view is not yet implemented. The ghost entity currently:
- Has no Player association
- Does not sync via PlayroomKit
- Is visible but not interactive

**To Implement:**
- Replace `CPU_MOCK` with actual Operator player
- Orthographic camera (top-down view)
- Ghost tracking HUD
- Reveal ability for ghost positions

---

## 🗺️ The Map System

### ASCII Level Format

**Location:** `src/experience/LevelMap.js`

Levels are text grids that define the game world:

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

**Legend Mapping:**
```javascript
export const mapLegend = {
  '#': 'iron-fence',
  '^': 'pine-crooked',
  'T': 'pine',
  '+': 'gravestone-cross',
  '*': 'gravestone-round',
  'C': 'crypt',
  'L': 'lantern-candle',
  // etc...
}
```

### Auto-Tiling Strategy

**Location:** `src/experience/MapRenderer.jsx`

The floor procedurally generates two tile types:

1. **Edges (Rounded):** `block-grass.glb` from Platformer Kit
2. **Centers (Square):** `block-grass-square.glb` from Nature Kit

```javascript
const isEdge = x === 0 || x === width - 1 || z === 0 || z === height - 1
const model = isEdge ? roundedClone : squareClone
```

### Texture Unification

Different Kenney kits use different texture atlases:

| Kit | Model | Texture Method |
|-----|-------|----------------|
| Platformer | `block-grass.glb` | `colormap_platformer.png` (UVs aligned) |
| Nature | `block-grass-square.glb` | **Solid hex color** `#63a73c` |
| Graveyard | Props (fences, graves) | `colormap_graveyard.png` |

**Why Solid Color for Nature Blocks:**
The Nature Kit's UV mapping doesn't align with the Platformer texture atlas. Applying the texture results in black/glitchy rendering. Solution: create a fresh `MeshStandardMaterial` with hex color.

```javascript
// ✅ CORRECT — Solid color for Nature blocks
child.material = new THREE.MeshStandardMaterial({
  color: '#63a73c',
  roughness: 0.8,
})

// ❌ WRONG — Texture causes black rendering
child.material.map = platformerTx
```

### Grid Configuration

```javascript
const gridSize = 2  // 2x2 unit tiles
const offsetX = width * gridSize / 2  // Center the map horizontally
const offsetZ = height * gridSize / 2
```

**Floor Y Position:** `-1` (sits below props at `y: 0`)

---

## 🔧 The Dev Bypass

### Solo Dev Mode

**Location:** `src/components/Lobby.jsx`

For testing without multiplayer, there's a hidden "Dev Start" button that:
1. Bypasses `insertCoin()` multiplayer initialization
2. Forces the player into Hunter role
3. Renders the 3D game world immediately

**Trigger:** Type "dev" in the name field to reveal the button.

**Code Pattern:**
```javascript
const handleDevStartHunter = () => {
  // Sets gameStart=true without Playroom sync
  // Renders Game.jsx directly
  setGameStarted(true)
}
```

**Warning:** This mode doesn't sync with other players. Use only for single-player testing.

---

## 🎨 Asset Rules

### Naming Conventions

| Asset Type | Pattern | Example |
|------------|---------|---------|
| Floor (rounded) | `block-grass.glb` | Platformer Kit |
| Floor (square) | `block-grass-square.glb` | Nature Kit (converted) |
| Props | `{name}.glb` | `iron-fence.glb`, `crypt.glb` |
| Characters | `character-{name}.glb` | `character-male-a.glb` |
| Textures | `colormap_{kit}.png` | `colormap_platformer.png` |

### Model Conversion

To add new floor blocks from Kenney kits:

1. Export GLB from Kenney (or convert OBJ→GLB)
2. Place in `/public/models/environment/`
3. Name following convention: `{block-type}.glb`
4. Test texture alignment:
   - If UVs align → use texture map
   - If UVs misaligned → use solid hex color `#63a73c`

### Texture Settings

```javascript
const platformerTx = useTexture('/models/environment/Textures/colormap_platformer.png')
platformerTx.colorSpace = THREE.SRGBColorSpace
platformerTx.flipY = false
```

**Important:** Platformer textures use `flipY: false`. Graveyard textures also use `flipY: false`.

---

## 🐛 Known Quirks & Fixes

### 1. Nature Kit Texture Mismatch

**Symptom:** Square grass blocks render black

**Fix:** Use solid hex color `#63a73c` instead of texture mapping

**Code:** See `MapRenderer.jsx` → `squareClone` useMemo

---

### 2. Shadow Acne

**Symptom:** Character shows stripey shadow artifacts

**Fix:** Shadow bias adjustment in renderer

**Code:** `shadowMap.bias = -0.0001` in `Game.jsx`

---

### 3. Rounded Edge Gaps

**Symptom:** Star-shaped gaps between rounded Platformer blocks

**Fix:** Reduce `gridSize` from 2 to 1.75 (0.25 unit overlap)

**Code:** `const gridSize = 1.75` in `MapRenderer.jsx`

---

### 4. Double Lobby Race

**Symptom:** Lobby renders twice or flickers

**Fix:** Bootstrapper pattern in `main.jsx` — initialize Playroom before React

---

### 5. Animation Names Lowercase

**Symptom:** Animation doesn't play

**Fix:** Use lowercase animation names from Kenney GLB

**Code:** `actions["sprint"]` not `actions["Sprint"]`

---

## 🚦 Performance Optimization Log

### Issue: High-DPI Mouse Jitter & FPS Drops

**Problem:** Game loads at 30 FPS with heavy emissive materials, then "snaps" to 60 FPS after PerformanceMonitor triggers (10s delay).

**Root Cause:** Embedded GLTF lights + 18 emissive lantern meshes + Bloom = heavy GPU load

### Phase 1: Debug Logging (COMPLETED ✅)

Added comprehensive performance diagnostics in `src/hooks/usePerformanceLogger.jsx`:

| Metric | Trigger | Purpose |
|--------|---------|---------|
| FPS/Frame Time | Every 2s | Identify if below 60 FPS target |
| Render Calls | Every 2s | Detect draw call spikes |
| Active Lights | Every 2s | Confirm light purge working |
| Emissive Meshes | Every 2s | Track emissive material count |
| GLTF Audit | Per load | Log embedded light removal |

### Phase 2: Emissive Removal Plan (STORED)

**Objective:** Replace GPU-heavy emissive lantern materials with performant glow sprites.

**Current (Problem):**
- 18 lantern meshes with `emissiveIntensity={5}`
- Bloom processing each high-intensity emissive surface
- Frame time > 16ms on many browsers

**Target (Solution):**
- Remove all emissive modifications from lanterns
- Add procedural glow sprites using Canvas-generated textures
- Hero light provides actual illumination for player
- Target frame time < 16ms consistently

**Implementation Steps:**
1. Create procedural glow texture using Canvas API (no external asset)
2. Replace emissive materials with transparent sprite glow
3. Use `THREE.AdditiveBlending` for realistic glow effect
4. Verify PerformanceMonitor only reduces Bloom, not lights

**Code Pattern:**
```jsx
// Replace emissive intensity with sprite glow
{isLantern && (
  <sprite position={[0, 1, 0]}>
    <spriteMaterial
      map={glowTexture}
      transparent
      opacity={0.6}
      blending={THREE.AdditiveBlending}
    />
  </sprite>
)}
```

**Files Affected:**
- `src/experience/MapRenderer.jsx` - Remove emissive, add glow sprites
- `src/hooks/usePerformanceLogger.jsx` - Log emissive count reduction

**Success Criteria:**
- Emissive meshes: 0
- FPS: Stable 60
- Frame time: < 16.67ms

---

## ✅ Memory Log (Completed Features)

### Phase 1: Foundation

- [x] Visual Design System (STYLE_GUIDE.md)
- [x] Vite + React 19 project initialized
- [x] PlayroomKit integration with async bootstrapper
- [x] Tailwind CSS v4 configured
- [x] Universal Lobby UI (Host/Join agnostic)
- [x] QR Code generation for mobile joining
- [x] Player list with ready status
- [x] Host-only start button
- [x] Playwright visual regression tests

### Phase 2: 3D World

- [x] R3F scene setup with Canvas
- [x] Rapier physics integration
- [x] TPS boom-arm camera rig
- [x] Character controller with physics movement
- [x] ASCII map system (LevelMap.js)
- [x] Auto-tiling floor (rounded edges + square centers)
- [x] Multi-kit asset pipeline
- [x] Texture unification across kits
- [x] Universal controls (Keyboard + Joystick)
- [x] Solo Dev Mode bypass
- [x] Shadow bias fixes

---

## 🚀 Deployment

**Platform:** Vercel
**Live URL:** https://ghost-coop.vercel.app
**Pipeline:** `git push` → Vercel build → Live URL
**Local Testing:** `npx playwright test`

### Deploy Commands

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `index.html` | Loading spinner CSS |
| `src/main.jsx` | Gatekeeper — polls until network ready |
| `src/App.jsx` | View manager (lobby vs game) |
| `src/components/Lobby.jsx` | Universal lobby + Dev bypass |
| `src/components/Game.jsx` | R3F Canvas wrapper |
| `src/experience/GameWorld.jsx` | 3D scene composition |
| `src/experience/MapRenderer.jsx` | Auto-tiling floor/props |
| `src/experience/LevelMap.js` | ASCII level layout |
| `src/experience/HunterController.jsx` | TPS camera + physics character |
| `src/experience/Ghost.jsx` | Ghost entity (CPU_MOCK) |
| `src/stores/useGameStore.js` | Zustand UI state |
| `tests/visual.spec.js` | Playwright visual tests |
| `STYLE_GUIDE.md` | Visual design specs |
| `rules.md` | Coding standards |

---

## 🔒 Non-Negotiables

1. **Always Commit & Deploy** — After every code change, commit to GitHub and deploy to Vercel. Verify the build succeeds. Never leave changes uncommitted or untested in production.
2. **Network Gate Pattern** — `insertCoin()` in `main.jsx` ONLY, poll for `myPlayer().id` before `createRoot()`
3. **Dumb UI Components** — App/Lobby assume network ready, no defensive null checks
4. **Universal Design** — Never "Desktop" or "Mobile", always "Host" and "Join"
5. **Mobile First** — `touch-action: none` + `user-select: none` mandatory
6. **State Discipline** — No duplicating Playroom state into React state
7. **Visual Testing** — Playwright tests required for all UI changes
8. **Continuous Self-Improvement** — ALWAYS upgrade capabilities and skills proactively

---

## 🚀 Continuous Self-Improvement Protocol

**Rule:** When working on any task, always look for opportunities to upgrade my own features, skills, and efficiency. This is not optional—it's a core part of the workflow.

### How to Upgrade:

1. **Identify Capability Gaps**
   - What tools/workflows would make this task faster?
   - What patterns am I repeating that could be automated?
   - What domain knowledge would help me work smarter?

2. **Create Skills** (`.opencode/skills/<name>/SKILL.md`)
   - Document reusable patterns and best practices
   - Define clear frontmatter: `name`, `description`, `metadata`
   - Keep skills focused (single responsibility)
   - Use lowercase with hyphens for names (e.g., `visual-testing`, `multiplayer-sync`)

3. **Request MCPs & Tools**
   - If a capability is missing, document the need
   - Propose specific MCP integrations (browser automation, visual testing, etc.)
   - Research available plugins and integrations

4. **Document Learnings**
   - Add to AGENTS.md when patterns emerge
   - Update rules.md with new conventions
   - Create new skill files for complex workflows

5. **Automate Repetitive Tasks**
   - Use subagents for parallel verification
   - Create helper scripts for common operations
   - Build test fixtures and data generators

### Current Skill Inventory:

- *None yet* — Create skills as patterns emerge during development

### Upgrade Opportunities Log:

- [ ] **Visual Testing Skill** — Pattern for screenshot → image understanding → verification loops
- [ ] **Multiplayer Testing Skill** — Multi-context browser automation for real-time games
- [ ] **Style Guide Compliance Skill** — Automated STYLE_GUIDE.md verification

---

## 📋 Quick Reference for New Sessions

### Starting a New Task

1. **Read AGENTS.md first** — Understand current phase and constraints
2. **Check README.md** — Technical context and patterns
3. **Identify affected files** — Use grep to find relevant code
4. **Run tests** — `npm run test` before making changes
5. **Make changes** — Follow rules.md conventions
6. **Run lint** — `npm run lint`
7. **Commit & Deploy** — Per non-negotiable #1

### Common Patterns

**Adding a new prop to the map:**
1. Add GLB to `/public/models/environment/`
2. Update `mapLegend` in `LevelMap.js`
3. Test rendering in browser

**Adding a new animation:**
1. Ensure GLB uses lowercase animation names
2. Update `HunterController.jsx` → `currentAction` states
3. Test in browser with movement input

**Fixing a visual bug:**
1. Check `STYLE_GUIDE.md` for design specs
2. Use browser DevTools to identify issue
3. Update relevant component
4. Run visual regression test

---

*Last Updated: 2026-02-04*
*Status: Phase 2 COMPLETE ✅, Ready for Phase 3*
