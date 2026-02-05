import type { ReactElement } from 'react'
import { useState } from 'react'
import { Stats, PerformanceMonitor, Sparkles } from '@react-three/drei'
import PlayerManager from './PlayerManager'
import Environment from './Environment'
import Ghost from './Ghost'
import { usePerformanceLogger } from '../hooks/usePerformanceLogger'
import { ObjectRegistry } from './ObjectRegistry'

export default function GameWorld(): ReactElement {
  const [lowQuality, setLowQuality] = useState<boolean>(false)

  usePerformanceLogger({ enabled: false, interval: 2000 })

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
        <Stats className="stats" />
        <PerformanceMonitor 
          onDecline={handlePerformanceDecline}
          onIncline={handlePerformanceIncline}
        />

        <color attach="background" args={['#0a0a12']} />

        <hemisphereLight args={['#2a2a35', '#050505', 0.5]} />
        <ambientLight intensity={0.1} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.05}
          color="#0a0a1a"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <object3D position={[100, -100, 100]} />
        
        <fogExp2 attach="fog" args={['#0a0a12', 0.06]} />

        <Environment />

        <Ghost />

        <Sparkles count={lowQuality ? 50 : 100} scale={[20, 10, 20]} size={2} speed={0.2} color="#ffaa44" />

        <PlayerManager />
      </>
    </ObjectRegistry>
  )
}
