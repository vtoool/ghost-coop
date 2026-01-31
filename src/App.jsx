import { useMultiplayerState } from 'playroomkit'
import Lobby from './components/Lobby'

// Placeholder Game component - will be replaced with actual 3D game
function Game() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">GAME STARTED!</h1>
        <p className="text-gray-400">The 3D world will appear here...</p>
      </div>
    </div>
  )
}

/**
 * App - The View Manager
 * Controls which screen to show based on game state
 */
function App() {
  // Subscribe to Playroom's global game state
  const [gameStart] = useMultiplayerState('gameStart', false)

  // If game has started, show Game. Otherwise, show Lobby.
  if (gameStart) {
    return <Game />
  }

  return <Lobby />
}

export default App
