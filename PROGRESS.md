# Performance Optimization Progress

## Before vs After

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| FPS | 30-50 | 60 | ✅ Fixed |
| Frame Time | >20ms | 16.67ms | ✅ Fixed |
| Active Lights | Many (embedded in GLTFs) | 3 | ✅ Fixed |
| Emissive Meshes | 121 | 3 | ✅ Fixed |
| Render Calls | High | 29-48 | ✅ Optimized |
| Geometries | High | 18 | ✅ Optimized |
| Textures | High | 6 | ✅ Optimized |

## Remaining Emissive Meshes (3 total - acceptable)

These are the player character meshes, which intentionally have a slight glow:

1. `unknown/unnamed: intensity=1` - Part of character setup
2. `character-male-a_1/body-mesh: intensity=1` - Body mesh
3. `character-male-a_1/head-mesh: intensity=1` - Head mesh

## Changes Applied

### 1. Emissive Removal from Environment Props
**File:** `src/experience/MapRenderer.jsx`

Added code to clear emissive properties when cloning GLTF materials:
```jsx
child.material.emissive = new THREE.Color(0x000000)
child.material.emissiveIntensity = 0
```

This removed 118 emissive meshes from environment props (lanterns, trees, graves).

### 2. Glow Sprites for Lanterns
**File:** `src/experience/MapRenderer.jsx`

Replaced GPU-heavy emissive lantern materials with performance-friendly glow sprites:
- Single cached texture (module-level) for all lanterns
- Canvas-generated radial gradient
- `THREE.AdditiveBlending` for realistic glow
- Position: `y + 0.3` (centered on candle flame)
- Scale: `0.8` (smaller, more subtle glow)

### 3. Hero Light & Blob Shadow
**File:** `src/experience/HunterController.jsx`

Added performant player illumination:
- `pointLight` follows player: `color="#ffaa44"`, `intensity=12`, `distance=10`
- Blob shadow under player (fake shadow, no shadow map needed)

### 4. Enhanced Performance Logging
**File:** `src/hooks/usePerformanceLogger.jsx`

Added detailed emissive audit logging to identify sources:
```
[Emissive Audit] Total: 3 meshes with emissive
  [1] unknown/unnamed: intensity=1
  [2] character-male-a_1/body-mesh: intensity=1
  [3] character-male-a_1/head-mesh: intensity=1
```

## Performance Impact

| Change | Impact |
|--------|--------|
| Removed 118 emissive meshes | Major GPU savings |
| Removed Bloom post-processing | Major GPU savings |
| Single cached glow texture | Minimal memory |
| Hero light (1 point light) | Minimal GPU |
| Blob shadow (fake) | No shadow map cost |

## Key Metrics (Live)

```
FPS: 60 (target: 60)
Frame time: 16.67ms (min: 10.40ms, max: 33.50ms)
Render calls: 29-48
Geometries: 18
Textures: 6
Active lights: 3
Emissive meshes: 3 (player character only)
```

## Next Steps

- [ ] Consider removing remaining 3 emissive meshes from player character (optional)
- [ ] Phase 3: Ghost entity and Operator role implementation
- [ ] Phase 3: Capture mechanics for ghost hunting
