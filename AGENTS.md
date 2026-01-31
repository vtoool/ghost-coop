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

### Manager Pattern
```
main.jsx (Bootstrapper) 
  ↓
GameManager (Zustand Store)
  ↓
├── Interface (UI Layer) — React components
└── Experience (3D Layer) — R3F scene
```

### Networking Hierarchy
**Playroom Kit = Source of Truth**
- `useMultiplayerState()` — Global game state (e.g., `gameStart`)
- `myPlayer().setState()` — Player-specific state (e.g., `profile`, `ready`)
- `usePlayersList()` — All connected players

### State Discipline
| State Type | Store | Access Pattern |
|------------|-------|----------------|
| UI State | Zustand | `useGameStore()` |
| Multiplayer | Playroom | `useMultiplayerState()` |
| Player Data | Playroom | `myPlayer().getState()` |

**Rule:** Never duplicate multiplayer state into local React state.

---

## ✅ Memory Log (Completed Features)

### Phase 1: Foundation
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
**Live URL:** https://ecto-busters.vercel.app  
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
| `src/main.jsx` | Bootstrapper — initializes Playroom before React |
| `src/stores/useGameStore.js` | Zustand store for UI state |
| `src/App.jsx` | View manager (lobby vs game) |
| `src/components/Lobby.jsx` | Universal lobby UI |
| `tests/visual.spec.js` | Playwright visual tests |
| `rules.md` | Coding standards and best practices |

---

## 🔒 Non-Negotiables

1. **No Race Conditions** — `insertCoin()` only in `main.jsx` bootstrapper
2. **Universal Design** — Never "Desktop" or "Mobile", always "Host" and "Join"
3. **Mobile First** — `touch-action: none` + `user-select: none` mandatory
4. **State Discipline** — No duplicating Playroom state into React state
5. **Visual Testing** — Playwright tests required for all UI changes

---

*Last Updated: 2026-01-31*  
*Status: Phase 1 Complete, Ready for Phase 2*
