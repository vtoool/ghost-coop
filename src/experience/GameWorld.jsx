import { useMultiplayerState, myPlayer, usePlayersList } from 'playroomkit'
import { RigidBody } from '@react-three/rapier'
import RoleManager from './RoleManager'
import Environment from './Environment'

/**
 * GameWorld - The 3D Scene
 * 
 * Contains lighting, environment, and role-based view logic.
 * Everyone sees the same world, but cameras differ by role.
 * 
 * Features:
 * - Full graveyard environment with procedural props
 * - Ghost entity that both players interact with
 * - Hunter position synced to Operator view
 */
export default function GameWorld() {
  // Get roles from Playroom state
  const [roles] = useMultiplayerState('roles', { hunter: null, operator: null })
  const player = myPlayer()
  const players = usePlayersList()
  
  // Determine this player's role
  const isHunter = roles?.hunter === player?.id
  const isOperator = roles?.operator === player?.id
  
  // Get Hunter's synced position for Operator view
  const hunterPlayer = players.find(p => p.id === roles?.hunter)
  const hunterPos = hunterPlayer?.getState('pos') || { x: 0, y: 2, z: 0 }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-bias={-0.0004}
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Center fill light to prevent pitch black areas */}
      <pointLight position={[0, 10, 0]} intensity={2} color="#ffffff" distance={30} />
      
      {/* Spooky accent lighting */}
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#FF6B35" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#00F0FF" />

      {/* Full Graveyard Environment */}
      <Environment />

      {/* Ghost Entity - Everyone sees this */}
      <RigidBody type="kinematicPosition" position={[0, 3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial 
            color="#00F0FF" 
            emissive="#00F0FF" 
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      </RigidBody>
      
      {/* Ghost glow effect */}
      <pointLight position={[0, 3, 0]} intensity={2} color="#00F0FF" distance={10} />

      {/* Hunter position marker for Operator view */}
      {isOperator && hunterPlayer && (
        <group position={[hunterPos.x, hunterPos.y, hunterPos.z]}>
          {/* Hunter marker on Operator's map */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
            <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.5} />
          </mesh>
          {/* Label indicator */}
          <pointLight intensity={1} color="#FF6B35" distance={5} />
        </group>
      )}

      {/* Role-based view management */}
      <RoleManager roles={roles} playerId={player?.id} />
    </>
  )
}
