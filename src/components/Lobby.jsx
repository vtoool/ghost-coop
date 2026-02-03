import { useState, useEffect } from 'react'
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
 * Lobby - Phase 2 Enhanced with Role Management
 * 
 * RULE: Assumes network is ALREADY ready (guaranteed by main.jsx Gatekeeper).
 * 
 * NEW: Asymmetric Gameplay Roles
 * - Hunter: Field Agent (3rd Person, catches ghosts)
 * - Operator: Tactical Oversight (Top-down map view, provides intel)
 */
function Lobby() {
  // Use reactive player list - this triggers re-renders when players join/leave/update
  const players = usePlayersList(true)
  const me = myPlayer()
  const [, setGameStart] = useMultiplayerState('gameStart')
  const [gamePhase, setGamePhase] = useMultiplayerState('gamePhase', 'lobby')
  
  // Role Management State (NEW FOR PHASE 2)
  const [roles, setRoles] = useMultiplayerState('roles', {
    hunter: null,
    operator: null
  })
  
  // Get stored profile from localStorage for pre-filling input
  const storedProfile = getStoredProfile()
  
  // Local UI state only
  const [nameInput, setNameInput] = useState(() => storedProfile?.name || '')
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Get current player state from Playroom (networked)
  const myProfile = me.getState('profile')
  const myName = myProfile?.name || null
  const isReady = me.getState('ready') || false
  
  // CRITICAL: Reactive host check - must be computed every render
  const amIHost = isHost()
  
  // Aggressive Role Assignment & Host Migration Safety Net
  useEffect(() => {
    // Only Host manages roles to avoid conflicts
    if (!amIHost) {
      console.log('[Lobby] Not host, skipping role management')
      return
    }
    
    console.log('[Lobby] Host checking roles. Players:', players.length, 'Current roles:', roles)
    
    // Find other player (if exists)
    const otherPlayer = players.find(p => p.id !== me.id)
    const otherPlayerId = otherPlayer?.id
    
    // CASE A: Auto-Assign Roles when 2nd player joins
    if (players.length === 2 && otherPlayerId) {
      // If roles are empty or invalid, assign fresh
      const needsAssignment = !roles.hunter || !roles.operator ||
        (roles.hunter !== me.id && roles.hunter !== otherPlayerId) ||
        (roles.operator !== me.id && roles.operator !== otherPlayerId)
      
      if (needsAssignment) {
        console.log('[Lobby] Auto-assigning: Host=Operator, Joiner=Hunter')
        setRoles({
          operator: me.id,
          hunter: otherPlayerId
        })
      }
    }
    
    // CASE B: Host Migration / Solo Play Cleanup
    if (players.length === 1) {
      // I'm the only player and I'm host
      // Clear the other role slot since that player left
      const myCurrentRole = roles.hunter === me.id ? 'hunter' : 
                           roles.operator === me.id ? 'operator' : null
      
      if (myCurrentRole === 'hunter' && roles.operator && roles.operator !== me.id) {
        console.log('[Lobby] Solo mode: Clearing departed operator')
        setRoles({ hunter: me.id, operator: null })
      } else if (myCurrentRole === 'operator' && roles.hunter && roles.hunter !== me.id) {
        console.log('[Lobby] Solo mode: Clearing departed hunter')
        setRoles({ hunter: null, operator: me.id })
      } else if (!myCurrentRole) {
        // I have no role, assign myself as operator by default
        console.log('[Lobby] Solo mode: Assigning self as Operator')
        setRoles({ hunter: null, operator: me.id })
      }
    }
    
    // CASE C: Clear all roles if everyone left (edge case)
    if (players.length === 0 && (roles.hunter || roles.operator)) {
      console.log('[Lobby] Everyone left, clearing roles')
      setRoles({ hunter: null, operator: null })
    }
    
  }, [players, amIHost, me.id, roles.hunter, roles.operator, setRoles])
  
  // Check if all players are ready
  const allReady = players.length > 0 && players.every(p => p.getState('ready'))
  
  // Check if roles are assigned (both slots filled for 2-player game)
  const rolesAssigned = roles.hunter && roles.operator && players.length === 2
  
  // Get player names for role cards
  const getPlayerName = (playerId) => {
    if (!playerId) return 'VACANT'
    const player = players.find(p => p.id === playerId)
    return player?.getState('profile')?.name || 'Unknown'
  }
  
  const hunterName = getPlayerName(roles.hunter)
  const operatorName = getPlayerName(roles.operator)
  const myRole = roles.hunter === me.id ? 'hunter' : roles.operator === me.id ? 'operator' : null
  
  // Handle name submission
  const handleJoin = () => {
    console.log('[Lobby] handleJoin clicked, nameInput:', nameInput)
    if (!nameInput.trim()) {
      console.log('[Lobby] No name entered, returning')
      return
    }
    
    const profile = { name: nameInput.trim() }
    console.log('[Lobby] Setting profile:', profile)
    
    // Set in Playroom state (for multiplayer sync) - reliable=true
    me.setState('profile', profile, true)
    me.setState('ready', false, true)
    
    // Persist to localStorage
    setStoredProfile(profile)
    console.log('[Lobby] Profile set successfully')
  }
  
  // Handle leaving room
  const handleLeaveRoom = () => {
    clearStoredProfile()
    window.location.reload()
  }
  
  // Toggle ready status
  const toggleReady = () => {
    const newReady = !isReady
    // Set in Playroom state (for multiplayer sync) - reliable=true
    me.setState('ready', newReady, true)
  }
  
  // Swap roles function (Host only)
  const swapRoles = () => {
    if (!amIHost) return
    
    console.log('[Lobby] Swapping roles')
    const newRoles = {
      hunter: roles.operator,
      operator: roles.hunter
    }
    setRoles(newRoles)
  }
  
  // Host starts the game
  const handleStartGame = () => {
    if (amIHost && allReady && rolesAssigned) {
      setGamePhase('playing')
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
  
  // WELCOME SCREEN - Show if player hasn't entered name yet
  if (!myName) {
    return (
      <div className="w-full h-full bg-spooky flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="noise-overlay" />
        
        {/* Title Section */}
        <div className="text-center mb-8 z-10">
          <h1 className="font-creepster text-6xl md:text-7xl mb-4 text-glow-orange" style={{ color: '#FF6B35' }}>
            ECTO-BUSTERS
          </h1>
          <p className="font-mono text-lg md:text-xl text-[#00F0FF] tracking-wider animate-flicker">
            2-Player Co-op Ghost Hunting
          </p>
        </div>
        
        {/* Name Input Form */}
        <div className="space-y-4 z-10" style={{ width: '320px', maxWidth: '90vw' }}>
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
        
        {/* Role Indicator with Crown for Host */}
        <div className="mt-8 z-10">
          <div className={cn(
            "room-code text-xs flex items-center gap-2",
            amIHost ? "border-[#FF6B35]" : "border-[#00F0FF]"
          )}>
            {amIHost && <span className="text-lg">👑</span>}
            <span className="text-[#F0F0F0]/70">
              {amIHost ? 'You are the Host' : 'Joining existing game...'}
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  // LOBBY SCREEN - Show when player has entered name
  return (
    <div className="lobby-container w-full h-full bg-spooky flex flex-col items-center p-4 md:p-6 relative overflow-hidden">
      <div className="flex flex-col h-full" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="noise-overlay" />
        
        {/* Header with Host Crown */}
        <div className="text-center mb-4 md:mb-6 z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            {amIHost && (
              <span className="text-2xl animate-pulse" title="Host">👑</span>
            )}
            <h1 className="font-creepster text-4xl md:text-5xl tracking-wider text-glow-orange" style={{ color: '#FF6B35' }}>
              ECTO-BUSTERS
            </h1>
            {amIHost && (
              <span className="text-xs font-mono bg-[#FF6B35] text-[#050505] px-2 py-1 rounded font-bold">
                HOST
              </span>
            )}
          </div>
          <div className="mt-3 room-code">
            <span className="text-[#F0F0F0]/60 text-xs uppercase tracking-widest">Room Code: </span>
            <span className="text-[#FF6B35] font-mono font-bold text-lg tracking-wider">{roomCode}</span>
          </div>
        </div>
        
        {/* QR Code - Show when less than 2 players */}
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
              SCAN TO JOIN AS FIELD AGENT
            </p>
          </div>
        )}
        
        {/* Mission Briefing - Role Cards (PHASE 2) */}
        {players.length >= 2 && (
          <div className="mb-6 z-10 w-full">
            <h2 className="font-creepster text-2xl mb-4 text-center text-[#F0F0F0] tracking-wider">
              MISSION BRIEFING
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Hunter Card - Field Agent */}
              <div className={cn(
                "rounded-xl border-2 p-4 transition-all",
                myRole === 'hunter' 
                  ? "border-[#FF6B35] bg-[#FF6B35]/10 shadow-[0_0_20px_rgba(255,107,53,0.3)]"
                  : "border-[#FF6B35]/50 bg-[#1A1A1A]/80"
              )}>
                <div className="text-center">
                  <div className="text-3xl mb-2">👻</div>
                  <h3 className="font-creepster text-lg text-[#FF6B35] mb-1">FIELD AGENT</h3>
                  <p className="font-mono text-xs text-[#F0F0F0]/60 mb-3">HUNTER</p>
                  <p className="font-mono text-xs text-[#F0F0F0]/80 leading-relaxed">
                    3rd Person View. Trap Ghosts.
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#FF6B35]/30">
                    <span className={cn(
                      "font-mono text-xs font-bold",
                      roles.hunter ? "text-[#00F0FF]" : "text-[#F0F0F0]/40"
                    )}>
                      {hunterName}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Operator Card - Tactical Oversight */}
              <div className={cn(
                "rounded-xl border-2 p-4 transition-all",
                myRole === 'operator'
                  ? "border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  : "border-[#00F0FF]/50 bg-[#1A1A1A]/80"
              )}>
                <div className="text-center">
                  <div className="text-3xl mb-2">👁️</div>
                  <h3 className="font-creepster text-lg text-[#00F0FF] mb-1">OVERSIGHT</h3>
                  <p className="font-mono text-xs text-[#F0F0F0]/60 mb-3">OPERATOR</p>
                  <p className="font-mono text-xs text-[#F0F0F0]/80 leading-relaxed">
                    Tactical Map. Support & Intel.
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#00F0FF]/30">
                    <span className={cn(
                      "font-mono text-xs font-bold",
                      roles.operator ? "text-[#00F0FF]" : "text-[#F0F0F0]/40"
                    )}>
                      {operatorName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Role Swap Controls - Now with explicit amIHost check */}
            {amIHost ? (
              <button
                onClick={swapRoles}
                disabled={!rolesAssigned}
                className={cn(
                  "mt-4 w-full py-3 rounded-lg font-bold font-mono text-sm tracking-wider transition-all",
                  rolesAssigned
                    ? "btn-ghost border-dashed animate-pulse-glow"
                    : "bg-[#1A1A1A] border border-[#F0F0F0]/20 text-[#F0F0F0]/30 cursor-not-allowed"
                )}
              >
                ⇄ SWAP ROLES
              </button>
            ) : (
              <div className="mt-4 text-center">
                <span className="font-mono text-xs text-[#F0F0F0]/50 animate-flicker">
                  Waiting for Host...
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Player List - Only show if we have players but less than 2 */}
        {players.length < 2 && (
          <div className="flex-1 bg-[#1A1A1A]/80 rounded-xl border border-[#FF6B35]/30 p-4 mb-4 overflow-y-auto z-10 backdrop-blur-sm w-full">
            <h2 className="font-mono text-[#F0F0F0]/60 text-xs font-bold mb-4 uppercase tracking-widest">
              Ghost Hunters ({players.length})
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => {
                const profile = player.getState('profile')
                const ready = player.getState('ready')
                const isMe = player.id === me.id
                const isPlayerHost = player.id === players[0]?.id // First player is host
                
                return (
                  <div key={player.id} className={cn("player-card", getAnimationDelay(index))}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("status-dot", ready ? "ready" : "waiting")} />
                        <span className={cn(
                          "font-mono font-medium",
                          isMe ? "text-[#F0F0F0]" : "text-[#F0F0F0]/70"
                        )}>
                          {profile?.name || 'Unknown'}
                          {isPlayerHost && <span className="text-[#FFD700] text-xs ml-1">👑</span>}
                          {isMe && <span className="text-[#FF6B35] text-xs ml-2 font-bold">[YOU]</span>}
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
        )}
        
        {/* Action Buttons */}
        <div className="space-y-3 z-10">
          <button
            onClick={toggleReady}
            className={cn(
              "py-4 rounded-lg text-lg font-bold transition-all w-full",
              isReady ? "btn-ready" : "btn-ghost"
            )}
          >
            {isReady ? 'CANCEL READY' : 'READY FOR HAUNT'}
          </button>
          
          {/* Start Game Button - Explicit amIHost check with visual feedback */}
          {amIHost && (
            <button
              onClick={handleStartGame}
              disabled={!allReady || !rolesAssigned}
              className={cn(
                "w-full py-4 rounded-lg text-lg font-bold transition-all font-mono uppercase tracking-wider",
                allReady && rolesAssigned
                  ? "btn-primary animate-pulse-glow"
                  : "bg-[#1A1A1A] border-2 border-[#FF6B35]/30 text-[#FF6B35]/50 cursor-not-allowed"
              )}
            >
              {!rolesAssigned
                ? 'ASSIGN ROLES FIRST'
                : !allReady
                ? `WAITING (${players.filter(p => p.getState('ready')).length}/${players.length})`
                : 'START GHOST HUNT'
              }
            </button>
          )}
          
          {/* Debug indicator for non-hosts */}
          {!amIHost && players.length > 0 && (
            <div className="text-center py-2">
              <span className="font-mono text-xs text-[#F0F0F0]/40">
                👑 Only Host can start the game
              </span>
            </div>
          )}
          
          <button
            onClick={handleLeaveRoom}
            className="w-full py-2 rounded-lg text-sm font-bold transition-all font-mono bg-[#1A1A1A] border border-[#F0F0F0]/30 text-[#F0F0F0]/70 hover:bg-[#1A1A1A]/80"
          >
            LEAVE ROOM
          </button>
        </div>
      </div>
    </div>
  )
}

export default Lobby
