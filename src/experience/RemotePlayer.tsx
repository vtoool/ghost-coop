import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Player } from 'playroomkit'

interface RemotePlayerProps {
  player: Player
}

let lastLog = 0

function logThrottled(label: string, data: unknown) {
  const now = Date.now()
  if (now - lastLog > 2000) {
    console.log(`[${label}]`, data)
    lastLog = now
  }
}

export default function RemotePlayer({ player }: RemotePlayerProps): React.ReactElement {
  const meshRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(0, 5, 0))

  const { scene } = useGLTF('/models/characters/character-male-a.glb')

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false
        if (mesh.material) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xFF3333,
            emissive: 0x330000,
            emissiveIntensity: 0.2
          })
        }
      }
    })
  }, [scene])

  useFrame((_, delta) => {
    const posState = player.getState<{ x: number; y: number; z: number }>('pos')
    if (posState) {
      targetPos.current.set(posState.x, posState.y, posState.z)
    }

    if (meshRef.current) {
      meshRef.current.position.lerp(targetPos.current, delta * 10)
    }

    logThrottled(`RemotePlayer ${player.id.slice(0, 6)}`, {
      pos: posState ? `${posState.x.toFixed(1)}, ${posState.y.toFixed(1)}, ${posState.z.toFixed(1)}` : 'none'
    })
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene} scale={0.6} position={[0, -0.8, 0]} />
    </group>
  )
}
