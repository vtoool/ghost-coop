import { useMultiplayerState, myPlayer } from 'playroomkit'
import { RigidBody } from '@react-three/rapier'
import RoleManager from './RoleManager'

/**
 * GameWorld - The 3D Scene
 * 
 * Contains lighting, environment, and role-based view logic.
 * Everyone sees the same world, but cameras differ by role.
 */
export default function GameWorld() {
  // Get roles from Playroom state
  const [roles] = useMultiplayerState('roles', { hunter: null, operator: null })
  const player = myPlayer()

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Floor - A fixed rigid body that doesn't move */}
      <RigidBody type="fixed" friction={0.5}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </RigidBody>

      {/* Test Ghost - A floating box everyone can see */}
      <RigidBody type="kinematicPosition" position={[0, 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>

      {/* Role-based view management */}
      <RoleManager roles={roles} playerId={player?.id} />
    </>
  )
}
