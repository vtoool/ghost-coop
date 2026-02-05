import { useRef, useState, useEffect, useMemo } from 'react'
import type { ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMultiplayerState, isHost } from 'playroomkit'
import type { GhostPosition } from '../types/game.types'

export default function Ghost(): ReactElement {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Sprite>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const [targetPos, setTargetPos] = useState<GhostPosition>({ x: 0, y: 1.5, z: 0 })
  const [ghostPos, setGhostPos] = useMultiplayerState<GhostPosition>('ghostPos', { x: 0, y: 1.5, z: 0 })

  // Host controls ghost movement (CPU mode)
  const isGhostController = isHost()

  const ghostTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    if (!ctx) return new THREE.CanvasTexture(canvas)

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.9)')
    gradient.addColorStop(0.4, 'rgba(0, 200, 255, 0.5)')
    gradient.addColorStop(0.7, 'rgba(0, 150, 255, 0.2)')
    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.set(ghostPos.x, ghostPos.y, ghostPos.z)
      const time = state.clock.getElapsedTime()
      meshRef.current.position.y += Math.sin(time * 2) * 0.1
    }

    if (glowRef.current && meshRef.current) {
      glowRef.current.position.copy(meshRef.current.position)
    }

    if (lightRef.current && meshRef.current) {
      lightRef.current.position.copy(meshRef.current.position)
    }
  })

  // Host ghost wandering AI - updates target position periodically
  useEffect(() => {
    if (!isGhostController) return

    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2
      const distance = 3 + Math.random() * 5
      setTargetPos({
        x: Math.cos(angle) * distance,
        y: 1.5,
        z: Math.sin(angle) * distance
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [isGhostController])

  // Move ghost toward target position (host only)
  useEffect(() => {
    if (!isGhostController) return

    const interval = setInterval(() => {
      setGhostPos((prev: GhostPosition) => ({
        x: prev.x + (targetPos.x - prev.x) * 0.02,
        y: targetPos.y,
        z: prev.z + (targetPos.z - prev.z) * 0.02
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [isGhostController, targetPos, setGhostPos])

  return (
    <group>
      <mesh ref={meshRef} position={[ghostPos.x, ghostPos.y, ghostPos.z]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      <sprite ref={glowRef} scale={[2, 2, 1]}>
        <spriteMaterial
          map={ghostTexture}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <pointLight
        ref={lightRef}
        color="#00f0ff"
        intensity={2}
        distance={6}
        decay={2}
      />
    </group>
  )
}
