import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { myPlayer, useMultiplayerState, isHost } from 'playroomkit'

export default function Ghost({ isOperator = false }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const [targetPos, setTargetPos] = useState({ x: 0, y: 1.5, z: 0 })
  const ghostPos = useMultiplayerState('ghostPos', { x: 0, y: 1.5, z: 0 })
  const isGhostPlayer = useRef(false)

  useEffect(() => {
    const player = myPlayer()
    const roles = player?.getState('roles')
    if (roles?.ghost === player?.id) {
      isGhostPlayer.current = true
    }
  }, [])

  const ghostTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')

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

  useFrame((state, delta) => {
    if (isGhostPlayer.current && meshRef.current) {
      const time = state.clock.getElapsedTime()
      const bobY = Math.sin(time * 2) * 0.1
      const swayX = Math.sin(time * 1.5) * 0.15
      const swayZ = Math.cos(time * 1.2) * 0.15

      const newX = targetPos.x + swayX
      const newY = targetPos.y + bobY
      const newZ = targetPos.z + swayZ

      meshRef.current.position.set(newX, newY, newZ)
      meshRef.current.rotation.y += delta * 0.5

      myPlayer().setState('ghostPos', { x: newX, y: newY, z: newZ })
    } else if (meshRef.current) {
      meshRef.current.position.set(ghostPos.x, ghostPos.y, ghostPos.z)
      const time = state.clock.getElapsedTime()
      meshRef.current.position.y += Math.sin(time * 2) * 0.1
    }

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position)
    }
  })

  useEffect(() => {
    if (isGhostPlayer.current) {
      const interval = setInterval(() => {
        const angle = Math.random() * Math.PI * 2
        const distance = 3 + Math.random() * 5
        setTargetPos(prev => ({
          x: prev.x + Math.cos(angle) * distance * 0.3,
          y: 1.5,
          z: prev.z + Math.sin(angle) * distance * 0.3
        }))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [])

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
        ref={glowRef}
        color="#00f0ff"
        intensity={2}
        distance={6}
        decay={2}
      />
    </group>
  )
}
