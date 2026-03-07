// src/game/data.ts
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type SeasonState = 'たまご' | '幼虫' | 'さなぎ' | '成虫' | 'ヤゴ' | '冬眠' | 'なし' | '働きアリ' | '女王アリ';
export type TileType = 'tree' | 'flower' | 'pond' | 'grass' | 'dirt';
export type ActionType = 'water' | 'fertilize' | 'mow' | 'plant' | 'observe';

export interface Tile {
  type: TileType;
  level: number;
}

export interface Insect {
  id: string;
  name: string;
  emoji: string;
  hint: string;
  checkAppearance: (stats: MapStats, grid: Tile[]) => boolean;
  stages: Record<Season, SeasonState>;
  habitat: TileType;
  rarity: number;
}

export interface MapStats {
  treeLevel: number;
  flowerLevel: number;
  pondLevel: number;
  grassLevel: number;
  dirtLevel: number;
  treeCount: number;
  flowerCount: number;
  pondCount: number;
  grassCount: number;
  dirtCount: number;
  hiddenPoints: {
    tree: number;
    flower: number;
    water: number;
    grass: number;
    dirt: number;
    insect: number;
  };
}

export interface Combo {
  id: string;
  name: string;
  desc: string;
  check: (stats: MapStats, appearedInsects: string[]) => boolean;
}

export const TILE_EMOJIS: Record<TileType, string> = {
  tree: '🌳',
  flower: '🌻',
  pond: '💧',
  grass: '🌿',
  dirt: '🟫'
};

export const hasAdjacent = (grid: Tile[], type1: TileType, type2: TileType): boolean => {
  for (let i = 0; i < 25; i++) {
    if (grid[i].type === type1) {
      const neighbors = [
        i >= 5 ? i - 5 : -1,
        i < 20 ? i + 5 : -1,
        i % 5 !== 0 ? i - 1 : -1,
        i % 5 !== 4 ? i + 1 : -1
      ].filter(n => n !== -1);
      
      if (neighbors.some(n => grid[n].type === type2)) {
        return true;
      }
    }
  }
  return false;
};

export const INSECTS: Insect[] = [
  {
    id: 'kabutomushi',
    name: 'カブトムシ',
    emoji: '🪲',
    hint: '木をたくさん育てて、立派な森を作ろう。',
    checkAppearance: (s) => s.treeLevel >= 10,
    stages: { spring: '幼虫', summer: '成虫', fall: 'なし', winter: '幼虫' },
    habitat: 'tree',
    rarity: 2
  },
  {
    id: 'kuwagata',
    name: 'ノコギリクワガタ',
    emoji: '🪲',
    hint: 'カブトムシよりもさらに立派な木が必要だ。',
    checkAppearance: (s, grid) => s.treeLevel >= 25 && hasAdjacent(grid, 'tree', 'tree'),
    stages: { spring: '幼虫', summer: '成虫', fall: 'なし', winter: '幼虫' },
    habitat: 'tree',
    rarity: 5
  },
  {
    id: 'chocho',
    name: 'モンシロチョウ',
    emoji: '🦋',
    hint: 'お花畑を育ててみよう。',
    checkAppearance: (s) => s.flowerLevel >= 10,
    stages: { spring: '幼虫', summer: '成虫', fall: '成虫', winter: 'さなぎ' },
    habitat: 'flower',
    rarity: 1
  },
  {
    id: 'kumabachi',
    name: 'クマバチ',
    emoji: '🐝',
    hint: 'たくさんのお花が咲き乱れる場所が好き。',
    checkAppearance: (s, grid) => s.flowerLevel >= 20 && hasAdjacent(grid, 'flower', 'flower'),
    stages: { spring: '成虫', summer: '成虫', fall: 'なし', winter: '冬眠' },
    habitat: 'flower',
    rarity: 4
  },
  {
    id: 'oniyanma',
    name: 'オニヤンマ',
    emoji: '🪰',
    hint: 'きれいな水辺（池）を育ててみよう。',
    checkAppearance: (s) => s.pondLevel >= 10,
    stages: { spring: 'ヤゴ', summer: '成虫', fall: '成虫', winter: 'ヤゴ' },
    habitat: 'pond',
    rarity: 3
  },
  {
    id: 'kirigirisu',
    name: 'キリギリス',
    emoji: '🦗',
    hint: '草むらを育ててあげよう。',
    checkAppearance: (s) => s.grassLevel >= 10,
    stages: { spring: '幼虫', summer: '成虫', fall: '成虫', winter: 'たまご' },
    habitat: 'grass',
    rarity: 1
  },
  {
    id: 'batta',
    name: 'トノサマバッタ',
    emoji: '🦗',
    hint: '広い草むらを育ててみよう。',
    checkAppearance: (s) => s.grassLevel >= 20,
    stages: { spring: '幼虫', summer: '成虫', fall: '成虫', winter: 'たまご' },
    habitat: 'grass',
    rarity: 4
  },
  {
    id: 'kamakiri',
    name: 'オオカマキリ',
    emoji: '🦗',
    hint: '草むらに他の虫（バッタなど）が集まるとやってくるぞ。',
    checkAppearance: (s, grid) => s.grassLevel >= 25 && hasAdjacent(grid, 'grass', 'grass'),
    stages: { spring: '幼虫', summer: '成虫', fall: '成虫', winter: 'たまご' },
    habitat: 'grass',
    rarity: 5
  },
  {
    id: 'ari',
    name: 'クロオオアリ',
    emoji: '🐜',
    hint: '土の地面を残して見守ろう。',
    checkAppearance: (s) => s.dirtLevel >= 5,
    stages: { spring: '働きアリ', summer: '女王アリ', fall: '働きアリ', winter: '冬眠' },
    habitat: 'dirt',
    rarity: 1
  },
  {
    id: 'hanmyo',
    name: 'ハンミョウ',
    emoji: '🪲',
    hint: '土の地面と少しの草むらがある道が好き。',
    checkAppearance: (s, grid) => s.dirtLevel >= 8 && s.grassLevel >= 10 && hasAdjacent(grid, 'dirt', 'grass'),
    stages: { spring: '幼虫', summer: '成虫', fall: '成虫', winter: '幼虫' },
    habitat: 'dirt',
    rarity: 2
  }
];

