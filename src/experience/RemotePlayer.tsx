import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import type { Player } from 'playroomkit'

const REMOTE_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#ff3333',
  roughness: 0.8,
  map: null
})

function useSkinnedMeshClone(path: string) {
  const { scene, animations } = useGLTF(path)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes } = useGraph(clonedScene)
  return { scene: clonedScene, animations, nodes }
}

export default function RemotePlayer({ player }: { player: Player }) {
  const { scene, animations } = useSkinnedMeshClone('/models/characters/character-male-a.glb')
  const { actions } = useAnimations(animations, scene)
  const group = useRef<THREE.Group>(null)
  const [currentAnim, setCurrentAnim] = useState('idle')

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = REMOTE_MATERIAL
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  useEffect(() => {
    actions['idle']?.reset().play()
    return () => {
      actions['idle']?.fadeOut(0.2)
    }
  }, [actions])

  useFrame((_, delta) => {
    const targetPos = player.getState<{ x: number; y: number; z: number }>('pos')
    if (targetPos && group.current) {
      group.current.position.lerp(new THREE.Vector3(targetPos.x, targetPos.y - 1, targetPos.z), delta * 15)
    }

    const targetRot = player.getState<{ x: number; y: number; z: number; w: number }>('quat')
    if (targetRot && group.current) {
      const q = new THREE.Quaternion(targetRot.x, targetRot.y, targetRot.z, targetRot.w)
      group.current.quaternion.slerp(q, delta * 15)
    }

    const networkAnim = player.getState<string>('anim')
    if (networkAnim && networkAnim !== currentAnim && actions[networkAnim]) {
      const prev = actions[currentAnim]
      const next = actions[networkAnim]
      prev?.fadeOut(0.2)
      next?.reset().fadeIn(0.2).play()
      setCurrentAnim(networkAnim)
    }
  })

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}
