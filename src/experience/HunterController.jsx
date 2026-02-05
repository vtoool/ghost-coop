import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera, useAnimations } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
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

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const shadowRef = useRef(null)
  const [pivot, setPivot] = useState(null)
  const [currentAction, setCurrentAction] = useState("idle")
  const { scene, camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const downVector = useRef(new THREE.Vector3(0, -1, 0))
  const groundDistance = useRef(Infinity)
  const wasGrounded = useRef(false)
  const canJump = useRef(true)

  // Pre-allocated vectors to avoid GC pressure
  const moveDir = useRef(new THREE.Vector3())
  const viewDir = useRef(new THREE.Vector3())
  const viewRight = useRef(new THREE.Vector3())
  const upVector = useRef(new THREE.Vector3(0, 1, 0))
  const joyForward = useRef(new THREE.Vector3())
  const joyRight = useRef(new THREE.Vector3())
  const rayOrigin = useRef(new THREE.Vector3())

  const { scene: characterScene, animations } = useGLTF('/models/characters/character-male-a.glb')
  const { actions } = useAnimations(animations, characterScene)

  useEffect(() => {
    characterScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = false
        if (child.material) {
          child.material.emissive = new THREE.Color(0x000000)
          child.material.emissiveIntensity = 0
        }
      }
    })
  }, [characterScene])
  
  useEffect(() => {
    const action = actions[currentAction] || actions["idle"]
    if (action) {
      action.reset().fadeIn(0.2).play()
      return () => action.fadeOut(0.2)
    }
  }, [currentAction, actions])

  const [, getKeyboardControls] = useKeyboardControls()

  useFrame(() => {
    if (!rigidBodyRef.current || !pivot) return
    const player = myPlayer()
    if (!player) return

    const pos = rigidBodyRef.current.translation()
    pivot.position.set(pos.x, pos.y, pos.z)

    const { forward, backward, left, right, jump } = getKeyboardControls()
    
    let joystick = { x: 0, y: 0, isActive: false }
    if (player.getJoystick) {
      const j = player.getJoystick()
      if (j) joystick = j
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

    // Ground detection - tighten threshold to prevent flying
    const playerFeet = pos.y
    const isGrounded = playerFeet <= (GROUND_LEVEL + GROUND_THRESHOLD_UPPER) && playerFeet >= (GROUND_LEVEL - GROUND_THRESHOLD_LOWER)

    let targetY = vel.y

    if (jump && isGrounded && canJump.current) {
      targetY = JUMP_VELOCITY
      canJump.current = false
    }

    // Reset jump when grounded (simpler logic, no velocity check)
    if (isGrounded && !canJump.current) {
      canJump.current = true
    }

    wasGrounded.current = isGrounded

    const isMoving = moveDir.current.lengthSq() > 0.001
    if (isMoving) {
      moveDir.current.normalize().multiplyScalar(MOVE_SPEED)
      rigidBodyRef.current.setLinvel({ x: moveDir.current.x, y: targetY, z: moveDir.current.z }, true)
      const angle = Math.atan2(moveDir.current.x, moveDir.current.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle/2), z: 0, w: Math.cos(angle/2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: targetY, z: 0 }, true)
    }

    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })

    let targetAnim = "idle"
    if (isGrounded) {
      targetAnim = moveDir.current.lengthSq() > 0.001 ? "sprint" : "idle"
    } else {
      targetAnim = vel.y > 0 ? "jump" : "fall"
    }
    if (currentAction !== targetAnim) {
      setCurrentAction(targetAnim)
    }

    if (shadowRef.current) {
      rayOrigin.current.set(pos.x, pos.y - 0.5, pos.z)
      raycaster.current.set(rayOrigin.current, downVector.current)
      raycaster.current.camera = camera
      raycaster.current.near = 0.1
      
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      let closestGroundHit = null
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
        if (shadowRef.current.material) {
          shadowRef.current.material.opacity = opacity
        }
      } else {
        groundDistance.current = Infinity
        shadowRef.current.visible = false
      }
    }
  })

  const shadowTexture = useShadowTexture()

  return (
    <>
      <group ref={setPivot}>
        <PerspectiveCamera makeDefault position={[0, 0, CAMERA_DISTANCE]} />
      </group>

      {pivot && <PointerLockControls camera={pivot} selector="#root" />}

      <RigidBody 
        ref={rigidBodyRef} 
        colliders={false} 
        type="dynamic" 
        position={[0, 5, 0]} 
        enabledRotations={[false, true, false]} 
        lockRotations
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0, 0]} />
        <pointLight color={HERO_LIGHT_COLOR} intensity={HERO_LIGHT_INTENSITY} distance={HERO_LIGHT_DISTANCE} decay={2} castShadow={false} position={[0, 1.5, 0.5]} />
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
