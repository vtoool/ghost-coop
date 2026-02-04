---
name: multiplayer-sync
description: Testing real-time multiplayer state synchronization for PlayroomKit games
metadata:
  category: testing
  framework: playroomkit
  project: ecto-busters
---

## What This Skill Does

Provides patterns and best practices for testing 2+ player real-time interactions:
- Player join/leave synchronization
- Ready state propagation across clients
- Game state transitions (lobby → game)
- Bidirectional state sync verification
- Race condition detection

## When to Use This Skill

Use this skill when:
- Testing 2+ player interactions
- Verifying state synchronization across clients
- Testing ready states and game start flow
- Debugging multiplayer connectivity issues
- Testing host/joiner role-specific behaviors

## Best Practices

### Browser Context Isolation
```javascript
// CRITICAL: Use separate contexts, not just pages
const hostContext = await chromium.launchPersistentContext('', {
  viewport: { width: 1280, height: 720 }
})

const joinerContext = await chromium.launchPersistentContext('', {
  viewport: { width: 393, height: 851 }
})
```

### Synchronization Timing
```javascript
// Wait 2-3 seconds after state changes
await hostReadyButton.click()
await hostPage.waitForTimeout(2000)

// Then verify joiner sees the change
await expect(joinerPage.locator('text=/GhostHost.*READY/i')).toBeVisible()
```

### Bidirectional Verification
Always verify BOTH directions:
1. Host action → Joiner sees update
2. Joiner action → Host sees update

### Session Cleanup
```javascript
test.afterAll(async () => {
  await hostContext?.close()
  await joinerContext?.close()
})
```

## Common Test Patterns

### Host + Joiner Setup
```javascript
test('2-player flow', async () => {
  // 1. Host creates room
  await hostPage.goto(PRODUCTION_URL)
  await hostPage.waitForTimeout(3000)
  await hostPage.locator('input').fill('GhostHost')
  await hostPage.locator('button:has-text("HAUNTED HOUSE")').click()
  
  // 2. Extract room code from URL
  const roomCode = await hostPage.evaluate(() => 
    window.location.hash.match(/#r=([A-Z0-9]+)/)?.[1]
  )
  
  // 3. Joiner connects
  await joinerPage.goto(`${PRODUCTION_URL}/#r=${roomCode}`)
  await joinerPage.waitForTimeout(3000)
  await joinerPage.locator('input').fill('GhostJoiner')
  await joinerPage.locator('button:has-text("HAUNTED HOUSE")').click()
  
  // 4. Verify both see each other
  await expect(hostPage.locator('text=/GhostJoiner/i')).toBeVisible()
  await expect(joinerPage.locator('text=/GhostHost/i')).toBeVisible()
})
```

### Ready State Synchronization
```javascript
// Host marks ready
await hostPage.locator('button:has-text("READY FOR HAUNT")').click()
await hostPage.waitForTimeout(2000)

// Verify joiner sees host ready
await expect(joinerPage.locator('text=/GhostHost.*READY/i')).toBeVisible()

// Joiner marks ready
await joinerPage.locator('button:has-text("READY FOR HAUNT")').click()
await joinerPage.waitForTimeout(2000)

// Verify host sees START GHOST HUNT button enabled
await expect(hostPage.locator('button:has-text("START GHOST HUNT")')).toBeEnabled()
```

## Critical Implementation Details

### PlayroomKit Initialization
- Takes 8-15 seconds in production
- Automatically restores sessions from IndexedDB
- Use incognito mode for clean tests

### Room Code Format
- Format: `#r=XXXXX` (not `#XXXXX`)
- Extract with: `window.location.hash.match(/#r=([A-Z0-9]+)/)?.[1]`

### State Propagation Delay
- Typical sync time: 1-2 seconds
- Maximum wait: 5 seconds
- Add `waitForTimeout(2000)` between actions and assertions

## Troubleshooting

**Issue:** Players don't see each other
**Solution:** Check room codes match exactly, verify both contexts are on same URL

**Issue:** State changes don't propagate
**Solution:** Wait longer (3-5s) between action and verification

**Issue:** Session pollution from previous tests
**Solution:** Clear IndexedDB or use incognito contexts

## Related Skills

- `visual-testing` - Screenshot verification
- `style-guide-compliance` - UI consistency checks
