import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Suspense, useMemo, useState } from 'react'
import { Joystick, myPlayer, useMultiplayerState } from 'playroomkit'
import { ErrorBoundary } from 'react-error-boundary'
import GameWorld from '../experience/GameWorld'

function Fallback({ error }) {
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

function ClickToPlay({ isHunter, isTouchDevice }) {
  const [clicked, setClicked] = useState(false)
  const [roles] = useMultiplayerState('roles')
  const me = myPlayer()
  const isHunterConfirmed = roles ? roles.hunter === me?.id : null
  
  if (clicked) return null
  
  if (isHunterConfirmed === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-orange-500 mb-4">LOADING MISSION...</h2>
        </div>
      </div>
    )
  }
  
  if (!isHunterConfirmed || isTouchDevice) return null
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer bg-black/70 pointer-events-auto"
      onClick={() => setClicked(true)}
    >
    >
      <div className="text-center pointer-events-none">
        <h2 className="text-4xl font-bold text-orange-500 mb-4">CLICK TO CAPTURE MOUSE</h2>
        <p className="text-white text-lg">Click anywhere to start controlling your Hunter</p>
      </div>
    </div>
  )
}

export default function Game() {
  const keyboardMap = useMemo(() => [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] }
  ], [])
  
  const [roles] = useMultiplayerState('roles')
  const me = myPlayer()
  const isHunter = roles ? roles.hunter === me?.id : false
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  
  return (
    <div className="w-full h-full absolute inset-0">
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
      
      <ClickToPlay isHunter={isHunter} isTouchDevice={isTouchDevice} />
    </div>
  )
}
