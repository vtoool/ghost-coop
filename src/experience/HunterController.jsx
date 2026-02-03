import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const meshGroupRef = useRef(null)
  const controlsRef = useRef(null)
  const { camera } = useThree()
  
  const [, getKeyboardControls] = useKeyboardControls()
  
  const moveSpeed = 8
  const joystickState = useRef({ x: 0, y: 0, isActive: false })
  
  const { scene } = useGLTF('/models/characters/character-male-a.glb')
  
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
  
  useEffect(() => {
    const player = myPlayer()
    if (!player) return
    
    const interval = setInterval(() => {
      if (typeof player.getJoystick === 'function') {
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
    }, 16)
    
    return () => clearInterval(interval)
  }, [])
  
  useFrame(() => {
    if (!rigidBodyRef.current) return
    
    const player = myPlayer()
    if (!player) return
    
    const { forward, backward, left, right } = getKeyboardControls()
    const moveDirection = new THREE.Vector3(0, 0, 0)
    let hasInput = false
    const joyState = joystickState.current
    
    if (joyState.isActive) {
      moveDirection.x += joyState.x
      moveDirection.z += joyState.y
      hasInput = true
    }
    
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
      
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z)
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = targetRotation
      }
    } else {
      rigidBodyRef.current.setLinvel({
        x: 0,
        y: rigidBodyRef.current.linvel().y,
        z: 0
      }, true)
    }
    
    const pos = rigidBodyRef.current.translation()
    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })
    
    if (meshGroupRef.current) {
      meshGroupRef.current.position.set(pos.x, pos.y - 0.9, pos.z)
    }
  })
  
  return (
    <>
      <PointerLockControls ref={controlsRef} />
      
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
      </RigidBody>
      
      <group ref={meshGroupRef}>
        <primitive object={clonedScene} scale={0.6} />
      </group>
    </>
  )
}
