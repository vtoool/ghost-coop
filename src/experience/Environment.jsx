import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import MapRenderer from './MapRenderer'

useGLTF.preload('/models/environment/gravestone-cross.glb')
useGLTF.preload('/models/environment/pillar-large.glb')

export default function Environment() {
  return (
    <>
      {/* Dark Floor Plane with Physics */}
      <RigidBody type="fixed" colliders="cuboid" friction={2}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </RigidBody>
      
      {/* Tile Map Generated World */}
      <MapRenderer />
    </>
  )
}
