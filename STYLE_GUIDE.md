# Ecto-Busters Style Guide

> **Visual Design System for the Spooky Co-op Ghost Hunting Experience**

---

## 🎨 Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Void Black** | `#050505` | Primary background |
| **Neon Pumpkin** | `#FF6B35` | Buttons, borders, accents, warnings |
| **Ectoplasm Cyan** | `#00F0FF` | Ready states, ghostly text, success |
| **Ghost White** | `#F0F0F0` | Primary text |
| **Haunted Purple** | `#6B35FF` | Secondary accents |

### Supporting Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Shadow Gray** | `#1A1A1A` | Cards, containers |
| **Deep Orange** | `#CC5629` | Button hover states |
| **Glow Orange** | `rgba(255, 107, 53, 0.4)` | Box shadows, glows |
| **Cyan Glow** | `rgba(0, 240, 255, 0.3)` | Ready state glows |

---

## 🔤 Typography

### Font Families

```css
/* Headlines - Spooky Display */
@import url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');
font-family: 'Creepster', cursive;

/* UI/Equipment - Technical Monospace */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
font-family: 'JetBrains Mono', monospace;
```

### Type Scale

| Element | Font | Size | Weight | Letter-Spacing |
|---------|------|------|--------|----------------|
| **H1 Title** | Creepster | 4rem (64px) | 400 | 0.05em |
| **H2 Section** | Creepster | 2rem (32px) | 400 | 0.03em |
| **H3 Label** | JetBrains Mono | 1.25rem (20px) | 700 | 0.1em |
| **Body** | JetBrains Mono | 1rem (16px) | 400 | 0.02em |
| **Small/Caption** | JetBrains Mono | 0.875rem (14px) | 400 | 0.05em |
| **Button** | JetBrains Mono | 1.125rem (18px) | 700 | 0.1em |

---

## 🎭 UI Components

### Buttons

#### Primary Button (Neon Pumpkin)
```css
.btn-primary {
  background: linear-gradient(135deg, #FF6B35 0%, #CC5629 100%);
  border: 2px solid #FF6B35;
  color: #050505;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 
    0 0 20px rgba(255, 107, 53, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 40px rgba(255, 107, 53, 0.6),
    0 4px 20px rgba(255, 107, 53, 0.3);
}
```

#### Ghost Button (Outline)
```css
.btn-ghost {
  background: transparent;
  border: 2px solid #FF6B35;
  color: #FF6B35;
  /* ... same typography ... */
}

.btn-ghost:hover {
  background: rgba(255, 107, 53, 0.1);
  box-shadow: 0 0 30px rgba(255, 107, 53, 0.3);
}
```

#### Ready State Button (Ectoplasm Cyan)
```css
.btn-ready {
  background: linear-gradient(135deg, #00F0FF 0%, #00B8C4 100%);
  border: 2px solid #00F0FF;
  color: #050505;
  box-shadow: 
    0 0 30px rgba(0, 240, 255, 0.5),
    0 0 60px rgba(0, 240, 255, 0.2);
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Cards (Player List Items)

```css
.player-card {
  background: linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%);
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: float 6s ease-in-out infinite;
}

.player-card:hover {
  border-color: rgba(255, 107, 53, 0.6);
  box-shadow: 
    0 8px 30px rgba(255, 107, 53, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Ghost Trap QR Code Container

```css
.ghost-trap {
  position: relative;
  background: #0A0A0A;
  border: 3px solid #FF6B35;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 
    0 0 40px rgba(255, 107, 53, 0.3),
    inset 0 0 60px rgba(255, 107, 53, 0.05);
}

/* Corner brackets for containment unit look */
.ghost-trap::before,
.ghost-trap::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #FF6B35;
}

.ghost-trap::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.ghost-trap::after {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
}
```

---

## ✨ Animations

### 1. Floating Animation (Player Cards)

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.player-card {
  animation: float 6s ease-in-out infinite;
}

/* Stagger animations for multiple cards */
.player-card:nth-child(1) { animation-delay: 0s; }
.player-card:nth-child(2) { animation-delay: 1.5s; }
.player-card:nth-child(3) { animation-delay: 3s; }
.player-card:nth-child(4) { animation-delay: 4.5s; }
```

### 2. Pulsing Glow (Start Button)

```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(255, 107, 53, 0.4),
      0 0 40px rgba(255, 107, 53, 0.2);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 107, 53, 0.8),
      0 0 80px rgba(255, 107, 53, 0.4);
  }
}

.btn-start {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### 3. Grain/Noise Texture Overlay

```css
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
```

### 4. Flicker Effect (Ghostly Text)

```css
@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
  52% { opacity: 0.3; }
  54% { opacity: 1; }
  90% { opacity: 0.9; }
}

.text-ghostly {
  animation: flicker 4s ease-in-out infinite;
}
```

---

## 📐 Layout Principles

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 0.25rem (4px) | Tight gaps |
| **sm** | 0.5rem (8px) | Icon spacing |
| **md** | 1rem (16px) | Default padding |
| **lg** | 1.5rem (24px) | Card padding |
| **xl** | 2rem (32px) | Section gaps |
| **2xl** | 3rem (48px) | Major sections |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| **sm** | 4px | Small elements |
| **md** | 8px | Buttons, inputs |
| **lg** | 12px | Cards |
| **xl** | 16px | Large containers |
| **full** | 9999px | Circles, pills |

---

## 🎮 Screen-Specific Guidelines

### Welcome Screen

- **Background:** Void Black with subtle radial gradient from center
- **Title:** Creepster font, 4rem, Neon Pumpkin color
- **Subtitle:** JetBrains Mono, Ectoplasm Cyan
- **Input:** Ghost button style, full width
- **Enter Button:** Primary button style, pulsing glow

### Lobby Screen

- **Header:** Sticky top, title + room code badge
- **QR Code:** Ghost Trap container with corner brackets
- **Player List:** Floating cards, staggered animation
- **Status Indicators:** 
  - Waiting: Yellow dot, pulsing
  - Ready: Cyan dot, steady glow
- **Action Buttons:** Full width, stacked vertically
- **Start Button:** Only visible to HOST, disabled until all ready

---

## ⚠️ UI Text Constraints

**CRITICAL:** Never use "Desktop" or "Mobile"

| Instead of... | Use... |
|---------------|--------|
| "Desktop Host" | "HOST" |
| "Mobile Join" | "JOIN" |
| "Desktop View" | "STREAMER VIEW" |
| "Mobile Controller" | "CONTROLLER VIEW" |

---

## 🧪 Testing Checklist

Visual tests must verify:

- [ ] Title uses Creepster font correctly
- [ ] All body text uses JetBrains Mono
- [ ] Orange glow effects render properly
- [ ] Cyan ready states are visible
- [ ] Grain texture overlay is subtle (3% opacity)
- [ ] Floating animations work on player cards
- [ ] Pulsing glow on Start Game button
- [ ] QR code has ghost trap styling
- [ ] Mobile viewport shows correct layout
- [ ] No "Desktop" or "Mobile" text appears
- [ ] HOST/JOIN terminology is used correctly

---

*Version: 1.0*  
*Last Updated: 2026-02-01*  
*Status: Active Design System*
