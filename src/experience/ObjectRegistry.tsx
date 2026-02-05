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

const MODEL_CONFIG: Record<ModelName, { useTexture: boolean; color?: string }> = {
  iron_fence: { useTexture: true },
  iron_fence_border_gate: { useTexture: true },
  stone_wall: { useTexture: true },
  pine_crooked: { useTexture: false, color: '#2d5a2d' },
  pine: { useTexture: false, color: '#1a4a1a' },
  gravestone_cross: { useTexture: true },
  gravestone_round: { useTexture: true },
  gravestone_broken: { useTexture: true },
  crypt: { useTexture: true },
  lantern_candle: { useTexture: true },
  bench: { useTexture: false, color: '#5c4033' },
  rocks: { useTexture: false, color: '#4a4a4a' },
}

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
  texture: THREE.Texture | null,
  config: { useTexture: boolean; color?: string }
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

        mat.emissive = new THREE.Color(0x000000)
        mat.emissiveIntensity = 0

        if (config.useTexture && texture && !mat.map) {
          mat.map = texture
        } else if (config.color) {
          mat.map = null
          mat.color = new THREE.Color(config.color)
        }
      }
    }
  })

  return { scene: processed, lightsRemoved: lightsRemoved.current }
}

function extractMainGeometry(
  gltf: THREE.Group,
  texture: THREE.Texture | null,
  config: { useTexture: boolean; color?: string }
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
      mat.emissive = new THREE.Color(0x000000)
      mat.emissiveIntensity = 0

      if (config.useTexture && texture && !mat.map) {
        mat.map = texture
        mat.needsUpdate = true
      } else if (config.color) {
        mat.map = null
        mat.color = new THREE.Color(config.color)
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
  config,
  onLoad,
}: {
  name: ModelName
  path: string
  texture: THREE.Texture | null
  config: { useTexture: boolean; color?: string }
  onLoad: (data: ModelData) => void
}) {
  const gltf = useGLTF(path)
  const gltfScene = gltf.scene
  const [processed, setProcessed] = useState<ProcessedGLTF | null>(null)

  useEffect(() => {
    if (!gltfScene) return
    const result = processGLTF(gltfScene, name, texture, config)
    setProcessed(result)
  }, [gltfScene, name, texture, config])

  useEffect(() => {
    if (processed) {
      const { geometry, material } = extractMainGeometry(processed.scene, texture, config)
      const data: ModelData = {
        scene: processed.scene,
        geometry,
        material,
        name,
        isComplex: false,
      }
      onLoad(data)
    }
  }, [processed, name, texture, config, onLoad])

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
        <ModelLoader
          key={name}
          name={name}
          path={path}
          texture={graveyardTx}
          config={MODEL_CONFIG[name]}
          onLoad={handleModelLoad}
        />
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
export { MODEL_PATHS, MODEL_CONFIG, type ModelName }
