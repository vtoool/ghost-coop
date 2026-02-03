import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const [pivot, setPivot] = useState(null)
  const { scene } = useGLTF('/models/characters/character-male-a.glb')

  // Texture cleanup
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
    if (!rigidBodyRef.current || !pivot) return
    const player = myPlayer()
    if (!player) return

    // 1. CHASE: Sync Pivot position to Player (Head height)
    const pos = rigidBodyRef.current.translation()
    pivot.position.set(pos.x, pos.y + 0.5, pos.z)

    // 2. INPUT: Calculate movement relative to Camera/Pivot
    const { forward, backward, left, right } = getKeyboardControls()
    
    // Joystick support
    let joystick = { x: 0, y: 0, isActive: false }
    try {
      if (player.getJoystick) {
        const j = player.getJoystick()
        if (j) joystick = j
      }
    } catch (e) {}

    const moveDir = new THREE.Vector3()
    
    // Get Pivot's facing direction (Where the camera is looking)
    const viewDir = new THREE.Vector3()
    pivot.getWorldDirection(viewDir)
    viewDir.y = 0 // Flatten
    viewDir.normalize()

    const viewRight = new THREE.Vector3()
    viewRight.crossVectors(viewDir, new THREE.Vector3(0, 1, 0))

    if (forward) moveDir.add(viewDir)
    if (backward) moveDir.sub(viewDir)
    if (right) moveDir.add(viewRight)
    if (left) moveDir.sub(viewRight)
    
    if (joystick.isActive) {
      moveDir.x += joystick.x
      moveDir.z += joystick.y
    }

    // 3. PHYSICS: Apply velocity
    const currentVel = rigidBodyRef.current.linvel()
    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize().multiplyScalar(moveSpeed)
      rigidBodyRef.current.setLinvel({ x: moveDir.x, y: currentVel.y, z: moveDir.z }, true)
      
      // Face character towards movement
      const angle = Math.atan2(moveDir.x, moveDir.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle/2), z: 0, w: Math.cos(angle/2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true)
    }

    // 4. NETWORK: Sync
    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })
  })

  return (
    <>
      {/* BOOM ARM - Controls rotate THIS, not the camera directly */}
      <group ref={setPivot}>
        <PerspectiveCamera makeDefault position={[0, 1, 4]} />
      </group>

      {/* MOUSE LOCK - Attaches to pivot */}
      {pivot && <PointerLockControls camera={pivot} selector="#root" />}

      {/* PLAYER BODY */}
      <RigidBody 
        ref={rigidBodyRef} 
        colliders={false} 
        type="dynamic" 
        position={[0, 5, 0]} 
        enabledRotations={[false, true, false]} 
        lockRotations
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0, 0]} />
        <primitive object={scene} scale={0.6} position={[0, -0.25, 0]} />
      </RigidBody>
    </>
  )
}
