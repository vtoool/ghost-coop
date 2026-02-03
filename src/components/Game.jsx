import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import { Joystick, myPlayer, useMultiplayerState } from 'playroomkit'
import { ErrorBoundary } from 'react-error-boundary'
import GameWorld from '../experience/GameWorld'

function Fallback({ error, resetErrorBoundary }) {
  console.error('Game World Error:', error)
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="orange" wireframe />
      </mesh>
    </group>
  )
}

/**
 * Game - The 3D Game Container
 * 
 * Sets up the R3F canvas with physics and renders the game world.
 * This is the main entry point for the 3D experience.
 * 
 * Features:
 * - KeyboardControls wrapper for WASD input
 * - Conditional Joystick rendering for mobile Hunter
 */
export default function Game() {
  // Define keyboard controls map
  const keyboardMap = useMemo(() => [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] }
  ], [])
  
  // Check if this player is the Hunter
  const [roles] = useMultiplayerState('roles')
  const player = myPlayer()
  const isHunter = roles?.hunter === player?.id
  
  // Check for touch device (mobile)
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  
  return (
    <div className="w-full h-full absolute inset-0">
      {/* Keyboard Controls Wrapper */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 5, 10], fov: 50 }}
        >
          <Suspense fallback={null}>
            <ErrorBoundary FallbackComponent={Fallback}>
              <Physics debug>
                <GameWorld />
              </Physics>
            </ErrorBoundary>
          </Suspense>
        </Canvas>
      </KeyboardControls>
      
      {/* Conditional Joystick for Hunter on Mobile */}
      {isHunter && isTouchDevice && (
        <Joystick 
          style={{
            position: 'fixed',
            bottom: '50px',
            left: '50px',
            zIndex: 1000
          }}
        />
      )}
    </div>
  )
}
