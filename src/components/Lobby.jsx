import { useState, useEffect, useRef } from 'react'
import { usePlayersList, isHost, myPlayer, useMultiplayerState } from 'playroomkit'
import { QRCodeSVG } from 'qrcode.react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getStoredProfile, setStoredProfile, clearStoredProfile } from '../utils/playerStorage'

// Utility for cleaner Tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Lobby - Spooky Orange Themed UI with LocalStorage Persistence
 * Universal Design: Uses HOST/JOIN terminology (never Desktop/Mobile)
 */
function Lobby() {
  const players = usePlayersList()
  const me = myPlayer()
  const [gameStart, setGameStart] = useMultiplayerState('gameStart', false)
  
  // Track player join times to show "Joining..." for new players
  const playerJoinTimes = useRef(new Map())
  
  // Local state
  const [nameInput, setNameInput] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true) // Track if we're auto-restoring profile
  
  // Get stored profile from localStorage
  const storedProfile = getStoredProfile()
  
  // Check if player has set a name (from Playroom state or localStorage during restore)
  const myProfile = me?.getState('profile')
  const myName = myProfile?.name || null
  
  // Track player join times
  useEffect(() => {
    players.forEach(player => {
      if (!playerJoinTimes.current.has(player.id)) {
        playerJoinTimes.current.set(player.id, Date.now())
      }
    })
  }, [players])
  
  // Auto-restore profile from localStorage when component mounts
  useEffect(() => {
    const restoreProfile = async () => {
      if (storedProfile?.name && me && !me.getState('profile')?.name) {
        console.log('Auto-restoring profile from localStorage:', storedProfile.name)
        try {
          me.setState('profile', storedProfile)
          me.setState('ready', false)
        } catch (error) {
          console.error('Failed to restore profile:', error)
        }
      }
      setIsRestoring(false)
    }
    
    // Small delay to ensure Playroom is fully initialized
    const timer = setTimeout(restoreProfile, 500)
    return () => clearTimeout(timer)
  }, [me, storedProfile])
  
  // Pre-fill name input with stored name
  useEffect(() => {
    if (storedProfile?.name && !nameInput) {
      setNameInput(storedProfile.name)
    }
  }, [storedProfile, nameInput])
  
  // Check ready status
  const isReady = me?.getState('ready') || false
  
  // Check if all players are ready
  const allReady = players.length > 0 && players.every(p => p.getState('ready'))
  
  // Handle name submission
  const handleJoin = () => {
    console.log('handleJoin called, nameInput:', nameInput)
    
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
      const profile = { name: nameInput.trim() }
      me.setState('profile', profile)
      me.setState('ready', false)
      setStoredProfile(profile) // Persist to localStorage
      console.log('Profile set and saved to localStorage:', profile.name)
    } catch (error) {
      console.error('Failed to set profile:', error)
      alert('Failed to join. Please try again.')
    }
  }
  
  // Handle leaving room
  const handleLeaveRoom = () => {
    clearStoredProfile()
    window.location.reload() // Reload to create fresh session
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
  
  // Check if player is still in "joining" phase (first 3 seconds)
  const isPlayerJoining = (playerId) => {
    const joinTime = playerJoinTimes.current.get(playerId)
    if (!joinTime) return false
    return Date.now() - joinTime < 3000 // 3 second grace period
  }
  
  // Welcome screen - name input (show if no name set yet)
  if (!myName && !isRestoring) {
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
  
  // Loading state while restoring
  if (isRestoring) {
    return (
      <div className="w-full h-full bg-spooky flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="text-center z-10">
          <h1 className="font-creepster text-4xl text-[#FF6B35] mb-4">ECTO-BUSTERS</h1>
          <p className="font-mono text-[#00F0FF] animate-pulse">Restoring your profile...</p>
        </div>
      </div>
    )
  }
  
  // Lobby screen
  return (
    <div className="lobby-container w-full h-full bg-spooky flex flex-col items-center p-4 md:p-6 relative overflow-hidden">
      <div className="flex flex-col h-full" style={{ width: '100%', maxWidth: '380px' }}>
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
      
      {/* QR Code - Show on all devices when less than 2 players */}
      {players.length < 2 && (
        <div className="flex flex-col items-center mb-4 md:mb-6 z-10">
          <div className="ghost-trap">
            <QRCodeSVG 
              value={window.location.href} 
              size={140}
              level="M"
              bgColor="#0A0A0A"
              fgColor="#FF6B35"
            />
          </div>
          <p className="font-mono text-[#00F0FF] text-xs mt-2 animate-flicker tracking-wider text-center">
            SCAN TO JOIN AS CONTROLLER
          </p>
        </div>
      )}
      
      {/* Share Room - For Everyone */}
      <div className="flex flex-col items-center mb-4 z-10">
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
          }}
          className={cn(
            "text-xs py-2 px-4 transition-all",
            linkCopied ? "btn-ready" : "btn-ghost"
          )}
        >
          {linkCopied ? 'LINK COPIED!' : 'COPY ROOM LINK'}
        </button>
      </div>
      
      {/* Player List */}
      <div className="flex-1 bg-[#1A1A1A]/80 rounded-xl border border-[#FF6B35]/30 p-4 mb-4 overflow-y-auto z-10 backdrop-blur-sm w-full">
        <h2 className="font-mono text-[#F0F0F0]/60 text-xs font-bold mb-4 uppercase tracking-widest">
          Ghost Hunters ({players.length})
        </h2>
        <div className="space-y-3">
          {players.map((player, index) => {
            const profile = player.getState('profile')
            const ready = player.getState('ready')
            const isMe = player.id === me?.id
            const joining = isPlayerJoining(player.id)
            const hasName = profile?.name
            
            // Skip rendering players without names during joining phase
            if (!hasName && joining) {
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
                      <div className="status-dot waiting" />
                      <span className="font-mono font-medium text-[#F0F0F0]/50 animate-pulse">
                        Joining...
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold tracking-wider text-[#F0F0F0]/50">
                      CONNECTING
                    </span>
                  </div>
                </div>
              )
            }
            
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
                      {profile?.name || 'Joining...'}
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
            "py-4 rounded-lg text-lg font-bold transition-all w-full",
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
        
        {/* Leave Room Button */}
        <button
          onClick={handleLeaveRoom}
          className="w-full py-2 rounded-lg text-sm font-bold transition-all font-mono bg-[#1A1A1A] border border-[#F0F0F0]/30 text-[#F0F0F0]/70 hover:bg-[#1A1A1A]/80"
        >
          LEAVE ROOM
        </button>
      </div>
      </div>{/* Close max-w-md container */}
    </div>
  )
}

export default Lobby
