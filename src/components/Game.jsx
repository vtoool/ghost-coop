import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import GameWorld from '../experience/GameWorld'

/**
 * Game - The 3D Game Container
 * 
 * Sets up the R3F canvas with physics and renders the game world.
 * This is the main entry point for the 3D experience.
 */
export default function Game() {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 5, 10], fov: 50 }}
      >
        <Suspense fallback={null}>
          <Physics debug>
            <GameWorld />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}
