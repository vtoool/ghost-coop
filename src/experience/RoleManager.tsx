import { PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import HunterController from './HunterController'
import OperatorHUD from '../components/OperatorHUD'
import type { Roles } from '../types/game.types'
import type { Player } from 'playroomkit'

interface RoleManagerProps {
  roles: Roles | undefined;
  playerId: string | undefined;
  player: Player;
  isLocal: boolean;
}

const RoleManager: React.FC<RoleManagerProps> = ({ roles, playerId, isLocal }) => {
  const isHunter = roles?.hunter === playerId || isLocal

  if (isHunter || isLocal) {
    return (
      <>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} rotation={[-0.2, 0, 0]} />
        <HunterController />
      </>
    )
  }

  if (isLocal) {
    return (
      <>
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

  return null
}

export default RoleManager
