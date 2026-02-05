import { useMultiplayerState, myPlayer } from 'playroomkit'
import { useState, useEffect } from 'react'

export default function OperatorHUD() {
  const ghostPos = useMultiplayerState('ghostPos', { x: 0, y: 1.5, z: 0 })
  const [revealed, setRevealed] = useState(false)
  const [revealTimer, setRevealTimer] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyE') {
        setRevealed(true)
        setRevealTimer(5)
        myPlayer().setState('ghostRevealed', true)
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'KeyE') {
        setRevealed(false)
        setRevealTimer(0)
        myPlayer().setState('ghostRevealed', false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (revealed && revealTimer > 0) {
      const interval = setInterval(() => {
        setRevealTimer(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [revealed, revealTimer])

  const distance = Math.sqrt(
    Math.pow(ghostPos.x - 0, 2) +
    Math.pow(ghostPos.z - 0, 2)
  ).toFixed(1)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 20, 30, 0.85)',
        border: '2px solid #00f0ff',
        borderRadius: '8px',
        padding: '12px 24px',
        color: '#00f0ff',
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>OPERATOR CONSOLE</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>GHOST TRACKER</div>
      </div>

      <div style={{
        position: 'absolute',
        top: '120px',
        left: '20px',
        background: 'rgba(0, 20, 30, 0.85)',
        border: '2px solid #00f0ff',
        borderRadius: '8px',
        padding: '16px',
        color: '#00f0ff',
        minWidth: '180px',
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
      }}>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>TARGET DATA</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: revealed ? '#ff3366' : '#00f0ff' }}>
          {revealed ? 'DETECTED' : 'UNKNOWN'}
        </div>
        <div style={{ fontSize: '14px', marginTop: '12px' }}>
          <div>DISTANCE: <span style={{ color: distance < 10 ? '#ff3366' : '#00f0ff' }}>{distance}m</span></div>
          <div>STATUS: <span style={{ color: revealed ? '#ff3366' : '#00f0ff' }}>{revealed ? 'TRACKING' : 'SCANNING'}</span></div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 20, 30, 0.85)',
        border: '2px solid #00f0ff',
        borderRadius: '8px',
        padding: '16px 32px',
        color: '#00f0ff',
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
      }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>HOLD [E] TO REVEAL GHOST</div>
        {revealed && (
          <div style={{
            marginTop: '8px',
            height: '4px',
            background: 'rgba(0, 240, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(revealTimer / 5) * 100}%`,
              height: '100%',
              background: '#ff3366',
              transition: 'width 1s linear'
            }} />
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 20, 30, 0.85)',
        border: '2px solid #00f0ff',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#00f0ff',
        fontSize: '12px',
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
      }}>
        <div>HUNTER: <span style={{ color: '#ffaa44' }}>ACTIVE</span></div>
        <div>CONNECTED: <span style={{ color: '#00ff88' }}>2/2</span></div>
      </div>
    </div>
  )
}
