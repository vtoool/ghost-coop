import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

export default function Profiler() {
  const { gl } = useThree()
  const frameTimes = useRef<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const frameTimesAvg = frameTimes.current.length > 0
        ? frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
        : 0
      const fps = frameTimesAvg > 0 ? Math.round(1000 / frameTimesAvg) : 0

      console.group('📊 Performance Audit')
      console.log('FPS:', fps)
      console.log('Draw Calls:', gl.info.render.calls)
      console.log('Triangles:', gl.info.render.triangles)
      console.log('Geometries:', gl.info.memory.geometries)
      console.log('Textures:', gl.info.memory.textures)
      console.groupEnd()

      frameTimes.current = []
    }, 2000)

    return () => clearInterval(interval)
  }, [gl])

  useFrame(() => {
    frameTimes.current.push(performance.now())
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift()
    }
  })

  return null
}
