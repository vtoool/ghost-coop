import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { useMultiplayerState, myPlayer, usePlayersList } from 'playroomkit'
import { Stats, PerformanceMonitor, Sparkles } from '@react-three/drei'
import RoleManager from './RoleManager'
import RemotePlayer from './RemotePlayer'
import Environment from './Environment'
import Ghost from './Ghost'
import { usePerformanceLogger } from '../hooks/usePerformanceLogger'
import type { Roles } from '../types/game.types'
import { ObjectRegistry } from './ObjectRegistry'

export default function GameWorld(): ReactElement {
  const [lowQuality, setLowQuality] = useState<boolean>(false)

  usePerformanceLogger({ enabled: false, interval: 2000 })

  const [roles] = useMultiplayerState<Roles>('roles', { hunter: null, operator: null })
  const player = myPlayer()
  const players = usePlayersList(true)

  useEffect(() => {
    console.log('[Multiplayer] === JOIN/LEAVE EVENT ===')
    console.log('[Multiplayer] MyPlayer ID:', player?.id)
    console.log('[Multiplayer] All Players:', players.map(p => ({ id: p.id.slice(0, 8), isMe: p.id === player?.id })))
  }, [players.length, player?.id])

  const handlePerformanceDecline = (): void => {
    console.log('[PerformanceMonitor] Quality degraded - reducing effects')
    setLowQuality(true)
  }

  const handlePerformanceIncline = (): void => {
    console.log('[PerformanceMonitor] Quality restored')
    setLowQuality(false)
  }

  return (
    <ObjectRegistry>
      <>
        {/* Performance Monitoring - Stats positioned in top-left corner */}
        <Stats className="stats" />
        <PerformanceMonitor 
          onDecline={handlePerformanceDecline}
          onIncline={handlePerformanceIncline}
        />

        {/* Background Color for Mist Effect - Deep Midnight Blue */}
        <color attach="background" args={['#0a0a12']} />

        {/* Lighting - Deep Blue Moonlight with Hemisphere Base */}
        <hemisphereLight args={['#2a2a35', '#050505', 0.5]} />
        <ambientLight intensity={0.1} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.05}
          color="#0a0a1a"
        />
        <object3D position={[100, -100, 100]} />
        
        {/* Fog - Matches background for infinite depth illusion */}
        <fogExp2 attach="fog" args={['#0a0a12', 0.06]} />

        {/* Player Aura - Single performant light that follows the player (now handled by HunterController) */}
        {/* <pointLight ref={playerLightRef} color="#ffaa44" intensity={10} distance={12} decay={2} /> */}

        {/* Full Graveyard Environment */}
        <Environment />

        {/* Ghost Entity - controlled by host */}
        <Ghost />

        {/* Floating Embers */}
        <Sparkles count={lowQuality ? 50 : 100} scale={[20, 10, 20]} size={2} speed={0.2} color="#ffaa44" />

        {/* Post-Processing for Glow - TEMPORARILY DISABLED to verify glow sprites */}
        {/* {!lowQuality && (
          <EffectComposer>
            <Bloom luminanceThreshold={1} intensity={0.8} />
          </EffectComposer>
        )} */}

        {/* Player Rendering Loop */}
        {players.map((p) => {
          const isLocal = p.id === player?.id
          console.log(`[PlayerLoop] Player ${p.id.slice(0, 8)}, isLocal: ${isLocal}`)

          return isLocal ? (
            <RoleManager
              key={p.id}
              roles={roles}
              playerId={p.id}
              player={p}
              isLocal={true}
            />
          ) : (
            <RemotePlayer key={p.id} player={p} />
          )
        })}
      </>
    </ObjectRegistry>
  )
}
