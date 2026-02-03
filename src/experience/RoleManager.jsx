import { PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

/**
 * RoleManager - Role-based View Logic
 * 
 * Renders different cameras and avatars based on player role:
 * - Hunter: 3rd person perspective camera + red avatar box
 * - Operator: Top-down orthographic camera (no avatar)
 */
export default function RoleManager({ roles, playerId }) {
  const isHunter = roles?.hunter === playerId
  const isOperator = roles?.operator === playerId

  if (isHunter) {
    return (
      <>
        {/* Hunter Camera - 3rd person view looking forward */}
        <PerspectiveCamera makeDefault position={[0, 5, 10]} rotation={[-0.2, 0, 0]} />

        {/* Hunter Avatar - Red box at ground level */}
        <RigidBody type="dynamic" position={[0, 1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1, 2, 1]} />
            <meshStandardMaterial color="#FF6B35" />
          </mesh>
        </RigidBody>
      </>
    )
  }

  if (isOperator) {
    return (
      <>
        {/* Operator Camera - Top-down map view looking straight down */}
        <OrthographicCamera
          makeDefault
          position={[0, 50, 0]}
          zoom={20}
          near={0.1}
          far={100}
          rotation={[-Math.PI / 2, 0, 0]}
        />
        {/* Operator has no avatar - they are a ghost in the machine */}
      </>
    )
  }

  // Fallback - should not happen if roles are assigned
  return null
}
