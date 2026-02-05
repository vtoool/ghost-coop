import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface PerformanceOptions {
  enabled: boolean;
  interval: number;
}

export function usePerformanceLogger(options: PerformanceOptions = { enabled: false, interval: 2000 }): void {
  const { enabled = false, interval = 2000 } = options
  const { gl, scene } = useThree()
  const frameTimes = useRef<number[]>([])
  const lastLogTime = useRef<number>(0)
  const frameCount = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    console.log('[PerformanceLogger] Initialized')
    console.log(`[PerformanceLogger] Active lights: ${countActiveLights(scene)}`)
    console.log(`[PerformanceLogger] Emissive meshes: ${countEmissiveMeshes(scene)}`)

    return () => {
      console.log('[PerformanceLogger] Disposed')
    }
  }, [enabled, scene])

  useFrame((_, delta) => {
    if (!enabled) return

    frameCount.current++
    frameTimes.current.push(delta * 1000)

    const now = performance.now()
    if (now - lastLogTime.current >= interval) {
      logPerformanceMetrics(gl, scene, frameTimes.current)
      frameTimes.current = []
      lastLogTime.current = now
    }
  })
}

function logPerformanceMetrics(gl: THREE.WebGLRenderer, scene: THREE.Scene, frameTimes: number[]): void {
  const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
  const fps = Math.round(1000 / avgFrameTime)
  const minFrameTime = Math.min(...frameTimes)
  const maxFrameTime = Math.max(...frameTimes)

  console.group(`[Performance] ${new Date().toLocaleTimeString()}`)
  console.log(`FPS: ${fps} (target: 60)`)
  console.log(`Frame time: ${avgFrameTime.toFixed(2)}ms (min: ${minFrameTime.toFixed(2)}ms, max: ${maxFrameTime.toFixed(2)}ms)`)
  console.log(`Render calls: ${gl.info.render.calls}`)
  console.log(`Geometries: ${gl.info.memory.geometries}`)
  console.log(`Textures: ${gl.info.memory.textures}`)
  console.log(`Active lights: ${countActiveLights(scene)}`)
  console.log(`Emissive meshes: ${countEmissiveMeshes(scene)}`)
  console.groupEnd()
}

function countActiveLights(object: THREE.Object3D): number {
  let count = 0
  object.traverse((child) => {
    if ((child as THREE.Light).isLight) count++
  })
  return count
}

interface EmissiveMeshInfo {
  name: string;
  parentName: string;
  intensity: number;
}

function countEmissiveMeshes(object: THREE.Object3D): number {
  let count = 0
  const emissiveMeshes: EmissiveMeshInfo[] = []
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh && mesh.material) {
      const material = mesh.material as THREE.MeshStandardMaterial
      const emissiveIntensity = material.emissiveIntensity ?? 0
      if (emissiveIntensity > 0) {
        count++
        emissiveMeshes.push({
          name: child.name || 'unnamed',
          parentName: child.parent?.name || 'unknown',
          intensity: emissiveIntensity
        })
      }
    }
  })
  console.log('[Emissive Audit] Total:', count, 'meshes with emissive')
  emissiveMeshes.forEach((mesh, i) => {
    if (i < 20) {
      console.log(`  [${i + 1}] ${mesh.parentName}/${mesh.name}: intensity=${mesh.intensity}`)
    }
  })
  if (emissiveMeshes.length > 20) {
    console.log(`  ... and ${emissiveMeshes.length - 20} more`)
  }
  return count
}

export function logGLTFAudit(name: string, lightsRemoved: number = 0, emissiveAdded: number = 0): void {
  console.log(`[GLTF Audit] ${name}: removed ${lightsRemoved} embedded lights, added ${emissiveAdded} emissive materials`)
}
