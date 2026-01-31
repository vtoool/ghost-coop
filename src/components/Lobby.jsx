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
 * Lobby - Spooky Orange Themed UI
 * Universal Design: Uses HOST/JOIN terminology (never Desktop/Mobile)
 */
function Lobby() {
  const players = usePlayersList()
  const me = myPlayer()
  const [gameStart, setGameStart] = useMultiplayerState('gameStart', false)
  
  // Local state for name input
  const [nameInput, setNameInput] = useState('')
  
  // Check if player has set a name
  const myProfile = me?.getState('profile')
  const myName = myProfile?.name
  
  // Check ready status
  const isReady = me?.getState('ready') || false
  
  // Check if all players are ready
  const allReady = players.length > 0 && players.every(p => p.getState('ready'))
  
  // Handle name submission
  const handleJoin = () => {
    console.log('handleJoin called, nameInput:', nameInput)
    console.log('me object:', me)
    
    if (!nameInput.trim()) {
      console.error('No name entered')
      return
    }
    
    if (!me) {
      console.error('Playroom player object not initialized!')
      alert('Connection error. Please refresh the page.')
      return
    }
    
    try {
      me.setState('profile', { name: nameInput.trim() })
      me.setState('ready', false)
      console.log('Profile set successfully')
    } catch (error) {
      console.error('Failed to set profile:', error)
      alert('Failed to join. Please try again.')
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
  
  // Get animation delay based on index
  const getAnimationDelay = (index) => {
    const delays = ['animate-float', 'animate-float-delay-1', 'animate-float-delay-2', 'animate-float-delay-3']
    return delays[index % delays.length]
  }
  
  // Welcome screen - name input
  if (!myName) {
    return (
      <div className="w-full h-full bg-spooky flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Noise overlay */}
        <div className="noise-overlay" />
        
        {/* Title Section */}
        <div className="text-center mb-8 z-10">
          <h1 
            className="font-creepster text-6xl md:text-7xl mb-4 text-glow-orange"
            style={{ color: '#FF6B35' }}
          >
            ECTO-BUSTERS
          </h1>
          <p className="font-mono text-lg md:text-xl text-[#00F0FF] tracking-wider animate-flicker">
            2-Player Co-op Ghost Hunting
          </p>
        </div>
        
        {/* Name Input Form */}
        <div className="space-y-4 z-10" style={{ width: '320px', maxWidth: '90vw' }}>
          <div className="relative">
            <input
              type="text"
              placeholder="ENTER YOUR CALLSIGN..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="input-ghost text-center text-base"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>
          
          <button
            onClick={handleJoin}
            disabled={!nameInput.trim()}
            className={cn(
              "px-6 py-3 rounded-lg text-base font-bold transition-all",
              nameInput.trim()
                ? "btn-primary animate-pulse-glow"
                : "btn-ghost opacity-50 cursor-not-allowed"
            )}
            style={{ width: '100%' }}
          >
            ENTER THE HAUNTED HOUSE
          </button>
        </div>
        
        {/* Role Indicator */}
        <div className="mt-8 z-10">
          <div className={cn(
            "room-code text-xs",
            isHost() ? "border-[#FF6B35]" : "border-[#00F0FF]"
          )}>
            <span className="text-[#F0F0F0]/70">
              {isHost() ? 'You are the Host' : 'Joining existing game...'}
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  // Lobby screen
  return (
    <div className="lobby-container w-full h-full bg-spooky flex flex-col p-4 md:p-6 relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Header */}
      <div className="text-center mb-4 md:mb-6 z-10">
        <h1 
          className="font-creepster text-4xl md:text-5xl tracking-wider text-glow-orange"
          style={{ color: '#FF6B35' }}
        >
          ECTO-BUSTERS
        </h1>
        <div className="mt-3 room-code">
          <span className="text-[#F0F0F0]/60 text-xs uppercase tracking-widest">Room Code: </span>
          <span className="text-[#FF6B35] font-mono font-bold text-lg tracking-wider">{roomCode}</span>
        </div>
      </div>
      
      {/* QR Code - Only for Host */}
      {isHost() && (
        <div className="flex flex-col items-center mb-4 md:mb-6 z-10">
          <div className="ghost-trap">
            <QRCodeSVG 
              value={window.location.href} 
              size={160}
              level="M"
              bgColor="#0A0A0A"
              fgColor="#FF6B35"
            />
          </div>
          <p className="font-mono text-[#00F0FF] text-sm mt-3 animate-flicker tracking-wider">
            SCAN TO JOIN AS CONTROLLER
          </p>
        </div>
      )}
      
      {/* Player List */}
      <div className="flex-1 bg-[#1A1A1A]/80 rounded-xl border border-[#FF6B35]/30 p-4 mb-4 overflow-y-auto z-10 backdrop-blur-sm">
        <h2 className="font-mono text-[#F0F0F0]/60 text-xs font-bold mb-4 uppercase tracking-widest">
          Ghost Hunters ({players.length})
        </h2>
        <div className="space-y-3">
          {players.map((player, index) => {
            const profile = player.getState('profile')
            const ready = player.getState('ready')
            const isMe = player.id === me?.id
            
            return (
              <div 
                key={player.id}
                className={cn(
                  "player-card",
                  getAnimationDelay(index)
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "status-dot",
                      ready ? "ready" : "waiting"
                    )} />
                    <span className={cn(
                      "font-mono font-medium",
                      isMe ? "text-[#F0F0F0]" : "text-[#F0F0F0]/70"
                    )}>
                      {profile?.name || 'Unknown Entity'}
                      {isMe && (
                        <span className="text-[#FF6B35] text-xs ml-2 font-bold">[YOU]</span>
                      )}
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono text-xs font-bold tracking-wider",
                    ready ? "text-[#00F0FF] text-glow-cyan" : "text-[#FFD700] animate-flicker"
                  )}>
                    {ready ? 'READY' : 'WAITING'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        
        {players.length === 0 && (
          <p className="font-mono text-[#F0F0F0]/30 text-center py-8 text-sm">
            No paranormal activity detected...
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3 z-10">
        {/* Ready Button - Everyone can see */}
        <button
          onClick={toggleReady}
          className={cn(
            "w-full py-4 rounded-lg text-lg font-bold transition-all",
            isReady
              ? "btn-ready"
              : "btn-ghost"
          )}
        >
          {isReady ? 'CANCEL READY' : 'READY FOR HAUNT'}
        </button>
        
        {/* Start Button - Host Only */}
        {isHost() && (
          <button
            onClick={handleStartGame}
            disabled={!allReady}
            className={cn(
              "w-full py-4 rounded-lg text-lg font-bold transition-all font-mono uppercase tracking-wider",
              allReady
                ? "btn-primary animate-pulse-glow"
                : "bg-[#1A1A1A] border-2 border-[#FF6B35]/30 text-[#FF6B35]/50 cursor-not-allowed"
            )}
          >
            {allReady 
              ? 'START GHOST HUNT' 
              : `WAITING (${players.filter(p => p.getState('ready')).length}/${players.length})`
            }
          </button>
        )}
      </div>
    </div>
  )
}

export default Lobby
