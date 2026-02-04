import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'

export function MapRenderer() {
  const platformerTx = useTexture('/models/environment/Textures/colormap_platformer.png')
  platformerTx.colorSpace = THREE.SRGBColorSpace
  platformerTx.flipY = false

  const graveyardTx = useTexture('/models/environment/Textures/colormap_graveyard.png')
  graveyardTx.colorSpace = THREE.SRGBColorSpace
  graveyardTx.flipY = false

  const { scene: roundedScene } = useGLTF('/models/environment/block-grass.glb')
  const { scene: squareScene } = useGLTF('/models/environment/block-grass-square.glb')

  const roundedClone = useMemo(() => {
    const clone = roundedScene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = platformerTx
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [roundedScene, platformerTx])

  const squareClone = useMemo(() => {
    const group = new THREE.Group()

    const dirtGeo = new THREE.BoxGeometry(2.3, 1, 2.3)
    const dirtMat = new THREE.MeshStandardMaterial({
      color: '#6d4e3d',
      roughness: 1,
    })
    const dirtMesh = new THREE.Mesh(dirtGeo, dirtMat)
    dirtMesh.position.set(0, 0.45, 0)
    dirtMesh.castShadow = true
    dirtMesh.receiveShadow = true
    group.add(dirtMesh)

    const grassMesh = squareScene.clone()
    const box = new THREE.Box3().setFromObject(grassMesh)
    const size = new THREE.Vector3()
    box.getSize(size)

    const targetSize = 2.3
    const scaleX = size.x > 0 ? targetSize / size.x : 2.3
    const scaleZ = size.z > 0 ? targetSize / size.z : 2.3

    grassMesh.scale.set(scaleX, 1, scaleZ)

    grassMesh.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#599338',
          roughness: 0.9,
        })
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    grassMesh.position.set(0, 0.95, 0)

    group.add(grassMesh)

    return group
  }, [squareScene])

  const gridSize = 2
  const width = level1[0].length
  const height = level1.length
  const offsetX = width * gridSize / 2
  const offsetZ = height * gridSize / 2

  const floorTiles = []
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const isEdge = x === 0 || x === width - 1 || z === 0 || z === height - 1
      const model = isEdge ? roundedClone : squareClone

      floorTiles.push(
        <primitive
          key={`floor-${x}-${z}`}
          object={model.clone()}
          position={[x * gridSize - offsetX, -1, z * gridSize - offsetZ]}
        />
      )
    }
  }

  const props = level1.flatMap((row, z) =>
    row.split('').map((char, x) => {
      const name = mapLegend[char]
      if (!name) return null
      return (
        <MapTile
          key={`prop-${x}-${z}`}
          name={name}
          position={[x * gridSize - offsetX, 0, z * gridSize - offsetZ]}
          texture={graveyardTx}
        />
      )
    })
  )

  return (
    <group>
      <group>{floorTiles}</group>
      <group>{props}</group>
      <RigidBody type="fixed" position={[0, -1, 0]}>
        <CuboidCollider args={[50, 1, 50]} />
      </RigidBody>
    </group>
  )
}

function MapTile({ name, position, texture }) {
  const { scene } = useGLTF(`/models/environment/${name}.glb`)
  const clone = useMemo(() => {
    const c = scene.clone()
    c.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.map = texture
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return c
  }, [scene, texture])

  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <primitive object={clone} />
    </RigidBody>
  )
}
