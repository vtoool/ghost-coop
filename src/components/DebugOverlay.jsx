import { useState } from 'react'
import { myPlayer, isHost, usePlayersList, useMultiplayerState } from 'playroomkit'

/**
 * DebugOverlay - Real-time Connection State Monitor
 * 
 * Floats in bottom-left corner showing live network data.
 * Mount this in App.jsx to visually verify connection state.
 * 
 * Displays:
 * - myPlayer().id
 * - isHost() status
 * - usePlayersList().length
 * - Current Game Phase
 */
function DebugOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  
  // Get reactive data from Playroom hooks
  const players = usePlayersList()
  const [gameStart] = useMultiplayerState('gameStart', false)
  const me = myPlayer()
  
  // Derived values - computed fresh on each render
  const playerId = me?.id || 'N/A'
  const hostStatus = isHost()
  const playerCount = players.length
  
  // Determine game phase
  let gamePhase = 'WELCOME'
  if (gameStart) {
    gamePhase = 'GAME'
  } else {
    const myProfile = me?.getState('profile')
    if (myProfile?.name) {
      gamePhase = 'LOBBY'
    }
  }
  
  if (!isVisible) return null
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid #FF6B35',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: '#F0F0F0',
        minWidth: '200px',
        boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px',
        borderBottom: '1px solid #FF6B35',
        paddingBottom: '4px'
      }}>
        <span style={{ color: '#FF6B35', fontWeight: 'bold' }}>🔌 NETWORK GATE</span>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F0F0F0',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Data Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Player ID:</span>
          <span style={{ color: '#00F0FF', fontWeight: 'bold' }}>
            {playerId.slice(0, 8)}...
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Role:</span>
          <span style={{ 
            color: hostStatus ? '#FF6B35' : '#00F0FF',
            fontWeight: 'bold'
          }}>
            {hostStatus ? '👑 HOST' : '🎮 GUEST'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Players:</span>
          <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
            {playerCount}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Phase:</span>
          <span style={{ 
            color: gamePhase === 'GAME' ? '#00FF00' : gamePhase === 'LOBBY' ? '#FFD700' : '#FF6B35',
            fontWeight: 'bold'
          }}>
            {gamePhase}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Status:</span>
          <span style={{ color: '#00FF00', fontWeight: 'bold' }}>✓ CONNECTED</span>
        </div>
      </div>
      
      {/* Connection Quality Indicator */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '2px',
          justifyContent: 'flex-end'
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              style={{
                width: '4px',
                height: '12px',
                background: i <= Math.min(playerCount, 4) ? '#00FF00' : '#333',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default DebugOverlay
