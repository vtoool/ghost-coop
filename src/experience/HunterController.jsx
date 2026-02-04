import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, useKeyboardControls, PerspectiveCamera, useAnimations } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { myPlayer } from 'playroomkit'
import * as THREE from 'three'
import { useShadowTexture } from '../hooks/useShadowTexture'

export default function HunterController() {
  const rigidBodyRef = useRef(null)
  const shadowRef = useRef(null)
  const [pivot, setPivot] = useState(null)
  const [currentAction, setCurrentAction] = useState("idle")
  const { scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const downVector = useRef(new THREE.Vector3(0, -1, 0))
  const groundDistance = useRef(Infinity)

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
  const moveSpeed = 6
  const jumpVelocity = 8

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

    const moveDir = new THREE.Vector3()
    const viewDir = new THREE.Vector3()
    pivot.getWorldDirection(viewDir)
    viewDir.y = 0 
    viewDir.normalize()
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

    const vel = rigidBodyRef.current.linvel()

    let targetY = vel.y

    if (jump && groundDistance.current < 0.5) {
      targetY = jumpVelocity
    }

    const isMoving = moveDir.lengthSq() > 0.001
    if (isMoving) {
      moveDir.normalize().multiplyScalar(moveSpeed)
      rigidBodyRef.current.setLinvel({ x: moveDir.x, y: targetY, z: moveDir.z }, true)
      const angle = Math.atan2(moveDir.x, moveDir.z)
      rigidBodyRef.current.setRotation({ x: 0, y: Math.sin(angle/2), z: 0, w: Math.cos(angle/2) }, true)
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: targetY, z: 0 }, true)
    }

    player.setState('pos', { x: pos.x, y: pos.y, z: pos.z })

    let targetAnim = "idle"
    if (groundDistance.current > 0.6) {
      targetAnim = vel.y > 0 ? "jump" : "fall"
    } else {
      targetAnim = moveDir.lengthSq() > 0.001 ? "sprint" : "idle"
    }
    if (currentAction !== targetAnim) {
      setCurrentAction(targetAnim)
    }

    if (shadowRef.current) {
      const playerPos = new THREE.Vector3(pos.x, pos.y, pos.z)
      raycaster.current.set(playerPos, downVector.current)
      
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      const validHit = intersects.find(hit => {
        const obj = hit.object
        if (shadowRef.current && (obj === shadowRef.current || shadowRef.current.children.includes(obj))) {
          return false
        }
        if (obj === characterScene || characterScene.children.includes(obj)) {
          return false
        }
        return true
      })

      if (validHit && validHit.distance < 10) {
        groundDistance.current = validHit.distance
        const dist = validHit.distance
        shadowRef.current.visible = true
        shadowRef.current.position.set(playerPos.x, validHit.point.y + 0.02, playerPos.z)
        
        const scale = Math.max(0.3, 1 - (dist * 0.08))
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
        <PerspectiveCamera makeDefault position={[0, 0, 3.5]} />
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
        <pointLight color="#ffaa44" intensity={8} distance={20} decay={2} castShadow={false} position={[0, 1.5, 0.5]} />
        <primitive object={characterScene} scale={0.6} position={[0, -0.8, 0]} />
      </RigidBody>

      <mesh 
        ref={shadowRef} 
        rotation-x={-Math.PI / 2} 
        position-y={0.02}
        visible={false}
      >
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </>
  )
}
