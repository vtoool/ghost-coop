import { FC } from 'react'
import { useMultiplayerState, myPlayer } from 'playroomkit'
import Lobby from './components/Lobby'
import Game from './components/Game'
import DebugOverlay from './components/DebugOverlay'

/**
 * App - The View Manager (Dumb UI Pattern)
 * 
 * RULE: This component assumes the network is ALREADY ready.
 * Network initialization happens in main.tsx (The Gatekeeper).
 * 
 * Responsibilities:
 * 1. Mount DebugOverlay for connection verification
 * 2. Subscribe to gameStart state
 * 3. Route between Lobby and Game views
 * 
 * NO network initialization logic here.
 * NO insertCoin, isHost checks for initialization, or connection logic.
 */

const App: FC = () => {
  // Subscribe to Playroom's global game state
  // This is safe because main.tsx guaranteed the network is ready
  const [gameStart] = useMultiplayerState('gameStart', false)
  
  // Get global roles state and calculate current player's role
  const [roles] = useMultiplayerState<{ hunter: string | null; operator: string | null }>('roles', { hunter: null, operator: null })
  const me = myPlayer()
  
  // Calculate role: verify roles is defined before checking properties
  const myRole: 'hunter' | 'operator' | 'spectator' = roles?.hunter === me?.id 
    ? 'hunter' 
    : roles?.operator === me?.id 
      ? 'operator' 
      : 'spectator'

  return (
    <>
      {/* Debug Overlay - Real-time connection monitoring */}
      <DebugOverlay myRole={myRole} />
      
      {/* Main View Router */}
      {gameStart ? <Game /> : <Lobby />}
    </>
  )
}

export default App
