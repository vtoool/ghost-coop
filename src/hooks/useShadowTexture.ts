import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Hook to create a radial gradient shadow texture for blob shadows
 * @returns A THREE.Texture with a radial gradient shadow
 */
export function useShadowTexture(): THREE.Texture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}
