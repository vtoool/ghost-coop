import { useRef, useLayoutEffect, useMemo, type ReactNode } from 'react'
import type { InstancedMesh } from 'three'
import { Object3D } from 'three'
import { InstancedRigidBodies } from '@react-three/rapier'
import { useObjectRegistry } from './ObjectRegistry'

interface InstancerProps {
  model: string
  positions: number[][]
  rotation?: number
  scale?: number
  collider?: 'cuboid' | 'hull' | 'trimesh'
}

interface RigidBodyInstance {
  key: string | number
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

const tempObject = new Object3D()

export function Instancer({
  model,
  positions,
  rotation = 0,
  scale = 1,
  collider = 'cuboid',
}: InstancerProps): ReactNode {
  const { getModel, isLoading } = useObjectRegistry()
  const meshRef = useRef<InstancedMesh>(null)
  const modelData = getModel(model)

  const validPositions = useMemo(() => {
    if (!positions || positions.length === 0) return []
    return positions.filter((pos): pos is [number, number, number] =>
      Array.isArray(pos) && pos.length === 3 && pos.every(n => typeof n === 'number')
    )
  }, [positions])

  const instances: RigidBodyInstance[] = useMemo(() => {
    return validPositions.map((pos, index) => ({
      key: `${index}-${pos[0]}-${pos[1]}-${pos[2]}`,
      position: [pos[0], pos[1], pos[2]],
      rotation: [0, rotation, 0] as [number, number, number],
      scale: [scale, scale, scale] as [number, number, number],
    }))
  }, [validPositions, rotation, scale])

  useLayoutEffect(() => {
    if (!meshRef.current || validPositions.length === 0) return

    meshRef.current.count = validPositions.length

    for (let i = 0; i < validPositions.length; i++) {
      const pos = validPositions[i]
      
      tempObject.position.set(pos[0], pos[1], pos[2])
      tempObject.rotation.set(0, rotation, 0)
      tempObject.scale.setScalar(scale)
      
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [validPositions, rotation, scale])

  if (isLoading || !modelData) {
    return null
  }

  if (!modelData.geometry) {
    console.warn(`[Instancer] Model "${model}" has no geometry, skipping`)
    return null
  }

  if (validPositions.length === 0) {
    return null
  }

  const material = modelData.material ?? undefined

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders={collider}
      type="fixed"
    >
      <instancedMesh
        ref={meshRef}
        args={[modelData.geometry, material, validPositions.length]}
        castShadow
        receiveShadow
      />
    </InstancedRigidBodies>
  )
}

interface InstancedPropGroupProps {
  items: { name: string; positions: number[][] }[]
  defaultCollider?: 'cuboid' | 'hull' | 'trimesh'
}

export function InstancedPropGroup({
  items,
  defaultCollider = 'cuboid',
}: InstancedPropGroupProps): ReactNode {
  return (
    <>
      {items.map((item) => (
        <Instancer
          key={item.name}
          model={item.name}
          positions={item.positions}
          collider={defaultCollider}
        />
      ))}
    </>
  )
}
