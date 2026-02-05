import { useGLTF } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'
import type { ReactNode } from 'react'
import { type Group, type Object3DEventMap } from 'three'

/**
 * Safely loads a GLTF model with error handling
 * @param options - Configuration object with path and optional fallback
 * @returns The GLTF result or fallback on error
 */
export function SafeGLTF({ path }: { path: string }): GLTF | { scene: null; error: unknown } {
  try {
    const result = useGLTF(path)
    return result
  } catch (error) {
    console.warn(`SafeGLTF: Failed to load ${path}`, error)
    return { scene: null, error }
  }
}

interface SafeModelProps {
  path: string
  fallback?: ReactNode
  [key: string]: unknown
}

/**
 * React component that safely renders a GLTF model with fallback
 * @param props - Component props including path, optional fallback component, and additional props to pass to the primitive
 * @returns JSX.Element with the loaded model or fallback
 */
export function SafeModel({ path, fallback: FallbackComponent, ...props }: SafeModelProps): ReactNode {
  try {
    const result = useGLTF(path) as GLTF & { scene: Group<Object3DEventMap> }
    return <primitive object={result.scene} {...props} />
  } catch (error) {
    console.warn(`SafeGLTF: Failed to load ${path}`, error)
    return FallbackComponent ?? null
  }
}

/**
 * Simple fallback mesh component when model fails to load
 * @returns JSX.Element with a gray box mesh
 */
export function FallbackModel(): ReactNode {
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial color="gray" />
    </mesh>
  )
}
