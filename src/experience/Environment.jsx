import { useRef, useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { Color } from 'three'

useGLTF.preload('/models/environment/gravestone-cross.glb')
useGLTF.preload('/models/environment/pillar-large.glb')

// Seeded random number generator for stable procedural generation
function createSeededRandom(seed) {
  let s = seed
  return () => {
    s = Math.sin(s) * 10000
    return s - Math.floor(s)
  }
}

/**
 * Environment - The Graveyard Scene
 * 
 * Features:
 * - Procedurally generates 30 props (gravestones and pillars)
 * - Loads GLB assets for gravestone-cross and pillar-large
 * - Avoids center area (20x20) for player spawn
 * - Fixed physics bodies with hull colliders
 * - Dark floor plane
 */
export default function Environment() {
  // Load GLB assets
  const gravestoneModel = useGLTF('/models/environment/gravestone-cross.glb')
  const pillarModel = useGLTF('/models/environment/pillar-large.glb')
  
  // Strip textures from loaded models to prevent 404 console errors
  useEffect(() => {
    gravestoneModel.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = null
        child.material.needsUpdate = true
      }
    })
    pillarModel.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = null
        child.material.needsUpdate = true
      }
    })
  }, [gravestoneModel, pillarModel])
  
  // Generate 30 random props (done once with seeded random)
  const props = useMemo(() => {
    const items = []
    const propCount = 30
    const areaSize = 50
    const centerClearance = 20
    const random = createSeededRandom(12345)
    
    for (let i = 0; i < propCount; i++) {
      let x, z
      let attempts = 0
      
      do {
        x = (random() - 0.5) * areaSize
        z = (random() - 0.5) * areaSize
        attempts++
      } while (Math.abs(x) < centerClearance / 2 && Math.abs(z) < centerClearance / 2 && attempts < 100)
      
      const rotation = random() * Math.PI * 2
      const scale = 0.8 + random() * 0.4
      const isGravestone = i % 3 !== 0
      
      items.push({
        id: i,
        type: isGravestone ? 'gravestone' : 'pillar',
        position: [x, 0, z],
        rotation,
        scale
      })
    }
    
    return items
  }, [])
  
  return (
    <>
      {/* Dark Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      
      {/* Floor collider */}
      <RigidBody type="fixed" friction={0.8} restitution={0.1}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1a1a1a" visible={false} />
        </mesh>
      </RigidBody>
      
      {/* Procedural Props */}
      {props.map((prop) => (
        <PropItem
          key={prop.id}
          type={prop.type}
          position={prop.position}
          rotation={prop.rotation}
          scale={prop.scale}
          gravestoneModel={gravestoneModel.scene}
          pillarModel={pillarModel.scene}
        />
      ))}
    </>
  )
}

/**
 * Individual Prop Component
 */
function PropItem({ type, position, rotation, scale, gravestoneModel, pillarModel }) {
  const modelRef = useRef()
  
  // Clone the appropriate model and clean up textures
  const model = useMemo(() => {
    const sourceModel = type === 'gravestone' ? gravestoneModel : pillarModel
    const cloned = sourceModel.clone()
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material.map = null
        child.material.needsUpdate = true
        child.material.color = new Color('#4a4a4a')
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    return cloned
  }, [type, gravestoneModel, pillarModel])
  
  return (
    <RigidBody
      type="fixed"
      position={position}
      rotation={[0, rotation, 0]}
      colliders="cuboid"
    >
      <primitive 
        ref={modelRef}
        object={model}
        scale={type === 'gravestone' ? scale * 2 : scale * 1.5}
        position={[0, 0, 0]}
      />
    </RigidBody>
  )
}
