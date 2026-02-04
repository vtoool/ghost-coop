---
name: visual-testing
description: Automated visual regression testing with AI-powered screenshot analysis for Ecto-Busters
metadata:
  category: testing
  framework: playwright
  project: ecto-busters
---

## What This Skill Does

Automates visual testing workflows using Playwright + AI image understanding to verify:
- UI elements are visible and correctly positioned
- Spooky orange theme (#FF6B35) is consistently applied
- Typography (Creepster + JetBrains Mono) renders correctly
- Layout is responsive across mobile (393x851) and desktop (1280x720)
- No visual glitches or broken elements

## When to Use This Skill

Use this skill when:
- Creating new visual tests for UI components
- Verifying STYLE_GUIDE.md compliance
- Testing responsive design across viewports
- Debugging visual regressions
- Capturing screenshots for documentation

## Best Practices

### Screenshot Timing
```javascript
// Always wait for animations to complete
await page.waitForTimeout(2000)
await page.screenshot({ path: 'test-results/screenshot.png' })
```

### Key States to Capture
1. Welcome screen (before entering name)
2. Lobby screen (after joining)
3. Ready state toggled
4. Both players ready (host sees START button)
5. Mobile viewport layout

### Color Verification
- Primary: #FF6B35 (Neon Pumpkin orange)
- Secondary: #00F0FF (Ectoplasm cyan)
- Background: #050505 (Void black)
- Text: #F0F0F0 (Ghost white)

### Viewport Requirements
- Desktop: 1280x720
- Mobile: 393x851 (Pixel 5)

## Common Patterns

### Screenshot with Verification Loop
```javascript
async function verifyScreenshot(screenshotPath, context) {
  // Use image understanding tool
  const analysis = await analyzeImage(screenshotPath, `
    Analyze this Ecto-Busters ${context} screenshot.
    Check: UI visibility, #FF6B35 orange theme, text readability, layout.
    Respond "lookin good!" if all checks pass.
  `)
  
  if (!analysis.includes('lookin good')) {
    console.error('Visual issues found:', analysis)
    return false
  }
  return true
}
```

### Mobile Touch Target Verification
```javascript
// Ensure buttons are at least 44px for touch
const button = page.locator('button')
const box = await button.boundingBox()
expect(box.height).toBeGreaterThanOrEqual(44)
expect(box.width).toBeGreaterThanOrEqual(44)
```

## Troubleshooting

**Issue:** Screenshots show "Joining existing game..." indefinitely
**Solution:** Increase wait time to 8000ms+ for PlayroomKit initialization

**Issue:** Room code extraction fails
**Solution:** Use regex `#r=([A-Z0-9]+)` not just hash slice

**Issue:** Animations cause flaky screenshots
**Solution:** Use `await page.waitForTimeout(2000)` after state changes

## Tools Available

- Playwright screenshot API
- MiniMax image understanding
- Viewport configuration helpers
- Color value extractors

## Related Skills

- `multiplayer-sync` - Test real-time state synchronization
- `style-guide-compliance` - Automated STYLE_GUIDE.md verification
