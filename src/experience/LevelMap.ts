// Legend maps ASCII characters to GLB filename stems
export type MapLegend = Record<string, string>;

export const mapLegend: MapLegend = {
  '#': 'iron-fence',
  '=': 'iron-fence-border-gate',
  '|': 'stone-wall',
  '^': 'pine-crooked',
  'T': 'pine',
  '+': 'gravestone-cross',
  '*': 'gravestone-round',
  'x': 'gravestone-broken',
  'C': 'crypt',
  'L': 'lantern-candle',
  'B': 'bench',
  'R': 'rocks',
} as const;

// 20x20 Graveyard Layout
export const level1: readonly string[] = [
  "####################",
  "#^...++..L..++...^.#",
  "#...*..*...*..*....#",
  "#..T.....C.....T...#",
  "#......xx.xx.......#",
  "#..L..x.....x..L...#",
  "#.....|.....|......#",
  "|.....|..B..|......|",
  "|..^..+.....+..^...|",
  "|..................|",
  "|...R.........R....|",
  "#..................#",
  "#..*...........*...#",
  "#......L...L.......#",
  "#..T...........T...#",
  "#......^...^.......#",
  "#..................#",
  "#^.......=.......^.#",
  "####################",
] as const;