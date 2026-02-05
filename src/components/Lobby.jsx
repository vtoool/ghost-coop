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
 * Lobby - Phase 2 with Immutable Host State (Leader Election)
 * 
 * RULE: Assumes network is ALREADY ready (guaranteed by main.jsx Gatekeeper).
 * 
 * HOST AUTHORITY PATTERN:
 * - Uses synchronized 'hostId' state as "Stone Tablet" source of truth
 * - First player claims host: setHostId(me.id, true)
 * - Host migration: If host leaves, remaining player detects and claims
 * - NO players[0] checks - eliminates race conditions
 */
function Lobby() {
  // Use reactive player list - this triggers re-renders when players join/leave/update
  const players = usePlayersList(true)
  const me = myPlayer()
  const [, setGameStart] = useMultiplayerState('gameStart')
  const [gamePhase, setGamePhase] = useMultiplayerState('gamePhase', 'lobby')
  
  // IMMUTABLE HOST STATE - The "Stone Tablet" (Leader Election)
  const [hostId, setHostId] = useMultiplayerState('hostId', null)
  
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
  
  // CRITICAL: Immutable Host Authority - No players[0] fallback
  // Host is whoever's ID is written in the "Stone Tablet" (hostId)
  const amIHost = hostId === me?.id
  
  // Get other player's ready status
  const otherPlayer = players.find(p => p.id !== me?.id)
  const otherPlayerReady = otherPlayer?.getState('ready') || false
  
  // Compute button state - OVERRIDE FOR SOLO DEV MODE
  const getButtonState = () => {
    if (!amIHost) return { 
      text: "WAITING FOR HOST...", 
      disabled: true,
      reason: "not-host"
    }
    // FORCE SOLO MODE: Allow host to start with 1 player
    if (players.length < 1) return { 
      text: "WAITING FOR PLAYER...", 
      disabled: true,
      reason: "waiting-p1"
    }
    // FORCE SOLO MODE: Skip role check for solo (auto-assign below)
    if (players.length >= 2 && (!roles.hunter || !roles.operator)) return { 
      text: "ASSIGN ROLES FIRST", 
      disabled: true,
      reason: "no-roles"
    }
    if (!isReady) return { 
      text: "CLICK READY FIRST", 
      disabled: true,
      reason: "not-ready"
    }
    // FORCE SOLO MODE: Skip other player check when solo
    if (players.length >= 2 && !otherPlayerReady) return { 
      text: "WAITING FOR P2 READY", 
      disabled: true,
      reason: "p2-not-ready"
    }
    return { 
      text: players.length === 1 ? "▶ PLAY SOLO (DEV MODE)" : "START GHOST HUNT", 
      disabled: false,
      reason: "ready"
    }
  }
  
  const buttonState = getButtonState()
  
  // Check if all players are ready
  const allReady = players.length > 0 && players.every(p => p.getState('ready'))
  
  // Check if roles are assigned (2-player OR solo dev mode with 1 player)
  const rolesAssigned = (roles.hunter && roles.operator) || players.length === 1
  
  // Get player names for role cards
  const getPlayerName = (playerId) => {
    if (!playerId) return 'VACANT'
    const player = players.find(p => p.id === playerId)
    return player?.getState('profile')?.name || 'Unknown'
  }
  
  const hunterName = getPlayerName(roles.hunter)
  const operatorName = getPlayerName(roles.operator)
  const myRole = roles.hunter === me.id ? 'hunter' : roles.operator === me.id ? 'operator' : null
  
  // LEADER ELECTION EFFECT - The "Stone Tablet" Authority
  useEffect(() => {
    // CASE 1: Vacancy - No host assigned, claim it if I'm here
    if (!hostId && me?.id) {
      console.log('[Lobby] Leader Election: Claiming host vacancy. My ID:', me.id)
      setHostId(me.id, true) // reliable=true
      return
    }
    
    // CASE 2: Abdication (Migration) - Host left, remaining player claims
    if (hostId && !players.find(p => p.id === hostId)) {
      // Host is gone! Check if I'm the remaining player
      if (players.length > 0 && players[0]?.id === me?.id) {
        console.log('[Lobby] Leader Election: Host departed. Migrating to me:', me.id)
        setHostId(me.id, true) // reliable=true
      }
      return
    }
    
    // Log current state for debugging
    console.log('[Lobby] Leader Election: Host ID =', hostId, 'My ID =', me?.id, 'amIHost =', hostId === me?.id)
  }, [hostId, players, me?.id, setHostId])
  
  // Role Assignment Effect - Only runs if I'm the immutable host
  useEffect(() => {
    // Only Host manages roles to avoid conflicts
    if (!amIHost) {
      console.log('[Lobby] Not host, skipping role management. amIHost:', amIHost)
      return
    }
    
    console.log('[Lobby] Host authority active. Players:', players.length, 'Roles:', roles)
    
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
    
    // CASE B: Solo Play - Assign self as BOTH Hunter AND Operator (FORCE SOLO MODE)
    if (players.length === 1 && (!roles.hunter || !roles.operator)) {
      console.log('[Lobby] Solo mode: Assigning self as BOTH Hunter and Operator')
      setRoles({ hunter: me.id, operator: me.id })
    }
    
    // CASE C: Clear departed player roles
    if (roles.hunter && !players.find(p => p.id === roles.hunter)) {
      console.log('[Lobby] Hunter left, clearing role')
      setRoles(prev => ({ ...prev, hunter: null }))
    }
    if (roles.operator && !players.find(p => p.id === roles.operator)) {
      console.log('[Lobby] Operator left, clearing role')
      setRoles(prev => ({ ...prev, operator: null }))
    }
    
  }, [players, amIHost, me.id, roles.hunter, roles.operator, setRoles])
  
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
  
  // Host starts the game - FORCE SOLO MODE
  const handleStartGame = () => {
    // Allow solo play: 1 player + host + ready (skip rolesAssigned check for solo)
    const canStartSolo = amIHost && isReady && players.length === 1
    const canStartMulti = amIHost && allReady && rolesAssigned && players.length >= 2
    
    if (canStartSolo || canStartMulti) {
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
        
        {/* Role Indicator with Visual Debug */}
        <div className="mt-8 z-10">
          <div className={cn(
            "room-code text-xs flex items-center gap-2 px-4 py-2",
            amIHost ? "border-[#FF6B35] bg-[#FF6B35]/10" : "border-[#00F0FF] bg-[#00F0FF]/10"
          )}>
            <span className="text-lg">{amIHost ? "👑" : "⚡"}</span>
            <span className="font-mono font-bold text-[#F0F0F0]">
              {amIHost ? "HOST" : "CLIENT"}
            </span>
            <span className="text-[#F0F0F0]/50">|</span>
            <span className="text-[#F0F0F0]/70">
              {amIHost ? 'You are the Host' : 'Waiting for Host...'}
            </span>
          </div>
          {hostId && (
            <div className="mt-2 text-center">
              <span className="font-mono text-xs text-[#F0F0F0]/40">
                Host ID: {hostId.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // LOBBY SCREEN - Show when player has entered name
  return (
    <div className="lobby-container w-full h-full bg-spooky flex flex-col items-center p-4 md:p-6 relative overflow-hidden">
      <div className="flex flex-col h-full" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="noise-overlay" />
        
        {/* Header with Host Crown & Visual Debug */}
        <div className="text-center mb-4 md:mb-6 z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className={cn(
              "text-2xl animate-pulse",
              amIHost ? "text-[#FFD700]" : "text-[#00F0FF]"
            )}>
              {amIHost ? "👑" : "⚡"}
            </span>
            <h1 className="font-creepster text-4xl md:text-5xl tracking-wider text-glow-orange" style={{ color: '#FF6B35' }}>
              ECTO-BUSTERS
            </h1>
            <span className={cn(
              "text-xs font-mono px-2 py-1 rounded font-bold",
              amIHost 
                ? "bg-[#FF6B35] text-[#050505]" 
                : "bg-[#00F0FF] text-[#050505]"
            )}>
              {amIHost ? "HOST" : "CLIENT"}
            </span>
          </div>
          
          {/* Visual Debug - Authority Status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="font-mono text-xs text-[#F0F0F0]/60">
              {amIHost ? "👑 STONE TABLET AUTHORITY" : "⚡ CLIENT MODE"}
            </span>
            <span className="text-[#F0F0F0]/30">|</span>
            <span className="font-mono text-xs text-[#FF6B35]">
              {players.length}/2 PLAYERS
            </span>
          </div>
          
          {/* Host ID Debug (subtle) */}
          {hostId && (
            <div className="mt-1">
              <span className="font-mono text-xs text-[#F0F0F0]/30">
                Host: {hostId === me?.id ? "YOU" : hostId.slice(0, 8) + "..."}
              </span>
            </div>
          )}
          
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
            {!amIHost && (
              <p className="font-mono text-[#FFD700] text-xs mt-1 animate-pulse">
                👑 Only Host can invite
              </p>
            )}
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
            
            {/* Role Swap Controls - Show to Host only */}
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
              <div className="mt-4 text-center py-3 bg-[#1A1A1A]/50 rounded-lg border border-[#F0F0F0]/10">
                <span className="font-mono text-xs text-[#F0F0F0]/50 animate-flicker">
                  👑 Waiting for Host to manage roles...
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
                const isPlayerHost = player.id === hostId // Use immutable hostId
                
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
          {/* Ready Toggle - Available to everyone */}
          <button
            onClick={toggleReady}
            className={cn(
              "py-4 rounded-lg text-lg font-bold transition-all w-full",
              isReady ? "btn-ready" : "btn-ghost"
            )}
          >
            {isReady ? 'CANCEL READY' : 'READY FOR HAUNT'}
          </button>
          
          {/* Start Game Button - Shows to everyone but only works for Host */}
          <button
            onClick={handleStartGame}
            disabled={buttonState.disabled}
            className={cn(
              "w-full py-4 rounded-lg text-lg font-bold transition-all font-mono uppercase tracking-wider",
              !buttonState.disabled
                ? "btn-primary animate-pulse-glow"
                : "bg-[#1A1A1A] border-2 border-[#FF6B35]/30 text-[#FF6B35]/50 cursor-not-allowed"
            )}
          >
            {buttonState.text}
          </button>
          
          {/* Status indicator showing exact state */}
          <div className="text-center">
            <span className="font-mono text-xs text-[#F0F0F0]/40">
              {buttonState.reason === 'not-host' && "👑 Only Host can start"}
              {buttonState.reason === 'waiting-p2' && "⏳ Waiting for Player 2..."}
              {buttonState.reason === 'waiting-p1' && "⏳ Waiting for player to join..."}
              {buttonState.reason === 'no-roles' && amIHost && "🎭 Host: Click SWAP ROLES to assign"}
              {buttonState.reason === 'no-roles' && !amIHost && "🎭 Waiting for role assignment..."}
              {buttonState.reason === 'not-ready' && "✋ Click READY FOR HAUNT first"}
              {buttonState.reason === 'p2-not-ready' && "⏳ Waiting for other player to ready up..."}
              {buttonState.reason === 'ready' && players.length === 1 && "🎮 SOLO DEV MODE ACTIVE"}
              {buttonState.reason === 'ready' && players.length >= 2 && "🚀 Ready to launch!"}
            </span>
          </div>
          
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
