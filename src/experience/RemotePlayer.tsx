import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import type { Player } from 'playroomkit'

interface RemotePlayerProps {
  player: Player
}

function useSkinnedMeshClone(path: string) {
  const { scene, animations } = useGLTF(path)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  useGraph(clonedScene)
  return { scene: clonedScene, animations }
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
  const [currentAnim, setCurrentAnim] = useState<string>('idle')

  const { scene, animations } = useSkinnedMeshClone('/models/characters/character-male-a.glb')
  const { actions } = useAnimations(animations, scene)

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone()
          ;(mesh.material as THREE.MeshStandardMaterial).color.set(0xff0000)
          ;(mesh.material as THREE.MeshStandardMaterial).emissive.set(0x330000)
          ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2
        }
      }
    })
  }, [scene])

  useEffect(() => {
    actions['idle']?.reset().fadeIn(0.2).play()
    return () => {
      actions['idle']?.fadeOut(0.2)
    }
  }, [actions])

  useFrame((_, delta) => {
    const posState = player.getState<{ x: number; y: number; z: number }>('pos')
    if (posState) {
      targetPos.current.set(posState.x, posState.y, posState.z)
    }

    if (meshRef.current) {
      meshRef.current.position.lerp(targetPos.current, delta * 10)
    }

    const networkAnim = player.getState<string>('anim')
    if (networkAnim && networkAnim !== currentAnim && actions[networkAnim]) {
      const prev = actions[currentAnim]
      const next = actions[networkAnim]

      prev?.fadeOut(0.2)
      next?.reset().fadeIn(0.2).play()

      setCurrentAnim(networkAnim)
    }

    logThrottled(`RemotePlayer ${player.id.slice(0, 6)}`, {
      pos: posState ? `${posState.x.toFixed(1)}, ${posState.y.toFixed(1)}, ${posState.z.toFixed(1)}` : 'none',
      anim: networkAnim || 'none'
    })
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene} scale={0.6} position={[0, -0.8, 0]} />
    </group>
  )
}
