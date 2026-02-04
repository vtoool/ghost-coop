import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'

export default function MapRenderer() {
  const platformerTx = useTexture('/models/environment/Textures/colormap_platformer.png')
  platformerTx.colorSpace = THREE.SRGBColorSpace
  platformerTx.flipY = false

  const graveyardTx = useTexture('/models/environment/Textures/colormap_graveyard.png')
  graveyardTx.colorSpace = THREE.SRGBColorSpace
  graveyardTx.flipY = false

  const { scene: floorScene } = useGLTF('/models/environment/block-grass.glb')

  const floorClone = useMemo(() => {
    const clone = floorScene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = platformerTx
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [floorScene, platformerTx])

  const gridSize = 2
  const width = level1[0].length
  const height = level1.length
  const offsetX = width * gridSize / 2
  const offsetZ = height * gridSize / 2

  const floorTiles = []
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      floorTiles.push(
        <primitive 
          key={`floor-${x}-${z}`}
          object={floorClone.clone()}
          position={[x * gridSize - offsetX, -1.01, z * gridSize - offsetZ]}
        />
      )
    }
  }

  const props = []
  let index = 0
  for (let z = 0; z < height; z++) {
    const row = level1[z]
    for (let x = 0; x < width; x++) {
      const char = row[x]
      if (char === '.' || char === ' ') continue
      
      const name = mapLegend[char]
      if (!name) continue
      
      const position = [
        x * gridSize - offsetX,
        0,
        z * gridSize - offsetZ
      ]
      
      props.push(
        <MapTile 
          key={`prop-${index++}`}
          name={name}
          position={position}
          texture={graveyardTx}
        />
      )
    }
  }

  return (
    <group>
      <group>{floorTiles}</group>
      <group>{props}</group>
      <RigidBody type="fixed" position={[0, -1, 0]}>
        <CuboidCollider args={[50, 1, 50]} />
      </RigidBody>
    </group>
  )
}

function MapTile({ name, position, texture }) {
  const { scene } = useGLTF(`/models/environment/${name}.glb`)
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = texture
        child.castShadow = true
        child.receiveShadow = true
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
