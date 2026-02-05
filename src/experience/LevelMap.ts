// Legend maps ASCII characters to GLB filename stems
export type MapLegend = Record<string, string>;

export const mapLegend: MapLegend = {
  'T': 'pine',
  't': 'pine_crooked',
  'x': 'iron_fence',
  'v': 'iron_fence',           // Vertical fences (same model, rotated 90°)
  '#': 'stone_wall',
  '+': 'gravestone_cross',
  'o': 'gravestone_round',
  '-': 'gravestone_broken',
  'L': 'lantern_candle',
  'B': 'bench',
  'C': 'crypt',
  'R': 'rocks',
} as const;

// 30x30 High-Density Graveyard Layout
export const level1: readonly string[] = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "Tx..........................xT",
  "v............................v",
  "v...t...C.....RR.....C...t...v",
  "v...t....................t...v",
  "v...t...o-o..+o+..o-o....t...v",
  "v...t...+o+..-o-..+o+....t...v",
  "v...t....................t...v",
  "v...t...L.....B.....L....t...v",
  "v...t....................t...v",
  "v...t...###.......###....t...v",
  "v...t...#+#.......#+#....t...v",
  "v...t...###.......###....t...v",
  "v...t....................t...v",
  "v...t...L...........L....t...v",
  "v...t....................t...v",
  "v...t....................t...v",
  "v............................v",
  "Tx..........................xT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
] as const;
