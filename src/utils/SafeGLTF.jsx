import { useGLTF } from '@react-three/drei'

export function SafeGLTF({ path, fallback = null }) {
  try {
    const result = useGLTF(path)
    return result
  } catch (error) {
    console.warn(`SafeGLTF: Failed to load ${path}`, error)
    return { scene: null, error }
  }
}

export function SafeModel({ path, fallback: FallbackComponent, ...props }) {
  try {
    const result = useGLTF(path)
    return <primitive object={result.scene} {...props} />
  } catch (error) {
    console.warn(`SafeGLTF: Failed to load ${path}`, error)
    return FallbackComponent ? <FallbackComponent /> : null
  }
}

export function FallbackModel() {
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial color="gray" />
    </mesh>
  )
}
