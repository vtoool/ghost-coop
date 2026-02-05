import { useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { level1, mapLegend } from './LevelMap'
import { Instancer } from './Instancer'

let glowTextureCache: THREE.CanvasTexture | null = null

function getGlowTexture(): THREE.CanvasTexture {
  if (!glowTextureCache) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255, 170, 68, 1)')
    gradient.addColorStop(0.3, 'rgba(255, 170, 68, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 170, 68, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    glowTextureCache = new THREE.CanvasTexture(canvas)
    glowTextureCache.colorSpace = THREE.SRGBColorSpace
  }
  return glowTextureCache
}

type Position3D = [number, number, number]

interface GlowSpriteProps {
  position: Position3D
}

function GlowSprite({ position }: GlowSpriteProps) {
  const texture = useMemo(() => getGlowTexture(), [])
  return (
    <sprite position={position} scale={[0.8, 0.8, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  )
}

const gridSize = 1
const width = level1[0].length
const height = level1.length
const mapWidth = width * gridSize
const mapHeight = height * gridSize
const offsetX = mapWidth / 2
const offsetZ = mapHeight / 2

function calculateGridPosition(x: number, z: number): [number, number, number] {
  const posX = (x * gridSize) - offsetX + (gridSize / 2)
  const posZ = (z * gridSize) - offsetZ + (gridSize / 2)
  return [posX, 0, posZ]
}

interface ModelPositions {
  iron_fence_straight_h: Position3D[]
  iron_fence_straight_v: Position3D[]
  iron_fence_corner_tl: Position3D[]
  iron_fence_corner_tr: Position3D[]
  iron_fence_corner_br: Position3D[]
  iron_fence_corner_bl: Position3D[]
  stone_wall_straight_h: Position3D[]
  stone_wall_straight_v: Position3D[]
  stone_wall_corner_tl: Position3D[]
  stone_wall_corner_tr: Position3D[]
  stone_wall_corner_br: Position3D[]
  stone_wall_corner_bl: Position3D[]
  pine_crooked: Position3D[]
  pine: Position3D[]
  oak: Position3D[]
  gravestone_cross: Position3D[]
  gravestone_round: Position3D[]
  gravestone_broken: Position3D[]
  crypt: Position3D[]
  lantern_candle: Position3D[]
  bench: Position3D[]
  rocks: Position3D[]
  road: Position3D[]
}

function useMapParser() {
  return useMemo(() => {
    const positions: ModelPositions = {
      iron_fence_straight_h: [],
      iron_fence_straight_v: [],
      iron_fence_corner_tl: [],
      iron_fence_corner_tr: [],
      iron_fence_corner_br: [],
      iron_fence_corner_bl: [],
      stone_wall_straight_h: [],
      stone_wall_straight_v: [],
      stone_wall_corner_tl: [],
      stone_wall_corner_tr: [],
      stone_wall_corner_br: [],
      stone_wall_corner_bl: [],
      pine_crooked: [],
      pine: [],
      oak: [],
      gravestone_cross: [],
      gravestone_round: [],
      gravestone_broken: [],
      crypt: [],
      lantern_candle: [],
      bench: [],
      rocks: [],
      road: [],
    }

    const lanternPositions: Position3D[] = []

    level1.forEach((row, z) => {
      row.split('').forEach((char, x) => {
        const modelName = mapLegend[char]
        if (!modelName) return

        const pos = calculateGridPosition(x, z)

        switch (char) {
          case '┌':
            positions.stone_wall_corner_tl.push(pos)
            break
          case '┐':
            positions.stone_wall_corner_tr.push(pos)
            break
          case '┘':
            positions.stone_wall_corner_br.push(pos)
            break
          case '└':
            positions.stone_wall_corner_bl.push(pos)
            break
          case '|':
            positions.stone_wall_straight_v.push(pos)
            break
          case '-':
            positions.stone_wall_straight_h.push(pos)
            break
          case '1':
            positions.iron_fence_corner_tl.push(pos)
            break
          case '2':
            positions.iron_fence_corner_tr.push(pos)
            break
          case '3':
            positions.iron_fence_corner_br.push(pos)
            break
          case '4':
            positions.iron_fence_corner_bl.push(pos)
            break
          case 'v':
            positions.iron_fence_straight_v.push(pos)
            break
          case 'h':
            positions.iron_fence_straight_h.push(pos)
            break
          case 'L':
            {
              const glowPos: Position3D = [pos[0], pos[1] + 0.15, pos[2]]
              lanternPositions.push(glowPos)
              positions.lantern_candle.push(pos)
            }
            break
          case '=':
            positions.road.push([pos[0], 0.02, pos[2]])
            break
          case 'G':
            positions.gravestone_broken.push(pos)
            break
          default:
            if (positions[modelName as keyof ModelPositions]) {
              positions[modelName as keyof ModelPositions].push(pos)
            }
            break
        }
      })
    })

    return { positions, lanternPositions }
  }, [])
}

export function MapRenderer() {
  const { positions, lanternPositions } = useMapParser()

  return (
    <group>
      <mesh name="ground" position={[0, -0.5, 0]}>
        <boxGeometry args={[mapWidth, 1, mapHeight]} />
        <meshStandardMaterial color="#2d4a2d" roughness={0.8} metalness={0} />
      </mesh>

      <RigidBody type="fixed" position={[0, -0.5, 0]} colliders={false}>
        <CuboidCollider args={[mapWidth / 2, 0.5, mapHeight / 2]} />
      </RigidBody>

      {/* Iron Fences */}
      <Instancer model="iron_fence" positions={positions.iron_fence_straight_h} collider="cuboid" />
      <Instancer model="iron_fence" positions={positions.iron_fence_straight_v} rotation={Math.PI / 2} collider="cuboid" />
      <Instancer model="iron_fence_curve" positions={positions.iron_fence_corner_tl} rotation={[0, -Math.PI / 2, 0]} collider="cuboid" />
      <Instancer model="iron_fence_curve" positions={positions.iron_fence_corner_tr} rotation={[0, 0, 0]} collider="cuboid" />
      <Instancer model="iron_fence_curve" positions={positions.iron_fence_corner_br} rotation={[0, Math.PI / 2, 0]} collider="cuboid" />
      <Instancer model="iron_fence_curve" positions={positions.iron_fence_corner_bl} rotation={[0, Math.PI, 0]} collider="cuboid" />

      {/* Stone Walls */}
      <Instancer model="stone_wall" positions={positions.stone_wall_straight_h} collider="cuboid" />
      <Instancer model="stone_wall" positions={positions.stone_wall_straight_v} rotation={Math.PI / 2} collider="cuboid" />
      <Instancer model="stone_wall_curve" positions={positions.stone_wall_corner_tl} rotation={[0, -Math.PI / 2, 0]} collider="cuboid" />
      <Instancer model="stone_wall_curve" positions={positions.stone_wall_corner_tr} rotation={[0, 0, 0]} collider="cuboid" />
      <Instancer model="stone_wall_curve" positions={positions.stone_wall_corner_br} rotation={[0, Math.PI / 2, 0]} collider="cuboid" />
      <Instancer model="stone_wall_curve" positions={positions.stone_wall_corner_bl} rotation={[0, Math.PI, 0]} collider="cuboid" />

      <Instancer model="pine_crooked" positions={positions.pine_crooked} collider="hull" scale={1.1} randomRotation />
      <Instancer model="pine" positions={positions.pine} collider="hull" scale={1.2} randomRotation />
      <Instancer model="oak" positions={positions.oak} collider="hull" scale={1.5} randomRotation />
      <Instancer model="gravestone_cross" positions={positions.gravestone_cross} collider="cuboid" />
      <Instancer model="gravestone_round" positions={positions.gravestone_round} collider="cuboid" />
      <Instancer model="gravestone_broken" positions={positions.gravestone_broken} collider="cuboid" />
      <Instancer model="crypt" positions={positions.crypt} collider="hull" />
      <Instancer model="bench" positions={positions.bench} collider="hull" />
      <Instancer model="rocks" positions={positions.rocks} collider="hull" />
      <Instancer model="lantern_candle" positions={positions.lantern_candle} collider="cuboid" />
      <Instancer model="road" positions={positions.road} scale={20} randomRotation={false} collider={undefined} />

      {lanternPositions.map((pos, i) => (
        <GlowSprite key={`glow-${i}`} position={pos} />
      ))}
    </group>
  )
}
