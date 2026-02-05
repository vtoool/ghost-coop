export type MapLegend = Record<string, string>;

export const mapLegend: MapLegend = {
  '=': 'road',
  '#': 'stone_wall',
  'x': 'iron_fence',
  'S': 'crypt',
  'B': 'bench',
  'L': 'lantern_candle',
  'T': 'pine',
  't': 'pine_crooked',
  'O': 'oak',
  '+': 'gravestone_cross',
  'o': 'gravestone_round',
  '-': 'gravestone_broken',
  '.': 'void',
}

export const level1 = [
  '###########################',
  '#T..o..x..T..===..T..x..o.#',
  '#..+...x.....===.....x...+T',
  '#T...-.x..S..===..S..x.-..#',
  '#..T...x.....===.....x...T#',
  '#.+..#######.===.#######.+#',
  '#....+.......===.......+..#',
  '#T.o...T..t..===..t..T...o#',
  '#...-.....B..===..B.....-.#',
  '#.T...xxxx...===...xxxx...#',
  '#..+.x....T..=+=..T....x.+#',
  '#o..x........===........x.#',
  '#T.x...o..T..===..T..o...x#',
  '#.x...-......===......-...x',
  '#T....T...t..===..t...T...#',
  '#..+.....o...===...o.....+#',
  '#o....S......===......S..o#',
  '#T..t.....T..===..T.....t.#',
  '###########################',
] as const;
