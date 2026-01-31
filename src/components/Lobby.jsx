import { useState } from 'react'
import { usePlayersList, isHost, myPlayer, useMultiplayerState } from 'playroomkit'
import { QRCodeSVG } from 'qrcode.react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for cleaner Tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Lobby - Universal UI (Device Agnostic)
 * Handles both Host and Join views
 */
function Lobby() {
  const players = usePlayersList()
  const me = myPlayer()
  const [gameStart, setGameStart] = useMultiplayerState('gameStart', false)
  
  // Local state for name input
  const [nameInput, setNameInput] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  
  // Check if player has set a name
  const myProfile = me?.getState('profile')
  const myName = myProfile?.name
  
  // Check ready status
  const isReady = me?.getState('ready') || false
  
  // Check if all players are ready
  const allReady = players.length > 0 && players.every(p => p.getState('ready'))
  
  // Handle name submission
  const handleJoin = () => {
    if (nameInput.trim()) {
      me?.setState('profile', { name: nameInput.trim() })
      me?.setState('ready', false)
      setHasJoined(true)
    }
  }
  
  // Toggle ready status
  const toggleReady = () => {
    me?.setState('ready', !isReady)
  }
  
  // Host starts the game
  const handleStartGame = () => {
    if (isHost() && allReady) {
      setGameStart(true)
    }
  }
  
  // Get room code from URL hash
  const roomCode = window.location.hash?.slice(1) || 'Unknown'
  
  // Welcome screen - name input
  if (!myName) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6">
        <h1 className="text-5xl font-bold text-white mb-2 tracking-wider">ECTO-BUSTERS</h1>
        <p className="text-gray-400 mb-8 text-lg">2-Player Co-op Ghost Hunting</p>
        
        <div className="w-full max-w-md space-y-4">
          <input
            type="text"
            placeholder="Enter your name..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="w-full px-6 py-4 bg-gray-900 border-2 border-gray-700 rounded-lg text-white text-lg 
                       placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            autoFocus
          />
          <button
            onClick={handleJoin}
            disabled={!nameInput.trim()}
            className={cn(
              "w-full py-4 rounded-lg text-lg font-bold transition-all",
              nameInput.trim()
                ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            ENTER
          </button>
        </div>
        
        <p className="text-gray-600 mt-8 text-sm">
          {isHost() ? 'You are the Host' : 'Joining as Guest'}
        </p>
      </div>
    )
  }
  
  // Lobby screen
  return (
    <div className="lobby-container w-full h-full bg-black flex flex-col p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white tracking-wider">ECTO-BUSTERS</h1>
        <div className="mt-2 inline-block px-4 py-1 bg-gray-900 rounded-full border border-gray-700">
          <span className="text-gray-400 text-sm">Room Code: </span>
          <span className="text-white font-mono font-bold text-lg">{roomCode}</span>
        </div>
      </div>
      
      {/* QR Code - Only for Host */}
      {isHost() && (
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-3 rounded-lg">
            <QRCodeSVG 
              value={window.location.href} 
              size={180}
              level="M"
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">Scan to join</p>
        </div>
      )}
      
      {/* Player List */}
      <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4 overflow-y-auto">
        <h2 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Players ({players.length})</h2>
        <div className="space-y-2">
          {players.map((player) => {
            const profile = player.getState('profile')
            const ready = player.getState('ready')
            const isMe = player.id === me?.id
            
            return (
              <div 
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isMe ? "bg-gray-800 border-gray-600" : "bg-gray-950 border-gray-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    ready ? "bg-green-500" : "bg-yellow-500"
                  )} />
                  <span className={cn(
                    "font-medium",
                    isMe ? "text-white" : "text-gray-300"
                  )}>
                    {profile?.name || 'Unknown'}
                    {isMe && <span className="text-gray-500 text-sm ml-2">(You)</span>}
                  </span>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  ready ? "text-green-400" : "text-yellow-400"
                )}>
                  {ready ? 'READY' : 'WAITING'}
                </span>
              </div>
            )
          })}
        </div>
        
        {players.length === 0 && (
          <p className="text-gray-600 text-center py-4">No players yet...</p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Ready Button - Everyone can see */}
        <button
          onClick={toggleReady}
          className={cn(
            "w-full py-4 rounded-lg text-lg font-bold transition-all",
            isReady
              ? "bg-green-600 hover:bg-green-500 text-white"
              : "bg-yellow-600 hover:bg-yellow-500 text-white"
          )}
        >
          {isReady ? 'UNREADY' : 'READY UP'}
        </button>
        
        {/* Start Button - Host Only */}
        {isHost() && (
          <button
            onClick={handleStartGame}
            disabled={!allReady}
            className={cn(
              "w-full py-4 rounded-lg text-lg font-bold transition-all",
              allReady
                ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            {allReady ? 'START GAME' : `WAITING FOR PLAYERS (${players.filter(p => p.getState('ready')).length}/${players.length})`}
          </button>
        )}
      </div>
    </div>
  )
}

export default Lobby
