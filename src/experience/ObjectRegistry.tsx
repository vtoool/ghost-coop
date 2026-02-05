import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATHS = {
  iron_fence: '/models/environment/iron-fence.glb',
  iron_fence_border_gate: '/models/environment/iron-fence-border-gate.glb',
  stone_wall: '/models/environment/stone-wall.glb',
  pine_crooked: '/models/environment/pine-crooked.glb',
  pine: '/models/environment/pine.glb',
  gravestone_cross: '/models/environment/gravestone-cross.glb',
  gravestone_round: '/models/environment/gravestone-round.glb',
  gravestone_broken: '/models/environment/gravestone-broken.glb',
  crypt: '/models/environment/crypt.glb',
  lantern_candle: '/models/environment/lantern-candle.glb',
  bench: '/models/environment/bench.glb',
  rocks: '/models/environment/rocks.glb',
} as const

type ModelName = keyof typeof MODEL_PATHS

interface ModelData {
  scene: THREE.Group
  geometry: THREE.BufferGeometry | null
  material: THREE.Material | null
  name: string
  isComplex: boolean
}

interface ObjectRegistryContextValue {
  models: Readonly<Record<string, ModelData>>
  graveyardTexture: THREE.Texture | null
  isLoading: boolean
  loadedCount: number
  totalCount: number
  getModel: (name: string) => ModelData | undefined
}

const ObjectRegistryContext = createContext<ObjectRegistryContextValue | null>(null)

export function useObjectRegistry(): ObjectRegistryContextValue {
  const context = useContext(ObjectRegistryContext)
  if (!context) {
    throw new Error('useObjectRegistry must be used within <ObjectRegistry>')
  }
  return context
}

interface ProcessedGLTF {
  scene: THREE.Group
  lightsRemoved: number
}

function processGLTF(
  gltfScene: THREE.Group,
  name: string,
  texture: THREE.Texture | null
): ProcessedGLTF {
  const lightsRemoved = { current: 0 }

  const processed = gltfScene.clone()

  processed.traverse((child) => {
    if ((child as THREE.Light).isLight) {
      child.parent?.remove(child)
      lightsRemoved.current++
      return
    }

    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh

      mesh.castShadow = true
      mesh.receiveShadow = true

      if (mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial

        if (!mat.name) {
          mat.name = `${name}-material`
        }

        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            m.emissive = new THREE.Color(0x000000)
            m.emissiveIntensity = 0
            if (texture && m.map === null) {
              m.map = texture
            }
          })
        } else {
          mat.emissive = new THREE.Color(0x000000)
          mat.emissiveIntensity = 0
          if (texture && mat.map === null) {
            mat.map = texture
          }
        }
      }
    }
  })

  return { scene: processed, lightsRemoved: lightsRemoved.current }
}

function extractMainGeometry(
  gltf: THREE.Group,
  texture: THREE.Texture | null
): { geometry: THREE.BufferGeometry | null; material: THREE.Material | null } {
  const meshes: THREE.Mesh[] = []

  gltf.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      meshes.push(child as THREE.Mesh)
    }
  })

  if (meshes.length > 0) {
    const firstMesh = meshes[0]
    const geometry = firstMesh.geometry.clone()
    const material = firstMesh.material as THREE.Material

    if (material) {
      const mat = material as THREE.MeshStandardMaterial
      if (texture && !mat.map) {
        mat.map = texture
        mat.needsUpdate = true
      }
    }

    return { geometry, material }
  }

  return { geometry: null, material: null }
}

interface ObjectRegistryProps {
  children: ReactNode
}

function ModelLoader({
  name,
  path,
  texture,
  onLoad,
}: {
  name: ModelName
  path: string
  texture: THREE.Texture | null
  onLoad: (data: ModelData) => void
}) {
  const gltf = useGLTF(path)
  const gltfScene = gltf.scene
  const [processed, setProcessed] = useState<ProcessedGLTF | null>(null)

  useEffect(() => {
    if (!gltfScene) return
    const result = processGLTF(gltfScene, name, texture)
    setProcessed(result)
  }, [gltfScene, name, texture])

  useEffect(() => {
    if (processed) {
      const { geometry, material } = extractMainGeometry(processed.scene, texture)
      const data: ModelData = {
        scene: processed.scene,
        geometry,
        material,
        name,
        isComplex: false,
      }
      onLoad(data)
    }
  }, [processed, name, texture, onLoad])

  return null
}

export function ObjectRegistry({ children }: ObjectRegistryProps): ReactNode {
  const [loadedModels, setLoadedModels] = useState<Record<string, ModelData>>({})
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: Object.keys(MODEL_PATHS).length })

  const graveyardTx = useTexture('/models/environment/Textures/colormap_graveyard.png')
  if (graveyardTx) {
    graveyardTx.colorSpace = THREE.SRGBColorSpace
    graveyardTx.flipY = false
  }

  const totalCount = Object.keys(MODEL_PATHS).length
  const isLoading = loadingProgress.loaded < totalCount

  const handleModelLoad = (data: ModelData) => {
    setLoadedModels((prev) => {
      if (prev[data.name]) return prev
      setLoadingProgress((prog) => ({ ...prog, loaded: prog.loaded + 1 }))
      return { ...prev, [data.name]: data }
    })
  }

  const contextValue: ObjectRegistryContextValue = useMemo(
    () => ({
      models: loadedModels,
      graveyardTexture: graveyardTx,
      isLoading,
      loadedCount: loadingProgress.loaded,
      totalCount,
      getModel: (name: string) => loadedModels[name],
    }),
    [loadedModels, graveyardTx, isLoading, loadingProgress.loaded, totalCount]
  )

  const modelEntries = Object.entries(MODEL_PATHS) as [ModelName, string][]

  return (
    <ObjectRegistryContext.Provider value={contextValue}>
      {modelEntries.map(([name, path]) => (
        <ModelLoader key={name} name={name} path={path} texture={graveyardTx} onLoad={handleModelLoad} />
      ))}
      {children}
    </ObjectRegistryContext.Provider>
  )
}

useGLTF.preload('/models/environment/iron-fence.glb')
useGLTF.preload('/models/environment/iron-fence-border-gate.glb')
useGLTF.preload('/models/environment/stone-wall.glb')
useGLTF.preload('/models/environment/pine-crooked.glb')
useGLTF.preload('/models/environment/pine.glb')
useGLTF.preload('/models/environment/gravestone-cross.glb')
useGLTF.preload('/models/environment/gravestone-round.glb')
useGLTF.preload('/models/environment/gravestone-broken.glb')
useGLTF.preload('/models/environment/crypt.glb')
useGLTF.preload('/models/environment/lantern-candle.glb')
useGLTF.preload('/models/environment/bench.glb')
useGLTF.preload('/models/environment/rocks.glb')

export type { ModelData, ObjectRegistryProps }
export { MODEL_PATHS, type ModelName }
