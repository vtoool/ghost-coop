import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { mapLegend, level1 } from './LevelMap'

const GRID_SIZE = 2
const MAP_WIDTH = level1[0].length
const MAP_HEIGHT = level1.length
const OFFSET_X = (MAP_WIDTH * GRID_SIZE) / 2
const OFFSET_Z = (MAP_HEIGHT * GRID_SIZE) / 2

function MapTile({ name, position }) {
  const path = `/models/environment/${name}.glb`
  const { scene } = useGLTF(path)
  
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return c
  }, [scene])
  
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <primitive object={clone} />
    </RigidBody>
  )
}

export default function MapRenderer() {
  const tiles = useMemo(() => {
    const items = []
    let index = 0
    
    for (let z = 0; z < MAP_HEIGHT; z++) {
      const row = level1[z]
      for (let x = 0; x < MAP_WIDTH; x++) {
        const char = row[x]
        if (char === '.' || char === ' ') continue
        
        const name = mapLegend[char]
        if (!name) continue
        
        const position = [
          x * GRID_SIZE - OFFSET_X,
          0,
          z * GRID_SIZE - OFFSET_Z
        ]
        
        items.push(
          <MapTile key={index++} name={name} position={position} />
        )
      }
    }
    
    return items
  }, [])
  
  return <>{tiles}</>
}
