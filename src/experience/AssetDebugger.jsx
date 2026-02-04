import { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function AssetDebugger() {
  const { scene } = useGLTF('/models/environment/block-grass-square.glb')
  const ref = useRef()

  useEffect(() => {
    if (!scene) return

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    console.log("🔍 DEBUG: Square Block Size:", size)
    console.log("📍 DEBUG: Square Block Center:", box.getCenter(new THREE.Vector3()))

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        })
      }
    })
  }, [scene])

  return (
    <group position={[0, 5, 0]}>
      <primitive object={scene} ref={ref} />
      <mesh position={[0,0,0]}>
         <boxGeometry args={[0.5, 0.5, 0.5]} />
         <meshBasicMaterial color="blue" wireframe />
      </mesh>
      <axesHelper args={[5]} />
    </group>
  )
}
