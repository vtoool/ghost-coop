# ECTO-BUSTERS — Agentic Workflow Protocol

> **Universal 2-Player Async Co-op Game**  
> Stack: React + Vite + PlayroomKit + R3F + Tailwind

---

## 🎯 Project Identity

**Name:** Ecto-Busters  
**Type:** Universal Host/Join Async Co-op Game  
**Core Stack:** React 19 + Vite + PlayroomKit + React Three Fiber + TailwindCSS

---

## 📊 Current Status

**Phase 1: COMPLETE** ✅  
Lobby & Connection Architecture — Foundation deployed and stable.

**Phase 2: PENDING** ⏳  
3D Game World Integration (R3F + Drei).

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
│  4. ONLY THEN render React              │
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

## ✅ Memory Log (Completed Features)

### Phase 1: Foundation
- [x] **Visual Design System**
  - [x] STYLE_GUIDE.md created with spooky orange theme
  - [x] Color palette defined (Void Black, Neon Pumpkin, Ectoplasm Cyan)
  - [x] Typography specified (Creepster, JetBrains Mono)
  - [x] Animation guidelines (floating, pulsing, grain texture)

- [x] **Environment Setup**
  - [x] Vite + React 19 project initialized
  - [x] Playroom Kit integration with async bootstrapper
  - [x] Tailwind CSS v4 configured with PostCSS
  - [x] Mobile-first CSS resets (no-scroll, no-select)
  - [x] Vercel CLI deployment pipeline

- [x] **Lobby & Connection System**
  - [x] Universal Lobby UI (Host/Join agnostic)
  - [x] Name input with profile state persistence
  - [x] Room code display from URL hash
  - [x] QR Code generation for mobile joining
  - [x] Player list with ready status indicators
  - [x] Ready/Unready toggle system
  - [x] Host-only start button with validation
  - [x] Game state transition (lobby → game)

- [x] **Testing Infrastructure**
  - [x] Playwright E2E setup with Chromium
  - [x] Visual regression tests (lobby-debug.png)
  - [x] Mobile and desktop viewport testing
  - [x] Automated screenshot capture

- [x] **Developer Experience**
  - [x] Zustand store for UI state
  - [x] `cn()` utility for Tailwind class merging
  - [x] Type-safe component patterns
  - [x] Error boundary in bootstrapper

### Phase 2: 3D World (Pending)
- [ ] R3F scene setup with canvas
- [ ] Drei helpers (OrbitControls, Environment, etc.)
- [ ] Player avatars/presence in 3D
- [ ] Game mechanics (ghost hunting)
- [ ] Mobile controls (virtual joystick)

---

## 🚀 Deployment

**Platform:** Vercel  
**Live URL:** https://ghost-coop.vercel.app  
**Pipeline:** `git push` → Vercel build → Live URL  
**Local Testing:** `npx playwright test` (visual regression)

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
| `index.html` | Loading spinner CSS (shows while Playroom initializes) |
| `src/main.jsx` | **Gatekeeper** — polls until network 100% ready before rendering React |
| `src/App.jsx` | View manager (lobby vs game), mounts DebugOverlay |
| `src/components/Lobby.jsx` | Universal lobby UI (dumb component, assumes network ready) |
| `src/components/DebugOverlay.jsx` | Real-time connection monitor (player ID, host status, phase) |
| `src/stores/useGameStore.js` | Zustand store for UI state |
| `tests/visual.spec.js` | Playwright visual tests |
| `rules.md` | Coding standards and best practices |
| `STYLE_GUIDE.md` | Visual design system and UI specifications |

---

## 🔒 Non-Negotiables

1. **Network Gate Pattern** — `insertCoin()` in `main.jsx` ONLY, poll for `myPlayer().id` before `createRoot()`
2. **Dumb UI Components** — App/Lobby assume network ready, no defensive null checks
3. **Universal Design** — Never "Desktop" or "Mobile", always "Host" and "Join"
4. **Mobile First** — `touch-action: none` + `user-select: none` mandatory
5. **State Discipline** — No duplicating Playroom state into React state
6. **Visual Testing** — Playwright tests required for all UI changes
7. **Continuous Self-Improvement** — ALWAYS upgrade capabilities and skills proactively

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

*Last Updated: 2026-02-03*  
*Status: Phase 1 STABLE (Network Gate Pattern Implemented), Ready for Phase 2*
