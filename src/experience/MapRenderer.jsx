import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'

const GRID_SIZE = 2
const WIDTH = level1[0].length
const HEIGHT = level1.length
const OFFSET_X = (WIDTH * GRID_SIZE) / 2
const OFFSET_Z = (HEIGHT * GRID_SIZE) / 2

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
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <primitive object={clone} />
    </RigidBody>
  )
}

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
  
  const floorTiles = []
  for (let z = 0; z < HEIGHT; z++) {
    for (let x = 0; x < WIDTH; x++) {
      floorTiles.push(
        <primitive 
          key={`floor-${x}-${z}`}
          object={floorClone.clone()}
          position={[x * GRID_SIZE - OFFSET_X, -1, z * GRID_SIZE - OFFSET_Z]}
        />
      )
    }
  }
  
  const props = []
  let index = 0
  for (let z = 0; z < HEIGHT; z++) {
    const row = level1[z]
    for (let x = 0; x < WIDTH; x++) {
      const char = row[x]
      if (char === '.' || char === ' ') continue
      
      const name = mapLegend[char]
      if (!name) continue
      
      const position = [
        x * GRID_SIZE - OFFSET_X,
        0,
        z * GRID_SIZE - OFFSET_Z
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
