import { useRef, useEffect, useState, useMemo } from 'react'
import type { ReactElement } from 'react'
import { useFrame, useThree, useGraph } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera, useAnimations } from '@react-three/drei'
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import { myPlayer, type Player } from 'playroomkit'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { useShadowTexture } from '../hooks/useShadowTexture'
import {
  MOVE_SPEED,
  JUMP_VELOCITY,
  GROUND_LEVEL,
  GROUND_THRESHOLD_UPPER,
  GROUND_THRESHOLD_LOWER,
  CAMERA_DISTANCE,
  HERO_LIGHT_COLOR,
  HERO_LIGHT_INTENSITY,
  HERO_LIGHT_DISTANCE
} from '../constants/GameBalance'

const ANIMATION_ACTIONS = ['idle', 'sprint', 'jump', 'fall'] as const
type AnimationAction = typeof ANIMATION_ACTIONS[number]

interface JoystickData {
  x: number
  y: number
  isActive: boolean
}

function useSkinnedMeshClone(path: string) {
  const { scene, animations } = useGLTF(path)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  useGraph(clonedScene)
  return { scene: clonedScene, animations }
}

export default function HunterController(): ReactElement {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const [pivot, setPivot] = useState<THREE.Group | null>(null)
  const [currentAction, setCurrentAction] = useState<AnimationAction>('idle')
  const { scene, camera } = useThree()
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const downVector = useRef<THREE.Vector3>(new THREE.Vector3(0, -1, 0))
  const groundDistance = useRef<number>(Infinity)
  const wasGrounded = useRef<boolean>(false)
  const canJump = useRef<boolean>(true)

  const moveDir = useRef<THREE.Vector3>(new THREE.Vector3())
  const viewDir = useRef<THREE.Vector3>(new THREE.Vector3())
  const viewRight = useRef<THREE.Vector3>(new THREE.Vector3())
  const upVector = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0))
  const joyForward = useRef<THREE.Vector3>(new THREE.Vector3())
  const joyRight = useRef<THREE.Vector3>(new THREE.Vector3())
  const rayOrigin = useRef<THREE.Vector3>(new THREE.Vector3())

  const { scene: characterScene, animations } = useSkinnedMeshClone('/models/characters/character-male-a.glb')
  const { actions } = useAnimations(animations, characterScene)

  useEffect(() => {
    characterScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial
          material.color = new THREE.Color(0xffffff)
          material.emissive = new THREE.Color(0x000000)
          material.emissiveIntensity = 0
        }
      }
    })
  }, [characterScene])

  useEffect(() => {
    const action = actions[currentAction] || actions['idle']
    if (action) {
      action.reset().fadeIn(0.2).play()
      return () => {
        action.fadeOut(0.2)
      }
    }
  }, [currentAction, actions])

  const [, getKeyboardControls] = useKeyboardControls()
  const shadowTexture = useShadowTexture()

  useFrame(() => {
    if (!rigidBodyRef.current || !pivot) return

    const player: Player | null = myPlayer()
    if (!player) return

    const pos = rigidBodyRef.current.translation()
    pivot.position.set(pos.x, pos.y, pos.z)

    const { forward, backward, left, right, jump } = getKeyboardControls()

    let joystick: JoystickData = { x: 0, y: 0, isActive: false }
    if (player.getJoystick) {
      const j = player.getJoystick()
      if (j) joystick = j as JoystickData
    }

    moveDir.current.set(0, 0, 0)

    pivot.getWorldDirection(viewDir.current)
    viewDir.current.y = 0
    viewDir.current.normalize()
    viewDir.current.negate()

    viewRight.current.crossVectors(viewDir.current, upVector.current)

    if (forward) moveDir.current.add(viewDir.current)
    if (backward) moveDir.current.sub(viewDir.current)
    if (right) moveDir.current.add(viewRight.current)
    if (left) moveDir.current.sub(viewRight.current)

    if (joystick.isActive) {
      joyForward.current.copy(viewDir.current).multiplyScalar(joystick.y)
      joyRight.current.copy(viewRight.current).multiplyScalar(joystick.x)
      moveDir.current.add(joyForward.current).add(joyRight.current)
    }

    const vel = rigidBodyRef.current.linvel()
    const playerFeet = pos.y - 0.8
    const isGrounded = playerFeet <= (GROUND_LEVEL + GROUND_THRESHOLD_UPPER) &&
                       playerFeet >= (GROUND_LEVEL - GROUND_THRESHOLD_LOWER)

    let targetY = vel.y

    if (jump && isGrounded && canJump.current) {
      targetY = JUMP_VELOCITY
      canJump.current = false
    }

    if (isGrounded && !canJump.current) {
      canJump.current = true
    }

    wasGrounded.current = isGrounded

    const isMoving = moveDir.current.lengthSq() > 0.001
    if (isMoving) {
      moveDir.current.normalize().multiplyScalar(MOVE_SPEED)
      rigidBodyRef.current.setLinvel({ x: moveDir.current.x, y: targetY, z: moveDir.current.z }, true)

      const angle = Math.atan2(moveDir.current.x, moveDir.current.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: targetY, z: 0 }, true)
    }

    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })

    let targetAnim: AnimationAction = 'idle'
    if (isGrounded) {
      targetAnim = moveDir.current.lengthSq() > 0.001 ? 'sprint' : 'idle'
    } else {
      targetAnim = vel.y > 0 ? 'jump' : 'fall'
    }

    if (currentAction !== targetAnim) {
      setCurrentAction(targetAnim)
      player.setState('anim', targetAnim)
    }

    if (shadowRef.current) {
      rayOrigin.current.set(pos.x, pos.y - 0.5, pos.z)
      raycaster.current.set(rayOrigin.current, downVector.current)
      raycaster.current.camera = camera
      raycaster.current.near = 0.1

      const intersects = raycaster.current.intersectObjects(scene.children, true)

      let closestGroundHit: THREE.Intersection | null = null
      let closestGroundDist = Infinity

      for (const hit of intersects) {
        const obj = hit.object

        if (obj.type === 'Sprite') continue

        if (obj.name !== 'ground') continue

        if (hit.distance < closestGroundDist) {
          closestGroundDist = hit.distance
          closestGroundHit = hit
        }
      }

      if (closestGroundHit) {
        groundDistance.current = closestGroundHit.distance
        shadowRef.current.position.set(
          closestGroundHit.point.x,
          closestGroundHit.point.y + 0.02,
          closestGroundHit.point.z
        )
        shadowRef.current.visible = true

        const dist = closestGroundHit.distance
        const scale = Math.max(0.3, 1 - (dist * 0.1))
        shadowRef.current.scale.setScalar(scale)

        const opacity = Math.max(0.2, 0.8 - (dist * 0.1))
        const material = shadowRef.current.material as THREE.MeshBasicMaterial
        if (material) {
          material.opacity = opacity
        }
      } else {
        groundDistance.current = Infinity
        shadowRef.current.visible = false
      }
    }
  })

  return (
    <>
      <group ref={setPivot}>
        <PerspectiveCamera makeDefault position={[0, 0, CAMERA_DISTANCE]} />
      </group>

      {pivot && <PointerLockControls camera={pivot as unknown as THREE.Camera} selector="#root" />}

      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        type="dynamic"
        position={[0, 5, 0]}
        enabledRotations={[false, true, false]}
        lockRotations
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0, 0]} />
        <pointLight
          color={HERO_LIGHT_COLOR}
          intensity={HERO_LIGHT_INTENSITY}
          distance={HERO_LIGHT_DISTANCE}
          decay={2}
          castShadow={false}
          position={[0, 1.5, 0.5]}
        />
        <primitive object={characterScene} scale={0.6} position={[0, -0.8, 0]} />
      </RigidBody>

      <mesh
        ref={shadowRef}
        rotation-x={-Math.PI / 2}
        position-y={0}
        visible={false}
      >
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </>
  )
}
