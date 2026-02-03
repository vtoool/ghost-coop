# Rules & Best Practices — Ecto-Busters

> **STRICT COMMANDMENTS for AI Agents Working on This Codebase**

---

## 1. No Race Conditions 🚫

**NEVER** call `insertCoin()` inside a React component.

**ALWAYS** use the `main.jsx` async bootstrapper pattern:

```javascript
// ✅ CORRECT — main.jsx
async function bootstrap() {
  await insertCoin({ skipLobby: true, streamMode: true })
  createRoot(document.getElementById('root')).render(<App />)
}
bootstrap()

// ❌ WRONG — Never do this in a component
function App() {
  useEffect(() => {
    insertCoin() // NO! Race condition with React lifecycle
  }, [])
}
```

---

## 2. Universal Design 🌐

**NEVER** hardcode "Desktop" or "Mobile" text.

**ALWAYS** use "Host" (Streamer/Controller) and "Join" (Guest/Controller):

```javascript
// ✅ CORRECT
const isHost = isHost()
const isJoiner = !isHost()

// ❌ WRONG
const isDesktop = window.innerWidth > 768
const isMobile = /Mobi|Android/i.test(navigator.userAgent)
```

**UI Labels:**
- "Enter Room" (not "Mobile Join")
- "Host Game" (not "Desktop Host")
- "Scan QR" (not "Mobile Scan")

---

## 3. Mobile First CSS 📱

**MANDATORY** on all interactive game elements:

```css
.game-element {
  touch-action: none;      /* Prevent zoom/scroll */
  user-select: none;       /* Prevent text selection */
  -webkit-user-select: none;
}
```

**Global resets already applied in `index.css`:**
- `overscroll-behavior: none`
- `touch-action: none`
- `user-select: none`

---

## 4. State Discipline 🎯

### State Hierarchy

| State Type | Store | Method |
|------------|-------|--------|
| **UI State** | Zustand | `useGameStore()` |
| **Game State** | Playroom | `useMultiplayerState()` |
| **Player Data** | Playroom | `myPlayer().setState()` |

### ❌ NEVER DO THIS

```javascript
// Anti-pattern: Duplicating multiplayer state
function PlayerList() {
  const [players, setPlayers] = useState([]) // ❌ Duplicating state!
  
  useEffect(() => {
    const list = usePlayersList()
    setPlayers(list) // ❌ Sync bugs galore
  }, [])
}
```

### ✅ CORRECT PATTERN

```javascript
function PlayerList() {
  const players = usePlayersList() // ✅ Direct from source
  
  return (
    <div>
      {players.map(p => (
        <span key={p.id}>{p.getState('profile').name}</span>
      ))}
    </div>
  )
}
```

---

## 5. Visual Testing Required 📸

**MANDATORY** for all UI component changes:

```javascript
// tests/feature-visual.spec.js
import { test, expect } from '@playwright/test'

test('new feature renders correctly', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForSelector('.new-feature')
  await page.screenshot({ path: 'new-feature-debug.png' })
  
  const element = page.locator('.new-feature')
  await expect(element).toBeVisible()
})
```

**Run tests:**
```bash
npx playwright test
```

---

## 6. Component Patterns 🧩

### File Structure

```
src/
├── components/
│   ├── Lobby.jsx           # Main container
│   ├── PlayerList.jsx      # Sub-component (if complex)
│   └── ui/                 # Reusable UI primitives
│       ├── Button.jsx
│       └── Input.jsx
```

### Naming Conventions

- **Components:** PascalCase (`Lobby.jsx`, `PlayerCard.jsx`)
- **Hooks:** camelCase with `use` prefix (`useGameStore.js`)
- **Utilities:** camelCase (`cn.js`, `formatters.js`)
- **Tests:** `*.spec.js` or `*.test.js`

### Tailwind Class Strategy

```javascript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function (already in project)
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Usage
<button className={cn(
  "base-classes",
  conditional && "conditional-classes",
  isActive ? "active-state" : "inactive-state"
)}>
```

---

## 7. Error Handling ⚠️

### Bootstrap Errors

Already handled in `main.jsx`:

```javascript
try {
  await insertCoin({...})
  // Render app
} catch (error) {
  // Show user-friendly error in #root
  document.getElementById('root').innerHTML = `...`
}
```

### Component Errors

Use error boundaries for 3D scenes (R3F ErrorBoundary).

---

## 8. Performance 🚀

- **R3F:** Use `frameloop="demand"` when possible
- **Re-renders:** Use `memo()` for expensive UI components
- **State updates:** Batch Playroom state updates when possible
- **Assets:** Preload 3D models and textures

---

## 9. Git Workflow 🌿

```bash
# Feature branch workflow
git checkout -b feature/3d-world
git add .
git commit -m "feat: add R3F scene with player avatars"
git push origin feature/3d-world

# Deploy to Vercel
vercel --prod
```

---

## 10. Documentation 📚

**Update AGENTS.md when:**
- Completing a feature (add to Memory Log)
- Changing architecture
- Adding new dependencies

**Update rules.md when:**
- Discovering new anti-patterns
- Adding new best practices
- Modifying state management patterns

---

## 11. Always Deploy to Production 🚀

**CRITICAL:** Always deploy changes to Vercel production for testing. Never rely on local dev server for verification.

### Workflow

```bash
# 1. Make changes and commit
git add src/ AGENTS.md README.md

git commit -m "feat: your feature description"

# 2. Push to GitHub
git push origin main

# 3. Deploy to production (REQUIRED)
vercel --prod
```

### Why This Rule Exists

- Local dev doesn't replicate PlayroomKit WebRTC behavior accurately
- Production testing verifies real multiplayer connections
- Eliminates "works on my machine" issues
- User's laptop is too weak for local dev

### URLs

- **Production:** https://ghost-coop.vercel.app
- **Alias:** https://ecto-busters.vercel.app

### After Deploy

1. Open production URL in browser
2. Verify DebugOverlay shows "✓ CONNECTED"
3. Test the feature end-to-end
4. Share URL for multiplayer testing

---

## Quick Reference Card 🎴

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Visual tests | `npx playwright test` |
| Deploy preview | `vercel` |
| Deploy prod | `vercel --prod` |
| Lint | `npm run lint` |

---

*Enforcement: These rules are non-negotiable. Break them, break the game.*
