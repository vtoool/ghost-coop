import { useMemo, useEffect, useRef, useState } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'

const DEBUG_LANTERNS = true

let glowTextureCache = null

function getGlowTexture() {
  if (!glowTextureCache) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255, 170, 68, 1)')
    gradient.addColorStop(0.3, 'rgba(255, 170, 68, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 170, 68, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    glowTextureCache = new THREE.CanvasTexture(canvas)
    glowTextureCache.colorSpace = THREE.SRGBColorSpace
  }
  return glowTextureCache
}

function GlowSprite({ position }) {
  const texture = useMemo(() => getGlowTexture(), [])
  return (
    <sprite position={position} scale={[0.8, 0.8, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  )
}

function MapTile({ name, position, texture, onLanternDetected }) {
  const { scene } = useGLTF(`/models/environment/${name}.glb`)
  const detectedRef = useRef(false)

  useEffect(() => {
    let lightsFound = 0
    scene.traverse((obj) => {
      if (obj.isLight) {
        obj.parent?.remove(obj)
        lightsFound++
      }
    })
    if (lightsFound > 0 && DEBUG_LANTERNS) {
      console.log(`[GLTF Audit] ${name}: removed ${lightsFound} embedded lights`)
    }
  }, [scene, name])

  useEffect(() => {
    if (detectedRef.current) return

    const isLanternName = name.toLowerCase().includes('lantern') || name.toLowerCase().includes('lamp')

    if (!isLanternName) return

    scene.traverse((child) => {
      if (child.isMesh && !detectedRef.current) {
        const glowPos = [
          position[0],
          position[1] + 0.15,
          position[2]
        ]
        detectedRef.current = true

        if (DEBUG_LANTERNS) {
          console.log(`[MapTile] LANTERN: ${name} at ${JSON.stringify(glowPos)}`)
        }

        onLanternDetected(glowPos)
      }
    })
  }, [scene, name, position, onLanternDetected])

  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = texture
        child.material.emissive = new THREE.Color(0x000000)
        child.material.emissiveIntensity = 0
        child.castShadow = false
        child.receiveShadow = false
      }
    })
    return c
  }, [scene, texture])

  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <primitive object={clone} />
    </RigidBody>
  )
}

export function MapRenderer() {
  const [lanternPositions, setLanternPositions] = useState([])
  const graveyardTx = useTexture('/models/environment/Textures/colormap_graveyard.png')

  // Texture configuration - safe to modify after load
  if (graveyardTx) {
    // eslint-disable-next-line
    graveyardTx.colorSpace = THREE.SRGBColorSpace
    // eslint-disable-next-line
    graveyardTx.flipY = false
  }

  const gridSize = 2
  const width = level1[0].length
  const height = level1.length

  const mapWidth = width * gridSize
  const mapHeight = height * gridSize

  const offsetX = mapWidth / 2
  const offsetZ = mapHeight / 2

  const handleLanternDetected = (pos) => {
    setLanternPositions(prev => {
      const exists = prev.some(p => p[0] === pos[0] && p[2] === pos[2])
      if (exists) return prev
      if (DEBUG_LANTERNS) {
        console.log(`[MapRenderer] Added lantern at ${JSON.stringify(pos)}`)
      }
      return [...prev, pos]
    })
  }

  const props = level1.flatMap((row, z) =>
    row.split('').map((_, x) => {
      const name = mapLegend[row[x]]
      if (!name) return null

      const posX = (x * gridSize) - offsetX + (gridSize / 2)
      const posZ = (z * gridSize) - offsetZ + (gridSize / 2)

      return (
        <MapTile
          key={`prop-${x}-${z}`}
          name={name}
          position={[posX, 0, posZ]}
          texture={graveyardTx}
          onLanternDetected={handleLanternDetected}
        />
      )
    })
  )

  const glowSprites = lanternPositions.map((pos, i) => (
    <GlowSprite key={`glow-${i}`} position={pos} />
  ))

  if (DEBUG_LANTERNS) {
    console.log(`[MapRenderer] Rendering ${lanternPositions.length} glow sprites`)
  }

  return (
    <group>
      <mesh name="ground" position={[0, -0.5, 0]}>
        <boxGeometry args={[mapWidth, 1, mapHeight]} />
        <meshStandardMaterial color="#2d4a2d" roughness={0.8} metalness={0} />
      </mesh>

      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders={false}>
        <CuboidCollider args={[mapWidth / 2, 0.5, mapHeight / 2]} />
      </RigidBody>

      <group>{props}</group>

      <group>{glowSprites}</group>
    </group>
  )
}