export const COMBOS: Combo[] = [
  {
    id: 'oasis',
    name: '水辺のオアシス',
    desc: '水辺が豊かで、水生昆虫が定着しました！',
    check: (s, insects) => s.pondCount >= 3 && insects.includes('oniyanma')
  },
  {
    id: 'sap',
    name: '樹液の決戦',
    desc: 'クヌギの木をめぐり、ライバル同士が集結しています！',
    check: (s, insects) => insects.includes('kabutomushi') && insects.includes('kuwagata')
  },
  {
    id: 'foodchain',
    name: '食物連鎖',
    desc: '草食昆虫とそれを狙う肉食昆虫の、自然な生態系ができました！',
    check: (s, insects) => (insects.includes('batta') || insects.includes('kirigirisu')) && insects.includes('kamakiri')
  }
];

export const ACTIONS: { id: ActionType; name: string; desc: string }[] = [
  { id: 'water', name: '水やり', desc: '池と花のレベルが上がります。' },
  { id: 'fertilize', name: '肥料をまく', desc: '木と花のレベルが上がります。' },
  { id: 'mow', name: '草刈り', desc: '草のレベルが1(🌱)になりますが、隠しポイントが入ります。' },
  { id: 'plant', name: '種まき', desc: '土の一部が草や花に変わるかもしれません。' },
  { id: 'observe', name: '見守る', desc: '自然の力で全体的に少し成長します。' }
];

export const calculateHiddenPoints = (plan: string) => {
  const points = { tree: 0, flower: 0, water: 0, grass: 0, dirt: 0, insect: 0 };
  if (plan.includes('木') || plan.includes('森')) points.tree += 2;
  if (plan.includes('花') || plan.includes('綺麗')) points.flower += 2;
  if (plan.includes('水') || plan.includes('池')) points.water += 2;
  if (plan.includes('草') || plan.includes('緑')) points.grass += 2;
  if (plan.includes('土') || plan.includes('地面')) points.dirt += 2;
  if (plan.includes('虫') || plan.includes('カブト')) points.insect += 2;
  return points;
};

export const getMapStats = (grid: Tile[], hiddenPoints: MapStats['hiddenPoints']): MapStats => {
  const stats: MapStats = {
    treeLevel: 0, flowerLevel: 0, pondLevel: 0, grassLevel: 0, dirtLevel: 0,
    treeCount: 0, flowerCount: 0, pondCount: 0, grassCount: 0, dirtCount: 0,
    hiddenPoints
  };
  grid.forEach(t => {
    if (t.type === 'tree') { stats.treeLevel += t.level; stats.treeCount += 1; }
    if (t.type === 'flower') { stats.flowerLevel += t.level; stats.flowerCount += 1; }
    if (t.type === 'pond') { stats.pondLevel += t.level; stats.pondCount += 1; }
    if (t.type === 'grass') { stats.grassLevel += t.level; stats.grassCount += 1; }
    if (t.type === 'dirt') { stats.dirtLevel += t.level; stats.dirtCount += 1; }
  });
  
  // Apply hidden points to levels
  stats.treeLevel += hiddenPoints.tree;
  stats.flowerLevel += hiddenPoints.flower;
  stats.pondLevel += hiddenPoints.water;
  stats.grassLevel += hiddenPoints.grass;
  stats.dirtLevel += hiddenPoints.dirt;
  
  return stats;
};
