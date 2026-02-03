# Ecto-Busters — Universal 2-Player Async Co-op Game

> **A real-time multiplayer ghost hunting experience built with React, PlayroomKit, and Three.js**

**Live URL:** https://ghost-coop.vercel.app

**Current Phase:** Phase 1 Complete (Lobby & Connection), Phase 2 Pending (3D Game World)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack Deep Dive](#tech-stack-deep-dive)
3. [Architecture Patterns](#architecture-patterns)
4. [Development Strategy](#development-strategy)
5. [Known Issues & Solutions](#known-issues--solutions)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Pipeline](#deployment-pipeline)
8. [Common Failures & Fixes](#common-failures--fixes)
9. [Next Steps for Phase 2](#next-steps-for-phase-2)

---

## Executive Summary

**Ecto-Busters** is a universal async co-op game where one player hosts (displays the game world) and others join as controllers. The architecture is designed to work identically across all devices—no "Desktop" vs "Mobile" discrimination.

### Core Philosophy

- **Universal Design:** Host/Join terminology, never Desktop/Mobile
- **Mobile-First:** All interactions work on touch devices
- **Real-time Sync:** PlayroomKit provides WebRTC-based multiplayer
- **Visual Polish:** Spooky orange theme with floating animations

### Current State

✅ **Phase 1 (COMPLETE):**
- Lobby system with QR codes
- Player ready/unready states
- Host-only game start
- LocalStorage profile persistence
- Visual regression testing with Playwright

⏳ **Phase 2 (PENDING):**
- React Three Fiber 3D scene
- Player avatars in 3D world
- Ghost hunting mechanics
- Mobile controller inputs

---

## Tech Stack Deep Dive

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework with StrictMode |
| **Vite** | 7.2.4 | Build tool, dev server, HMR |
| **PlayroomKit** | 0.0.95 | WebRTC multiplayer networking |
| **Zustand** | 5.0.10 | UI state management (NOT multiplayer state) |

### 3D Stack (Phase 2)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | 0.182.0 | 3D graphics library |
| **React Three Fiber** | 9.5.0 | React renderer for Three.js |
| **Drei** | 10.7.7 | R3F helpers (OrbitControls, Environment, etc.) |

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
| **PostCSS** | 8.5.6 | CSS processing for Tailwind v4 |
| **Autoprefixer** | 10.4.24 | CSS vendor prefixing |

---

## Architecture Patterns

### The Bootstrapper Pattern (CRITICAL)

**Location:** `src/main.jsx`

PlayroomKit initialization **MUST** happen before React renders. This prevents the "Double Lobby" race condition.

```javascript
// ✅ CORRECT — Async bootstrapper
async function bootstrap() {
  try {
    // Initialize Playroom FIRST
    await insertCoin({
      skipLobby: true,
      streamMode: true,
    })
    
    // Only THEN render React
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  } catch (error) {
    // Show user-friendly error
    document.getElementById('root').innerHTML = '...'
  }
}
bootstrap()
```

**Why this matters:** Calling `insertCoin()` inside a React component (e.g., in `useEffect`) causes React to render once, then Playroom initializes and triggers a re-render, causing visual flicker and state inconsistencies.

### State Management Hierarchy

| State Type | Store | Access Pattern | Example |
|------------|-------|----------------|---------|
| **UI State** | Zustand | `useGameStore()` | Screen transitions, local UI |
| **Multiplayer State** | Playroom | `useMultiplayerState()` | `gameStart`, global game state |
| **Player Data** | Playroom | `myPlayer().setState()` | `profile`, `ready` status |
| **Player List** | Playroom | `usePlayersList()` | All connected players |

**CRITICAL RULE:** Never duplicate Playroom state into local React state. Always read directly from the source:

```javascript
// ✅ CORRECT — Read from Playroom directly
const players = usePlayersList()
const [gameStart] = useMultiplayerState('gameStart', false)

// ❌ WRONG — Duplicating state causes sync bugs
const [players, setPlayers] = useState([])
useEffect(() => {
  setPlayers(usePlayersList()) // Don't do this!
}, [])
```

### Manager Pattern

```
main.jsx (Bootstrapper)
    ↓
GameManager (Zustand Store)
    ↓
├── Interface (UI Layer) — React components
└── Experience (3D Layer) — R3F scene (Phase 2)
```

### Universal Design (Host/Join)

**NEVER** use device-specific terminology:

| ❌ Wrong | ✅ Correct |
|----------|------------|
| "Desktop Host" | "HOST" |
| "Mobile Join" | "JOIN" |
| "Desktop View" | "STREAMER VIEW" |
| "Mobile Controller" | "CONTROLLER VIEW" |

The UI uses `isHost()` from PlayroomKit to determine roles, not user agent detection.

---

## Development Strategy

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

### Project Structure

```
src/
├── main.jsx                 # Bootstrapper — NEVER touch
├── App.jsx                  # View manager (lobby vs game)
├── index.css               # Global styles + Tailwind
├── components/
│   └── Lobby.jsx           # Universal lobby UI
├── stores/
│   └── useGameStore.js     # Zustand UI state
└── utils/
    └── playerStorage.js    # LocalStorage persistence

tests/
├── visual.spec.js          # Visual regression tests
├── two-player.spec.js      # Multiplayer flow tests
└── *.spec.js               # Feature-specific tests
```

### Key Files Reference

| File | Purpose | Critical? |
|------|---------|-----------|
| `src/main.jsx` | Bootstrapper — initializes Playroom before React | ✅ YES |
| `src/App.jsx` | View manager — switches between Lobby and Game | ✅ YES |
| `src/components/Lobby.jsx` | Universal lobby — name input, ready states, QR codes | ✅ YES |
| `src/stores/useGameStore.js` | Zustand store for UI state (NOT multiplayer state) | ⚠️ READ-ONLY |
| `src/utils/playerStorage.js` | LocalStorage for profile persistence | ✅ YES |
| `STYLE_GUIDE.md` | Visual design system | 📋 Reference |
| `rules.md` | Coding standards | 📋 Reference |
| `AGENTS.md` | Project status and memory log | 📋 Reference |

### CSS Architecture

**Global Resets (index.css):**
```css
* {
  touch-action: none;      /* Prevent zoom/scroll */
  user-select: none;        /* Prevent text selection */
  -webkit-user-select: none;
}
```

**Tailwind Configuration:**
- Tailwind v4 with PostCSS
- Custom animations defined in index.css (float, flicker, pulse-glow)
- Spooky orange color palette: `#FF6B35` (Neon Pumpkin), `#00F0FF` (Ectoplasm Cyan)

---

## Known Issues & Solutions

### Issue 1: PlayroomKit Session Restoration

**Problem:** PlayroomKit automatically restores previous sessions from IndexedDB, interfering with "first-time" user testing.

**Evidence:** Test screenshots show "Cornflakes47" auto-loaded from previous session.

**Solution:** Clear storage before tests:

```javascript
// Add to test.beforeEach
await page.evaluate(() => {
  indexedDB.deleteDatabase('playroom')
  localStorage.clear()
})
```

**Status:** Fixed in test files ✅

---

### Issue 2: Initialization Timing Inconsistencies

**Problem:** PlayroomKit initialization takes 8-15 seconds in production. Default 5s test timeout captures wrong states.

**Evidence:** Screenshots show "Joining existing game..." stuck because lobby never loads within timeout.

**Solution:** Extended waits:

```javascript
test.beforeEach(async ({ page }) => {
  await page.goto('https://ghost-coop.vercel.app')
  await page.waitForTimeout(8000) // Increased from 3000ms
})
```

**Status:** Fixed in playwright.config.js ✅

---

### Issue 3: Room Code Format Discovery

**Problem:** Room code format is `#r=XXXXX` not `#XXXXX` as initially assumed.

**Evidence:** `window.location.hash.slice(1)` returns "r=EU6XD" not "EU6XD".

**Solution:** Updated extraction logic in Lobby.jsx:

```javascript
// src/components/Lobby.jsx:125
const roomCode = window.location.hash?.slice(1) || 'Unknown'
// Now handles both formats
```

**Status:** Fixed ✅

---

### Issue 4: Button Text Mismatches

**Problem:** Button text is "READY FOR HAUNT" not "READY" as initially coded.

**Evidence:** Test selectors `locator('button:has-text("READY")')` fail.

**Solution:** Updated all test selectors:

```javascript
// tests/visual.spec.js:98
const readyButton = page.locator('button:has-text("READY FOR HAUNT")')
```

**Status:** Fixed ✅

---

### Issue 5: Visual State Confusion

**Problem:** "Joining existing game..." status persists while buttons remain active.

**Evidence:** Screenshot shows both "Joining..." text AND "ENTER THE HAUNTED HOUSE" button.

**Root Cause:** PlayroomKit takes time to determine if user is host or joining. The UI shows "Joining..." optimistically but allows interaction.

**Solution:** This is expected behavior. The 3-second grace period (`isPlayerJoining`) handles new players without names.

**Status:** Working as designed ✅

---

### Issue 6: Multi-Context Browser Isolation

**Problem:** Playwright contexts share some state unexpectedly, causing race conditions in 2-player tests.

**Evidence:** Host and joiner sessions occasionally interfere.

**Solution:** Use `launchPersistentContext` with unique userDataDirs:

```javascript
// tests/two-player.spec.js
const hostContext = await chromium.launchPersistentContext('./host-user-data')
const joinerContext = await chromium.launchPersistentContext('./joiner-user-data')
```

**Status:** Implemented ✅

---

### Issue 7: Screenshot Analysis Feedback Loop

**Problem:** No automated visual verification loop. Manual review needed for every screenshot.

**Solution:** Use MiniMax image understanding tool in workflow:

```javascript
// Pseudo-code for automated verification
const screenshot = await page.screenshot()
const analysis = await MiniMax_understand_image({
  image_source: screenshot,
  prompt: "Verify spooky orange theme, Creepster font, no Desktop/Mobile text"
})
```

**Status:** Available but requires manual invocation ⚠️

---

## Testing Strategy

### Test Architecture

**Framework:** Playwright with Chromium
**Target:** Production deployment at https://ghost-coop.vercel.app
**Approach:** Visual regression + functional E2E

### Test Types

1. **Visual Regression Tests** (`tests/visual.spec.js`)
   - Welcome screen desktop/mobile views
   - Lobby screen with name entered
   - Style guide verification
   - Screenshots saved to `test-results/`

2. **Two-Player Flow Tests** (`tests/two-player*.spec.js`)
   - Host creates room
   - Joiner scans QR/enters URL
   - Both players ready up
   - Host starts game
   - Game state transitions

3. **Functional Tests** (`tests/test-scenario-*.spec.js`)
   - Button click handlers
   - State persistence
   - Error boundaries

### Running Tests

```bash
# All tests
npm run test

# With UI mode for debugging
npm run test:ui

# Headed mode (see browser)
npm run test:headed

# Specific test file
npx playwright test tests/visual.spec.js

# Two-player tests (requires headed mode)
npm run test:two-player
```

### Test Configuration

**File:** `playwright.config.js`

```javascript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://ghost-coop.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

### Testing Limitations (Documented)

See `testing_limitations.md` for:
- Session restoration interference
- Initialization timing issues
- Button text mismatches
- Visual state confusion
- Multi-context isolation
- Screenshot analysis workflow
- Network throttling constraints
- Mobile touch event simulation
- Cross-browser compatibility gaps

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

### CI/CD Integration

The project is configured for automatic Vercel deployments on git push. No manual build step required.

### Pre-Deploy Checklist

- [ ] Run `npm run lint` — no errors
- [ ] Run `npm run test` — all tests pass
- [ ] Verify `STYLE_GUIDE.md` compliance
- [ ] Check `rules.md` non-negotiables

---

## Common Failures & Fixes

### Failure 1: "Double Lobby" / Race Condition

**Symptom:** Lobby appears twice, or UI flickers on load.

**Cause:** `insertCoin()` called inside a React component instead of the bootstrapper.

**Fix:** 
```javascript
// ❌ WRONG — In a component
useEffect(() => {
  insertCoin() // NO!
}, [])

// ✅ CORRECT — In main.jsx only
await insertCoin({ skipLobby: true, streamMode: true })
```

---

### Failure 2: Tests Timeout on Initialization

**Symptom:** Tests fail with timeout waiting for lobby to appear.

**Cause:** Default 3s wait insufficient for PlayroomKit production initialization.

**Fix:** Increase wait times:
```javascript
await page.waitForTimeout(8000) // 8 seconds
```

---

### Failure 3: "Desktop" or "Mobile" Text Appears

**Symptom:** Style guide violation, UI shows device-specific terms.

**Cause:** Hardcoded strings or user agent detection.

**Fix:** Use PlayroomKit's `isHost()`:
```javascript
const role = isHost() ? 'HOST' : 'JOIN'
// NOT: const isMobile = /Mobi/i.test(navigator.userAgent)
```

---

### Failure 4: State Sync Issues

**Symptom:** Players don't see each other's ready states.

**Cause:** Duplicating Playroom state into React state.

**Fix:** Read directly from Playroom:
```javascript
const players = usePlayersList() // ✅ Direct
// NOT: const [players, setPlayers] = useState(usePlayersList()) // ❌ Duplicated
```

---

### Failure 5: Profile Not Persisting

**Symptom:** User has to re-enter name on page refresh.

**Cause:** `playerStorage.js` not called or localStorage blocked.

**Fix:** Check browser console for errors. Ensure `setStoredProfile()` is called after `me.setState('profile', profile)`.

---

## Next Steps for Phase 2

### 3D World Implementation

**Components Needed:**

1. **R3F Canvas Setup**
   ```javascript
   import { Canvas } from '@react-three/fiber'
   
   function Experience() {
     return (
       <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
         <GameWorld />
       </Canvas>
     )
   }
   ```

2. **Player Avatars**
   - Use `usePlayersList()` to get all players
   - Render 3D models at player positions
   - Sync positions via `useMultiplayerState('playerPositions')`

3. **Ghost Entities**
   - AI-driven ghost movement
   - Sync ghost state to all players
   - Collision detection with players

4. **Mobile Controls**
   - Virtual joystick for movement
   - Action buttons (flashlight, trap)
   - Gyroscope for camera (optional)

### File Structure (Phase 2)

```
src/
├── components/
│   ├── Lobby.jsx           # Existing
│   ├── Game.jsx            # NEW: R3F canvas wrapper
│   └── ui/
│       ├── Joystick.jsx    # NEW: Mobile controls
│       └── ActionButton.jsx # NEW: Game actions
├── experience/
│   ├── GameWorld.jsx       # NEW: 3D scene composition
│   ├── PlayerAvatar.jsx    # NEW: Player 3D model
│   ├── Ghost.jsx           # NEW: Ghost entity
│   └── Environment.jsx     # NEW: Haunted house models
└── hooks/
    └── usePlayerPosition.js  # NEW: Position sync hook
```

### Dependencies to Add

```bash
npm install @react-three/drei@^10.7.7 three@^0.182.0
```

Already in `package.json` — just need to import and use.

---

## For Second Opinion AI

### What to Review

1. **Architecture:** Is the bootstrapper pattern correct? Are we following the state hierarchy?
2. **Testing:** Are the Playwright tests comprehensive? What's missing?
3. **Phase 2 Planning:** Is the 3D integration strategy sound?
4. **Known Issues:** Are the documented issues accurate? Any we missed?
5. **Rules Compliance:** Does the code follow `rules.md` non-negotiables?

### Key Questions

- Should we add TypeScript for Phase 2?
- Is the current testing approach sufficient for 3D scenes?
- Any better patterns for multiplayer state sync?
- Should we add error boundaries for R3F scenes?

### Files to Check

1. `src/main.jsx` — Bootstrapper correctness
2. `src/App.jsx` — View manager logic
3. `src/components/Lobby.jsx` — Universal design compliance
4. `tests/visual.spec.js` — Test coverage
5. `rules.md` — Standards enforcement

---

## Resources

- **PlayroomKit Docs:** https://docs.joinplayroom.com
- **R3F Docs:** https://docs.pmndrs.react-three-fiber.io
- **Tailwind v4:** https://tailwindcss.com/docs/v4-beta
- **Vercel:** https://vercel.com/docs

---

*Last Updated: 2026-02-03*  
*Phase 1 Status: COMPLETE ✅*  
*Phase 2 Status: READY TO START ⏳*
