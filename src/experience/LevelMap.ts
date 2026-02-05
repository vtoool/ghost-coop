export type MapLegend = Record<string, string>;

export const mapLegend: MapLegend = {
  // --- ROADS & PROPS ---
  '=': 'road',
  'S': 'crypt',
  'B': 'bench',
  'L': 'lantern_candle',

  // --- NATURE ---
  'T': 'pine',
  't': 'pine_crooked',
  'O': 'oak',
  '.': 'void',

  // --- GRAVES ---
  '+': 'gravestone_cross',
  'o': 'gravestone_round',
  'G': 'gravestone_broken',

  // --- WALLS (Explicit) ---
  '┌': 'stone_wall_corner_tl',
  '┐': 'stone_wall_corner_tr',
  '┘': 'stone_wall_corner_br',
  '└': 'stone_wall_corner_bl',
  '|': 'stone_wall_vertical',
  '-': 'stone_wall_horizontal',

  // --- FENCES (Explicit) ---
  '1': 'iron_fence_corner_tl',
  '2': 'iron_fence_corner_tr',
  '3': 'iron_fence_corner_br',
  '4': 'iron_fence_corner_bl',
  'v': 'iron_fence_vertical',
  'h': 'iron_fence_horizontal',
}

export const level1 = [
  '┌-------------------------┐',
  '|T..o.....T..===..T.....o.|',
  '|..+.........===.........+T',
  '|T...G....S..===..S....G..|',
  '|..T.........===.........+T',
  '|.+..┌-------===-------┐.+|',
  '|....+.......===.......+..|',
  '|T.o...T..t..===..t..T...o|',
  '|...G.....B..===..B.....G.|',
  '|.T...hhhh...===...hhhh...|',
  '|..+.h....T..=+=..T....h.+|',
  '|o..h........===........h.|',
  '|T.h...o..T..===..T..o...h|',
  '|.h...G......===......G...h',
  '|T....T...t..===..t...T...|',
  '|..+.....o...===...o.....+|',
  '|o....S......===......S..o|',
  '|T..t.....T..===..T.....t.|',
  '└-------------------------┘',
] as const;
