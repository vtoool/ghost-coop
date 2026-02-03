import { useMultiplayerState } from 'playroomkit'
import Lobby from './components/Lobby'
import DebugOverlay from './components/DebugOverlay'

/**
 * App - The View Manager (Dumb UI Pattern)
 * 
 * RULE: This component assumes the network is ALREADY ready.
 * Network initialization happens in main.jsx (The Gatekeeper).
 * 
 * Responsibilities:
 * 1. Mount DebugOverlay for connection verification
 * 2. Subscribe to gameStart state
 * 3. Route between Lobby and Game views
 * 
 * NO network initialization logic here.
 * NO insertCoin, isHost checks for initialization, or connection logic.
 */

// Placeholder Game component - will be replaced with actual 3D game in Phase 2
function Game() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-[#FF6B35]">👻 GHOST HUNT IN PROGRESS!</h1>
        <p className="text-[#00F0FF]">The 3D world will appear here...</p>
        <p className="text-[#F0F0F0]/50 text-sm mt-4">Phase 2: R3F Integration Pending</p>
      </div>
    </div>
  )
}

function App() {
  // Subscribe to Playroom's global game state
  // This is safe because main.jsx guaranteed the network is ready
  const [gameStart] = useMultiplayerState('gameStart', false)

  return (
    <>
      {/* Debug Overlay - Real-time connection monitoring */}
      <DebugOverlay />
      
      {/* Main View Router */}
      {gameStart ? <Game /> : <Lobby />}
    </>
  )
}

export default App
