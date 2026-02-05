import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import type { Player } from 'playroomkit'

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
        const mesh = child as THREE.Mesh
        const oldMat = mesh.material as THREE.MeshStandardMaterial
        const newMat = oldMat.clone()

        newMat.color.set(0xffffff)
        newMat.roughness = 1
        newMat.metalness = 0
        newMat.emissive.set(0x000000)

        mesh.material = newMat
        mesh.castShadow = true
        mesh.receiveShadow = true
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
      group.current.position.lerp(new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), delta * 15)
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
      <primitive object={scene} scale={0.6} position={[0, -0.8, 0]} />
    </group>
  )
}
