export type MapLegend = Record<string, string>;

export const mapLegend: MapLegend = {
  '#': 'stone_wall',
  'x': 'iron_fence',
  'O': 'oak',
  'T': 'pine',
  't': 'pine_crooked',
  'S': 'crypt',
  'B': 'bench',
  'L': 'lantern_candle',
  '+': 'gravestone_cross',
  'o': 'gravestone_round',
  '-': 'gravestone_broken',
  '=': 'road',
  '.': 'void',
} as const;

export const level1: readonly string[] = [
  '###########################',
  '#T..o..x..T..===..T..x..o.#',
  '#..+...x.....===.....x...+T',
  '#T...-.x..S..===..S..x.-..#',
  '#..T...x.....===.....x...T#',
  '#.+..#######.===.#######.+.#',
  '#....+.......===.......+..#',
  '#T.o...T..t..===..t..T...o#',
  '#...-.....B..===..B.....-.#',
  '#.T...xxxx...===...xxxx...#',
  '#..+.x....T..=+=..T....x.+#',
  '#o..x........===........x.#',
  '#T.x...o..T..===..T..o...x#',
  '#.x...-......===......-...x',
  '#T....T...t..===..t...T...#',
  '#..+.....o...===...o.....+.#',
  '#o....S......===......S..o.#',
  '#T..t.....T..===..T.....t.#',
  '###########################',
] as const;
