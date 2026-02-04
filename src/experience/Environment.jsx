import { MapRenderer } from './MapRenderer'

export default function Environment() {
  return (
    <>
      {/* Moody Graveyard Fog - Deep Night Atmosphere */}
      <fogExp2 color="#050505" density={0.02} />

      {/* Tile Map Generated World */}
      <MapRenderer />
    </>
  )
}
