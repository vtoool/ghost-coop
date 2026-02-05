import { PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import HunterController from './HunterController'
import OperatorHUD from '../components/OperatorHUD'
import type { Roles } from '../types/game.types'

/**
 * RoleManager - Role-based View Logic
 * 
 * Renders different cameras and avatars based on player role:
 * - Hunter: 3rd person perspective camera + full HunterController (GLB + Physics + Controls)
 * - Operator: Top-down orthographic camera (no avatar, sees Hunter synced position)
 */
interface RoleManagerProps {
  roles: Roles | undefined;
  playerId: string | undefined;
}

const RoleManager: React.FC<RoleManagerProps> = ({ roles, playerId }) => {
  const isHunter: boolean = roles?.hunter === playerId
  const isOperator: boolean = roles?.operator === playerId

  if (isHunter) {
    return (
      <>
        {/* Hunter Camera - 3rd person view looking forward */}
        <PerspectiveCamera makeDefault position={[0, 5, 10]} rotation={[-0.2, 0, 0]} />

        {/* Hunter Avatar - Full controller with GLB, physics, and dual-input */}
        <HunterController />
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
        <OperatorHUD />
      </>
    )
  }

  // Fallback - should not happen if roles are assigned
  return null
}

export default RoleManager
