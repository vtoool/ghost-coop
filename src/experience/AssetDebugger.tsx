import { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'

interface GLTFResult {
  scene: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
  materials: Record<string, THREE.Material>;
}

export const AssetDebugger: React.FC = () => {
  const { scene } = useGLTF('/models/environment/block-grass-square.glb') as GLTFResult
  const ref = useRef<Group>(null)

  useEffect(() => {
    if (!scene) return

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    console.log("🔍 DEBUG: Square Block Size:", size)
    console.log("📍 DEBUG: Square Block Center:", box.getCenter(new THREE.Vector3()))

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = new THREE.MeshBasicMaterial({
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
