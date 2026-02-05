import { useRef, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera, useAnimations } from '@react-three/drei'
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import { myPlayer, type Player } from 'playroomkit'
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

// Animation action names from the character GLB
const ANIMATION_ACTIONS = ['idle', 'sprint', 'jump', 'fall'] as const
type AnimationAction = typeof ANIMATION_ACTIONS[number]

// Type for joystick data from PlayroomKit
interface JoystickData {
  x: number
  y: number
  isActive: boolean
}

export default function HunterController(): ReactElement {
  // Physics body ref - using RapierRigidBody type from @react-three/rapier
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  
  // Shadow mesh ref
  const shadowRef = useRef<THREE.Mesh>(null)
  
  // Camera pivot group
  const [pivot, setPivot] = useState<THREE.Group | null>(null)
  
  // Current animation state
  const [currentAction, setCurrentAction] = useState<AnimationAction>('idle')
  
  // Three.js scene and camera from R3F
  const { scene, camera } = useThree()
  
  // Raycaster for ground detection
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster())
  
  // Downward vector for raycasting
  const downVector = useRef<THREE.Vector3>(new THREE.Vector3(0, -1, 0))
  
  // Ground distance tracking
  const groundDistance = useRef<number>(Infinity)
  
  // Grounded state tracking
  const wasGrounded = useRef<boolean>(false)
  
  // Jump cooldown
  const canJump = useRef<boolean>(true)

  // Pre-allocated vectors to avoid GC pressure
  const moveDir = useRef<THREE.Vector3>(new THREE.Vector3())
  const viewDir = useRef<THREE.Vector3>(new THREE.Vector3())
  const viewRight = useRef<THREE.Vector3>(new THREE.Vector3())
  const upVector = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0))
  const joyForward = useRef<THREE.Vector3>(new THREE.Vector3())
  const joyRight = useRef<THREE.Vector3>(new THREE.Vector3())
  const rayOrigin = useRef<THREE.Vector3>(new THREE.Vector3())

  // Load character GLB
  const { scene: characterScene, animations } = useGLTF('/models/characters/character-male-a.glb')
  
  // Setup animations - actions will be AnimationAction type
  const { actions } = useAnimations(animations, characterScene)

  // Configure character mesh materials
  useEffect(() => {
    characterScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial
          material.emissive = new THREE.Color(0x000000)
          material.emissiveIntensity = 0
        }
      }
    })
  }, [characterScene])
  
  // Handle animation state changes
  useEffect(() => {
    const action = actions[currentAction] || actions['idle']
    if (action) {
      action.reset().fadeIn(0.2).play()
      return () => {
        action.fadeOut(0.2)
      }
    }
  }, [currentAction, actions])

  // Get keyboard controls
  const [, getKeyboardControls] = useKeyboardControls()

  // Main game loop
  useFrame(() => {
    // Early exit if physics or pivot not ready
    if (!rigidBodyRef.current || !pivot) return
    
    const player: Player | null = myPlayer()
    if (!player) return

    // Get current position from physics body
    const pos = rigidBodyRef.current.translation()
    pivot.position.set(pos.x, pos.y, pos.z)

    // Get keyboard input
    const { forward, backward, left, right, jump } = getKeyboardControls()
    
    // Get joystick input with proper typing
    let joystick: JoystickData = { x: 0, y: 0, isActive: false }
    if (player.getJoystick) {
      const j = player.getJoystick()
      if (j) joystick = j as JoystickData
    }

    // Reset movement direction
    moveDir.current.set(0, 0, 0)
    
    // Calculate view direction from camera pivot
    pivot.getWorldDirection(viewDir.current)
    viewDir.current.y = 0
    viewDir.current.normalize()
    viewDir.current.negate()

    // Calculate right vector from view direction
    viewRight.current.crossVectors(viewDir.current, upVector.current)

    // Apply keyboard movement
    if (forward) moveDir.current.add(viewDir.current)
    if (backward) moveDir.current.sub(viewDir.current)
    if (right) moveDir.current.add(viewRight.current)
    if (left) moveDir.current.sub(viewRight.current)

    // Apply joystick movement
    if (joystick.isActive) {
      joyForward.current.copy(viewDir.current).multiplyScalar(joystick.y)
      joyRight.current.copy(viewRight.current).multiplyScalar(joystick.x)
      moveDir.current.add(joyForward.current).add(joyRight.current)
    }

    // Get current velocity
    const vel = rigidBodyRef.current.linvel()

    // Ground detection - tighten threshold to prevent flying
    const playerFeet = pos.y
    const isGrounded = playerFeet <= (GROUND_LEVEL + GROUND_THRESHOLD_UPPER) && 
                       playerFeet >= (GROUND_LEVEL - GROUND_THRESHOLD_LOWER)

    let targetY = vel.y

    // Handle jump
    if (jump && isGrounded && canJump.current) {
      targetY = JUMP_VELOCITY
      canJump.current = false
    }

    // Reset jump when grounded
    if (isGrounded && !canJump.current) {
      canJump.current = true
    }

    wasGrounded.current = isGrounded

    // Apply movement velocity
    const isMoving = moveDir.current.lengthSq() > 0.001
    if (isMoving) {
      moveDir.current.normalize().multiplyScalar(MOVE_SPEED)
      rigidBodyRef.current.setLinvel({ x: moveDir.current.x, y: targetY, z: moveDir.current.z }, true)
      
      // Calculate rotation from movement direction
      const angle = Math.atan2(moveDir.current.x, moveDir.current.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: targetY, z: 0 }, true)
    }

    // Sync position to Playroom
    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })

    // Update animation state
    let targetAnim: AnimationAction = 'idle'
    if (isGrounded) {
      targetAnim = moveDir.current.lengthSq() > 0.001 ? 'sprint' : 'idle'
    } else {
      targetAnim = vel.y > 0 ? 'jump' : 'fall'
    }
    if (currentAction !== targetAnim) {
      setCurrentAction(targetAnim)
    }

    // Update blob shadow
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
        
        // Scale shadow based on distance
        const dist = closestGroundHit.distance
        const scale = Math.max(0.3, 1 - (dist * 0.1))
        shadowRef.current.scale.setScalar(scale)
        
        // Adjust opacity based on distance
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

  // Get shadow texture
  const shadowTexture = useShadowTexture()

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
