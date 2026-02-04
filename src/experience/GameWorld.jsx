import { useState } from 'react'
import { useMultiplayerState, myPlayer, usePlayersList } from 'playroomkit'
import { RigidBody } from '@react-three/rapier'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Sparkles, Stats, PerformanceMonitor } from '@react-three/drei'
import RoleManager from './RoleManager'
import Environment from './Environment'
import { usePerformanceLogger } from '../hooks/usePerformanceLogger'

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
export default function GameWorld() {
  const [lowQuality, setLowQuality] = useState(false)

  // Enable performance logging
  usePerformanceLogger({ enabled: true, interval: 2000 })

  // Get roles from Playroom state
  const [roles] = useMultiplayerState('roles', { hunter: null, operator: null })
  const player = myPlayer()
  const players = usePlayersList()
  
  // Determine this player's role
  const isOperator = roles?.operator === player?.id
  
  // Get Hunter's synced position for Operator view
  const hunterPlayer = players.find(p => p.id === roles?.hunter)
  const hunterPos = hunterPlayer?.getState('pos') || { x: 0, y: 2, z: 0 }

  return (
    <>
      {/* Performance Monitoring - Stats positioned in top-left corner */}
      <Stats className="stats" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 9999 }} />
      <PerformanceMonitor 
        onDecline={() => {
          console.log('[PerformanceMonitor] Quality degraded - reducing effects')
          setLowQuality(true)
        }}
        onIncline={() => {
          console.log('[PerformanceMonitor] Quality restored')
          setLowQuality(false)
        }}
        smoothin={0.1}
      />

      {/* Background Color for Mist Effect */}
      <color attach="background" args={['#050505']} />

      {/* Lighting - Deep Blue Moonlight - No Hotspot */}
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.05}
        color="#0a0a1a"
      />
      <object3D position={[100, -100, 100]} />
      
      {/* Fog */}
      <fogExp2 attach="fog" args={['#050505', 0.045]} />

      {/* Player Aura - Single performant light that follows the player (now handled by HunterController) */}
      {/* <pointLight ref={playerLightRef} color="#ffaa44" intensity={10} distance={12} decay={2} /> */}

      {/* Full Graveyard Environment */}
      <Environment />

      {/* Ghost Entity - Hidden (Ghost Moon placeholder removed) */}
      {/* <RigidBody type="kinematicPosition" position={[0, 3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial 
            color="#00F0FF" 
            emissive="#00F0FF" 
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      </RigidBody> */}
      
      {/* Ghost glow effect - Hidden */}
      {/* <pointLight position={[0, 3, 0]} intensity={2} color="#00F0FF" distance={10} /> */}

      {/* Hunter position marker for Operator view - Hidden (Orange Circle placeholder removed) */}
      {/* {isOperator && hunterPlayer && (
        <group position={[hunterPos.x, hunterPos.y, hunterPos.z]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
            <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.5} />
          </mesh>
          <pointLight intensity={1} color="#FF6B35" distance={5} />
        </group>
      )} */}

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
  )
}
