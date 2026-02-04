---
name: style-guide-compliance
description: Automated verification of STYLE_GUIDE.md requirements for Ecto-Busters
metadata:
  category: quality
  reference: STYLE_GUIDE.md
  project: ecto-busters
---

## What This Skill Does

Automated checks to ensure all UI implementations comply with STYLE_GUIDE.md:
- Color palette verification (#FF6B35, #00F0FF, #050505)
- Typography checks (Creepster, JetBrains Mono)
- Animation validation (floating, pulsing, glows)
- Universal Design compliance (no "Desktop/Mobile" text)
- Mobile-first layout verification

## When to Use This Skill

Use this skill when:
- Reviewing new UI implementations
- Checking Pull Requests for style compliance
- Verifying refactored components
- Auditing existing UI for consistency
- Pre-deployment quality checks

## Automated Checks

### Color Palette
```javascript
// Verify computed styles match STYLE_GUIDE.md
const title = page.locator('h1')
const color = await title.evaluate(el => 
  window.getComputedStyle(el).color
)
// Should be rgb(255, 107, 53) or #FF6B35
expect(color).toContain('255')
```

### Typography
- **Titles:** Creepster font family
- **UI Text:** JetBrains Mono
- **Body:** System sans-serif fallback

### Universal Design Check
```javascript
// CRITICAL: Never "Desktop" or "Mobile"
const bodyText = await page.locator('body').textContent()
expect(bodyText).not.toMatch(/Desktop|Mobile/i)

// Must use "HOST MODE" or "JOIN MODE"
const roleBadge = await page.locator('.room-code').textContent()
expect(roleBadge).toMatch(/HOST MODE|JOIN MODE/i)
```

### Animation Requirements
- Floating player cards: `animate-float` class
- Pulsing glows: `animate-pulse-glow` class  
- Flicker effects: `animate-flicker` class
- Grain texture: `.noise-overlay` present

### Mobile Requirements
- Viewport meta tag present
- `touch-action: none` CSS
- `user-select: none` CSS
- No horizontal scroll (`overflow-x-hidden`)
- Touch targets minimum 44px

## Quick Verification Commands

### Check Orange Theme
```javascript
const hasOrangeTheme = await page.evaluate(() => {
  const h1 = document.querySelector('h1')
  const style = window.getComputedStyle(h1)
  return style.color.includes('255, 107') || 
         style.color.includes('rgb(255')
})
expect(hasOrangeTheme).toBe(true)
```

### Check Mobile Compliance
```javascript
// Verify no Desktop/Mobile text
const violations = await page.evaluate(() => {
  const text = document.body.innerText
  const badTerms = ['Desktop', 'Mobile', 'desktop', 'mobile']
  return badTerms.filter(term => text.includes(term))
})
expect(violations).toEqual([])
```

### Check Typography
```javascript
const fonts = await page.evaluate(() => {
  const h1 = document.querySelector('h1')
  const ui = document.querySelector('.font-mono')
  return {
    title: window.getComputedStyle(h1).fontFamily,
    ui: window.getComputedStyle(ui).fontFamily
  }
})
expect(fonts.title).toContain('Creepster')
expect(fonts.ui).toContain('JetBrains Mono')
```

## Style Guide Reference

### Colors
- **Void Black:** #050505, #0A0A0A, #1A1A1A
- **Neon Pumpkin:** #FF6B35 (primary)
- **Ectoplasm Cyan:** #00F0FF (accent)
- **Ghost White:** #F0F0F0 (text)
- **Warning Yellow:** #FFD700 (waiting states)

### Typography
- **Display:** Creepster (Google Fonts)
- **Monospace:** JetBrains Mono
- **Weights:** Normal (400), Bold (700)

### Effects
- Orange glow: `text-shadow: 0 0 10px #FF6B35`
- Cyan glow: `text-shadow: 0 0 10px #00F0FF`
- Grain overlay: CSS noise texture

## Common Violations

1. **Using "Desktop/Mobile" text** - Use "Host/Join" instead
2. **Wrong orange shade** - Must be #FF6B35 exactly
3. **Missing animations** - Player cards should float
4. **Wrong fonts** - Titles must use Creepster
5. **No touch-action** - Mobile needs `touch-action: none`

## Related Skills

- `visual-testing` - Screenshot capture and verification
- `multiplayer-sync` - Test state synchronization
