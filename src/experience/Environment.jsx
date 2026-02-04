import { MapRenderer } from './MapRenderer'

export default function Environment() {
  return (
    <>
      {/* Moody Graveyard Fog */}
      <fogExp2 color="#1a1a2e" density={0.05} />

      {/* Tile Map Generated World */}
      <MapRenderer />
    </>
  )
}
