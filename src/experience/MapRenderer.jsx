import { useMemo, useEffect, useState, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'

const DEBUG_LANTERNS = true // Set to false to disable lantern debug logging

function createGlowTexture() {
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
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function GlowSprite({ position }) {
  const glowTexture = useMemo(() => createGlowTexture(), [])
  if (DEBUG_LANTERNS) {
    console.log('[GlowSprite] Rendering at', position)
  }
  return (
    <sprite position={position} scale={[2, 2, 1]}>
      <spriteMaterial
        map={glowTexture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  )
}

export function MapRenderer() {
  const graveyardTx = useTexture('/models/environment/Textures/colormap_graveyard.png')
  graveyardTx.colorSpace = THREE.SRGBColorSpace
  graveyardTx.flipY = false

  const gridSize = 2
  const width = level1[0].length
  const height = level1.length

  const mapWidth = width * gridSize
  const mapHeight = height * gridSize

  const offsetX = mapWidth / 2
  const offsetZ = mapHeight / 2

  if (DEBUG_LANTERNS) {
    console.log('[MapRenderer] Level Map Characters:')
    level1.forEach((row, z) => {
      row.split('').forEach((char, x) => {
        const name = mapLegend[char]
        if (name) {
          console.log(`  [${x},${z}] '${char}' -> ${name}`)
        }
      })
    })
  }

  const props = level1.flatMap((row, z) =>
    row.split('').map((char, x) => {
      const name = mapLegend[char]
      if (!name) return null

      const posX = (x * gridSize) - offsetX + (gridSize / 2)
      const posZ = (z * gridSize) - offsetZ + (gridSize / 2)

      if (DEBUG_LANTERNS) {
        console.log(`[MapRenderer] Creating MapTile: ${name} at [${posX.toFixed(1)}, 0, ${posZ.toFixed(1)}]`)
      }

      return (
        <MapTile
          key={`prop-${x}-${z}`}
          char={char}
          name={name}
          position={[posX, 0, posZ]}
          texture={graveyardTx}
        />
      )
    })
  )

  return (
    <group>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[mapWidth, 1, mapHeight]} />
        <meshStandardMaterial color="#2d4a2d" roughness={0.8} metalness={0} />
      </mesh>

      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders={false}>
        <CuboidCollider args={[mapWidth / 2, 0.5, mapHeight / 2]} />
      </RigidBody>

      <group>{props}</group>
    </group>
  )
}

function MapTile({ char, name, position, texture }) {
  const { scene } = useGLTF(`/models/environment/${name}.glb`)
  const lanternPosRef = useRef(null)
  const isLanternRef = useRef(false)
  const [isLantern, setIsLantern] = useState(false)
  const [lanternPosition, setLanternPosition] = useState(null)
  const [checked, setChecked] = useState(false)

  // Remove embedded lights from GLTF
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

  // Detect lanterns BEFORE clone
  useEffect(() => {
    if (checked) return
    
    let foundLantern = false
    let foundPos = null

    scene.traverse((child) => {
      const isLanternName = name.toLowerCase().includes('lantern') || name.toLowerCase().includes('lamp')
      
      if (DEBUG_LANTERNS && child.isMesh) {
        console.log(`[MapTile] ${name}: checking mesh "${child.name}" isLanternName=${isLanternName}`)
      }

      if (isLanternName && child.isMesh) {
        foundLantern = true
        child.updateWorldMatrix(true, true)
        const worldPos = new THREE.Vector3()
        child.getWorldPosition(worldPos)
        foundPos = [worldPos.x, worldPos.y + 0.5, worldPos.z]
        if (DEBUG_LANTERNS) {
          console.log(`[MapTile] LANTERN DETECTED: ${name} at local=[${position.join(', ')}] world=[${foundPos.join(', ')}]`)
        }
      }
    })

    if (foundLantern) {
      isLanternRef.current = true
      lanternPosRef.current = foundPos
      setIsLantern(true)
      setLanternPosition(foundPos)
    }
    setChecked(true)
  }, [scene, name, position, checked])

  // Clone with material updates (NO emissive!)
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = texture
        child.castShadow = false
        child.receiveShadow = false
        // NO emissive - using glow sprites instead
      }
    })
    return c
  }, [scene, texture])

  if (DEBUG_LANTERNS && isLantern) {
    console.log(`[MapTile] RENDERING: ${name} isLantern=${isLantern} position=${JSON.stringify(lanternPosition)}`)
  }

  return (
    <group>
      <RigidBody type="fixed" colliders="hull" position={position}>
        <primitive object={clone} />
      </RigidBody>

      {isLantern && lanternPosition && (
        <GlowSprite position={lanternPosition} />
      )}
    </group>
  )
}
