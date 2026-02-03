import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const pivotRef = useRef(null)
  const [pivotObj, setPivotObj] = useState(null)
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
    if (!rigidBodyRef.current || !pivotRef.current) return
    const player = myPlayer()
    if (!player) return

    // 1. TELEPORT PIVOT TO PLAYER (The "Selfie Stick" Attachment)
    const pos = rigidBodyRef.current.translation()
    pivotRef.current.position.set(pos.x, pos.y + 0.5, pos.z)

    // 2. INPUTS (Relative to Camera View)
    const { forward, backward, left, right } = getKeyboardControls()
    
    let joystick = { x: 0, y: 0, isActive: false }
    try {
      if (player.getJoystick) {
        const j = player.getJoystick()
        if (j) joystick = j
      }
    } catch (e) {}

    const moveDir = new THREE.Vector3()

    // Get Camera Facing Direction (from the Pivot)
    const camDir = new THREE.Vector3()
    pivotRef.current.getWorldDirection(camDir)
    camDir.y = 0
    camDir.normalize()

    const camRight = new THREE.Vector3()
    camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0))

    if (forward) moveDir.add(camDir)
    if (backward) moveDir.sub(camDir)
    if (right) moveDir.add(camRight)
    if (left) moveDir.sub(camRight)
    
    if (joystick.isActive) {
      moveDir.x += joystick.x
      moveDir.z += joystick.y
    }

    // 3. APPLY PHYSICS
    const currentVel = rigidBodyRef.current.linvel()
    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize().multiplyScalar(moveSpeed)
      rigidBodyRef.current.setLinvel({ x: moveDir.x, y: currentVel.y, z: moveDir.z }, true)
      
      // Rotate Character to face movement
      const angle = Math.atan2(moveDir.x, moveDir.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle/2), z: 0, w: Math.cos(angle/2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true)
    }

    // 4. SYNC
    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })
  })

  return (
    <>
      {/* THE BOOM ARM (Pivot) */}
      <group ref={(ref) => { pivotRef.current = ref; setPivotObj(ref) }}>
        {/* THE CAMERA (Attached to arm, 4m behind) */}
        <PerspectiveCamera makeDefault position={[0, 1, 4]} />
      </group>

      {/* CONTROLS (Rotate the Boom Arm) */}
      {pivotObj && <PointerLockControls camera={pivotObj} />}

      {/* THE PLAYER (Physical Body) */}
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
