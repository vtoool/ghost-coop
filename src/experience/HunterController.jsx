import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const controlsRef = useRef(null)
  const { camera } = useThree()
  const [isLocked, setIsLocked] = useState(false)

  // Load Model
  const { scene } = useGLTF('/models/characters/character-male-a.glb')

  // Clean Textures & Apply Neon Skin
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = null
        child.material.color.set('#FF6B35')
        child.material.emissive.set('#FF6B35')
        child.material.emissiveIntensity = 0.5
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  const [, getKeyboardControls] = useKeyboardControls()
  const moveSpeed = 6

  useFrame(() => {
    if (!rigidBodyRef.current) return
    const player = myPlayer()
    if (!player) return

    // 1. Get Inputs
    const { forward, backward, left, right } = getKeyboardControls()
    let joystick = { x: 0, y: 0, isActive: false }
    
    try {
        if (player.getJoystick) {
            const j = player.getJoystick()
            if (j) joystick = j
        }
    } catch (e) { }

    // 2. Calculate Movement Vector
    const moveDirection = new THREE.Vector3(0, 0, 0)
    let hasInput = false

    if (joystick.isActive) {
      moveDirection.x += joystick.x
      moveDirection.z += joystick.y
      hasInput = true
    }

    if (forward || backward || left || right) {
      const camDir = new THREE.Vector3()
      camera.getWorldDirection(camDir)
      camDir.y = 0
      camDir.normalize()

      const camRight = new THREE.Vector3()
      camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0))

      if (forward) moveDirection.add(camDir)
      if (backward) moveDirection.sub(camDir)
      if (right) moveDirection.add(camRight)
      if (left) moveDirection.sub(camRight)
      hasInput = true
    }

    // 3. Apply Physics
    const currentVel = rigidBodyRef.current.linvel()
    if (hasInput && moveDirection.lengthSq() > 0.001) {
      moveDirection.normalize().multiplyScalar(moveSpeed)
      rigidBodyRef.current.setLinvel({ x: moveDirection.x, y: currentVel.y, z: moveDirection.z }, true)
      
      const angle = Math.atan2(moveDirection.x, moveDirection.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle/2), z: 0, w: Math.cos(angle/2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true)
    }

    // 4. Sync Network State
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
        colliders={false} 
        type="dynamic" 
        position={[0, 5, 0]}
        enabledRotations={[false, true, false]}
        lockRotations
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.9, 0]} />
        
        <primitive object={scene} scale={0.6} position={[0, -0.85, 0]} />
      </RigidBody>
    </>
  )
}
