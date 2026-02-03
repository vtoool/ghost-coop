import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const characterRef = useRef(null)
  const controlsRef = useRef(null)
  const { camera } = useThree()
  const [isLocked, setIsLocked] = useState(false)
  
  const keyboardMap = useMemo(() => [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] }
  ], [])
  
  // Load character model
  const { scene } = useGLTF('/models/characters/character-male-a.glb')
  
  // Strip textures to prevent 404 errors and black meshes
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = null
        child.material.needsUpdate = true
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])
  
  // Create cloned scene with neon material
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#FF6B35',
          emissive: '#FF6B35',
          emissiveIntensity: 0.5,
        })
      }
    })
    return clone
  }, [scene])
  
  // Keyboard controls
  const [, getKeyboardControls] = useKeyboardControls()
  
  // Joystick state
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
  
  // Movement logic
  useFrame(() => {
    if (!rigidBodyRef.current) return
    
    const player = myPlayer()
    if (!player) return
    
    const { forward, backward, left, right } = getKeyboardControls()
    const moveDirection = new THREE.Vector3(0, 0, 0)
    let hasInput = false
    const joyState = joystickState.current
    
    // Joystick input (screen-relative)
    if (joyState.isActive) {
      moveDirection.x += joyState.x
      moveDirection.z += joyState.y
      hasInput = true
    }
    
    // Keyboard input (camera-relative)
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
    
    if (hasInput && moveDirection.length() > 0) {
      moveDirection.normalize()
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
      rigidBodyRef.current.setLinvel({
        x: 0,
        y: rigidBodyRef.current.linvel().y,
        z: 0
      }, true)
    }
    
    // Sync position to Playroom
    const pos = rigidBodyRef.current.translation()
    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })
  })
  
  return (
    <>
      <PointerLockControls 
        ref={controlsRef} 
        onLock={() => setIsLocked(true)}
        onUnlock={() => setIsLocked(false)}
      />
      
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        position={[0, 2, 0]}
        lockRotations
        enabledRotations={[false, true, false]}
        colliders={false}
        mass={70}
        linearDamping={5}
        angularDamping={1}
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.9, 0]} />
        
        <group ref={characterRef} position={[0, -0.1, 0]}>
          <primitive object={clonedScene} scale={0.6} />
        </group>
      </RigidBody>
    </>
  )
}
