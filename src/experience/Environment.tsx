import type { ReactElement } from 'react';
import { MapRenderer } from './MapRenderer'

export default function Environment(): ReactElement {
  return (
    <>
      {/* Tile Map Generated World */}
      <MapRenderer />
    </>
  )
}
