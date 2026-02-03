import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

/**
 * HunterController - The Hunter Avatar with Universal Controls
 * 
 * Features:
 * - Loads GLB character model with neon pumpkin skin
 * - Dual-input: Keyboard (WASD) + Joystick for mobile
 * - PointerLockControls for mouse look on desktop
 * - Physics-based movement with Rapier
 * - Syncs position to Playroom for Operator view
 */
export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const characterRef = useRef(null)
  const controlsRef = useRef(null)
  const { camera } = useThree()
  
  // Load character model and clone it once
  const { scene } = useGLTF('/models/characters/character-male-a.glb')
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material.map = null
        child.material.needsUpdate = true
        child.material = new THREE.MeshStandardMaterial({
          color: '#FF6B35',
          emissive: '#FF6B35',
          emissiveIntensity: 0.5,
        })
      }
    })
    return clone
  }, [scene])
  
  // Keyboard controls state
  const [, getKeyboardControls] = useKeyboardControls()
  
  // Movement state
  const joystickState = useRef({ x: 0, y: 0, isActive: false })
  const moveSpeed = 8
  
  // Get joystick input from Playroom (updated every frame)
  useFrame(() => {
    const player = myPlayer()
    if (player && typeof player.getJoystick === 'function') {
      try {
        const joy = player.getJoystick()
        if (joy) {
          joystickState.current = {
            x: joy.x || 0,
            y: joy.y || 0,
            isActive: joy.isActive || false
          }
        }
      } catch (e) {
        joystickState.current = { x: 0, y: 0, isActive: false }
      }
    }
  })
  
  // Movement logic in useFrame
  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return
    
    const player = myPlayer()
    if (!player) return
    
    // Get keyboard input
    const { forward, backward, left, right } = getKeyboardControls()
    
    // Calculate movement vector
    const moveDirection = new THREE.Vector3(0, 0, 0)
    let hasInput = false
    const joyState = joystickState.current
    
    // Joystick input (mobile) - relative to screen/world
    if (joyState.isActive) {
      moveDirection.x += joyState.x
      moveDirection.z += joyState.y
      hasInput = true
    }
    
    // Keyboard input (desktop) - relative to camera facing
    if (forward || backward || left || right) {
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      cameraDirection.y = 0
      cameraDirection.normalize()
      
      const cameraRight = new THREE.Vector3()
      cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0))
      
      if (forward) moveDirection.add(cameraDirection)
      if (backward) moveDirection.sub(cameraDirection)
      if (right) moveDirection.add(cameraRight)
      if (left) moveDirection.sub(cameraRight)
      
      hasInput = true
    }
    
    // Normalize and apply speed
    if (hasInput && moveDirection.length() > 0) {
      moveDirection.normalize()
      
      // Set velocity directly for responsive control
      const targetVelocity = moveDirection.multiplyScalar(moveSpeed)
      rigidBodyRef.current.setLinvel({
        x: targetVelocity.x,
        y: rigidBodyRef.current.linvel().y,
        z: targetVelocity.z
      }, true)
      
      // Rotate character to face movement direction
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z)
      if (characterRef.current) {
        characterRef.current.rotation.y = targetRotation
      }
    } else {
      // Stop horizontal movement when no input
      rigidBodyRef.current.setLinvel({
        x: 0,
        y: rigidBodyRef.current.linvel().y,
        z: 0
      }, true)
    }
    
    // Sync position to Playroom for Operator (every frame)
    const pos = rigidBodyRef.current.translation()
    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })
  })
  
  return (
    <>
      {/* PointerLockControls for mouse look */}
      <PointerLockControls ref={controlsRef} />
      
      {/* Physics Body */}
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        position={[0, 2, 0]}
        lockRotations
        colliders={false}
        mass={70}
        linearDamping={5}
        angularDamping={1}
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.9, 0]} />
        <group ref={characterRef}>
          {/* Character Model */}
          <primitive 
            object={clonedScene} 
            scale={1.5}
            position={[0, -1, 0]}
          />
        </group>
      </RigidBody>
    </>
  )
}
