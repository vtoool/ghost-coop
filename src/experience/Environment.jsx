import { useThree } from '@react-three/fiber'
import { MapRenderer } from './MapRenderer'

export default function Environment() {
  return (
    <>
      {/* Moody Graveyard Fog - Deep Night Atmosphere */}
      <fogExp2 color="#050505" density={0.05} />

      {/* Tile Map Generated World */}
      <MapRenderer />
    </>
  )
}
