import type { ReactElement } from 'react'
import { useState } from 'react'
import { useMultiplayerState, myPlayer } from 'playroomkit'
import { Stats, PerformanceMonitor, Sparkles } from '@react-three/drei'
import RoleManager from './RoleManager'
import Environment from './Environment'
import Ghost from './Ghost'
import { usePerformanceLogger } from '../hooks/usePerformanceLogger'
import type { Roles } from '../types/game.types'
import { ObjectRegistry } from './ObjectRegistry'

/**
 * GameWorld - The 3D Scene
 * 
 * Contains lighting, environment, and role-based view logic.
 * Everyone sees the same world, but cameras differ by role.
 * 
 * Features:
 * - Full graveyard environment with procedural props
 * - Ghost entity that both players interact with
 * - Hunter position synced to Operator view
 */
export default function GameWorld(): ReactElement {
  const [lowQuality, setLowQuality] = useState<boolean>(false)

  // Enable performance logging (disabled for production)
  usePerformanceLogger({ enabled: false, interval: 2000 })

  // Get roles from Playroom state
  const [roles] = useMultiplayerState<Roles>('roles', { hunter: null, operator: null })
  const player = myPlayer()

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

        {/* Role-based view management */}
        <RoleManager roles={roles} playerId={player?.id} />
      </>
    </ObjectRegistry>
  )
}
