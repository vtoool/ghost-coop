import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera, useAnimations } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const [pivot, setPivot] = useState(null)
  const [currentAction, setCurrentAction] = useState("idle")

  const { scene, animations } = useGLTF('/models/characters/character-male-a.glb')
  const { actions } = useAnimations(animations, scene)

  // Texture Cleanup: Only enable shadows. Keep natural materials.
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  // Animation Switching Logic
  useEffect(() => {
    console.log("Available animations:", Object.keys(actions))
    console.log("Switching to:", currentAction)
    
     const action = actions[currentAction] || actions["idle"]
    if (action) {
      action.reset().fadeIn(0.2).play()
      return () => action.fadeOut(0.2)
    }
  }, [currentAction, actions])

  const [, getKeyboardControls] = useKeyboardControls()
  const moveSpeed = 6

  useFrame(() => {
    if (!rigidBodyRef.current || !pivot) return
    const player = myPlayer()
    if (!player) return

    // 1. SYNC PIVOT (Shoulder Height)
    const pos = rigidBodyRef.current.translation()
    pivot.position.set(pos.x, pos.y + 0.5, pos.z)

    // 2. INPUTS (Corrected Direction)
    const { forward, backward, left, right } = getKeyboardControls()
    
    let joystick = { x: 0, y: 0, isActive: false }
    try {
      if (player.getJoystick) {
        const j = player.getJoystick()
        if (j) joystick = j
      }
    } catch (e) {}

    const moveDir = new THREE.Vector3()
    
    // Get Camera Facing Direction
    const viewDir = new THREE.Vector3()
    pivot.getWorldDirection(viewDir)
    viewDir.y = 0 
    viewDir.normalize()
    
    // FLIP VECTOR: viewDir points to camera. We want to look AWAY from camera.
    viewDir.negate()

    const viewRight = new THREE.Vector3()
    viewRight.crossVectors(viewDir, new THREE.Vector3(0, 1, 0))

    if (forward) moveDir.add(viewDir)
    if (backward) moveDir.sub(viewDir)
    if (right) moveDir.add(viewRight)
    if (left) moveDir.sub(viewRight)
    
    if (joystick.isActive) {
      const joyForward = viewDir.clone().multiplyScalar(joystick.y)
      const joyRight = viewRight.clone().multiplyScalar(joystick.x)
      moveDir.add(joyForward).add(joyRight)
    }

    // 3. ANIMATION STATE
    const isMoving = moveDir.lengthSq() > 0.001
    const targetAction = isMoving ? "sprint" : "idle"
    if (targetAction !== currentAction) {
      setCurrentAction(targetAction)
    }

    // 4. PHYSICS
    const currentVel = rigidBodyRef.current.linvel()
    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize().multiplyScalar(moveSpeed)
      rigidBodyRef.current.setLinvel({ x: moveDir.x, y: currentVel.y, z: moveDir.z }, true)
      
      const angle = Math.atan2(moveDir.x, moveDir.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle/2), z: 0, w: Math.cos(angle/2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true)
    }

    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })
  })

  return (
    <>
      {/* BOOM ARM */}
      <group ref={setPivot}>
        <PerspectiveCamera makeDefault position={[0, 0.2, 3.0]} />
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
        <primitive object={scene} scale={0.6} position={[0, -0.55, 0]} />
      </RigidBody>
    </>
  )
}
