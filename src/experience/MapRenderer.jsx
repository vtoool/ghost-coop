import { useMemo, useState } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'

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

  const props = level1.flatMap((row, z) =>
    row.split('').map((char, x) => {
      const name = mapLegend[char]
      if (!name) return null

      const posX = (x * gridSize) - offsetX + (gridSize / 2)
      const posZ = (z * gridSize) - offsetZ + (gridSize / 2)

      return (
        <MapTile
          key={`prop-${x}-${z}`}
          name={name}
          position={[posX, 0, posZ]}
          texture={graveyardTx}
        />
      )
    })
  )

  return (
    <group>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[mapWidth, 1, mapHeight]} />
        <meshStandardMaterial color="#6BAE45" roughness={0.8} />
      </mesh>

      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders={false}>
        <CuboidCollider args={[mapWidth / 2, 0.5, mapHeight / 2]} />
      </RigidBody>

      <group>{props}</group>
    </group>
  )
}

function MapTile({ name, position, texture }) {
  const { scene } = useGLTF(`/models/environment/${name}.glb`)
  const [lanternPosition, setLanternPosition] = useState(null)
  
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = texture
        child.castShadow = true
        child.receiveShadow = true
      }
      // Find lantern position for light pooling
      if ((name.toLowerCase().includes('lantern') || name.toLowerCase().includes('lamp')) && child.isMesh) {
        const worldPos = new THREE.Vector3()
        child.getWorldPosition(worldPos)
        setLanternPosition(worldPos)
      }
    })
    return c
  }, [scene, texture, name])

  return (
    <group>
      <RigidBody type="fixed" colliders="hull" position={position}>
        <primitive object={clone} />
      </RigidBody>
      
      {/* Localized Warmth - Lantern Pool of Light */}
      {lanternPosition && (
        <pointLight
          position={[lanternPosition.x, lanternPosition.y + 0.5, lanternPosition.z]}
          color="#ffaa44"
          intensity={2}
          distance={8}
          decay={2}
        />
      )}
    </group>
  )
}
