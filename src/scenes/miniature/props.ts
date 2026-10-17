import * as T from 'three';
import type { Kit, Shape, Vec3 } from '../toon/Kit';
import type { Palette } from './palette';

/** 固定种子的伪随机：每次刷新，石板与草叶的位置都一样。 */
export function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export interface LanternOptions {
  scale?: number;
  paper: string;
  cap: string;
  halo?: T.Texture;
  haloColor?: string;
  haloSize?: number;
  glow?: number;
  tassel?: boolean;
}

/** 一盏灯笼：椭球纸身、上下木盖、流苏，再加一圈光晕。 */
export function lantern(kit: Kit, parent: T.Object3D, position: Vec3, options: LanternOptions) {
  const group = new T.Group();
  group.position.fromArray(position);
  const scale = options.scale ?? 1;
  group.scale.setScalar(scale);
  parent.add(group);

  const body = kit.ball(group, 0.3, [0, 0, 0], options.paper, { glow: options.glow ?? 0.6, ink: true, inkScale: 1.03 });
  body.scale.set(1, 1.12, 1);
  for (let rib = 0; rib < 8; rib++) {
    const angle = (rib / 8) * Math.PI * 2;
    kit.beam(group, [Math.cos(angle) * 0.03, 0.33, Math.sin(angle) * 0.03], [Math.cos(angle) * 0.26, 0, Math.sin(angle) * 0.26], 0.008, options.cap, { shadow: false });
    kit.beam(group, [Math.cos(angle) * 0.26, 0, Math.sin(angle) * 0.26], [Math.cos(angle) * 0.03, -0.33, Math.sin(angle) * 0.03], 0.008, options.cap, { shadow: false });
  }
  for (const y of [0.34, -0.34]) kit.round(group, 0.1, 0.1, 0.05, [0, y, 0], options.cap, 8, { ink: true });
  if (options.tassel !== false) {
    kit.beam(group, [0, -0.36, 0], [0, -0.66, 0], 0.016, options.cap, { shadow: false });
    kit.ball(group, 0.045, [0, -0.68, 0], options.paper, { shadow: false });
  }
  const halo = options.halo ? kit.halo(group, options.halo, [0, 0, 0], options.haloSize ?? 1.5, options.haloColor ?? options.paper, 0.55) : undefined;
  return { group, halo };
}

export interface TreeOptions {
  scale?: number;
  style?: 'round' | 'willow' | 'pine';
  palette: Palette;
  blossom?: string;
}

/** 三棵树的三种性格：圆冠、垂柳、松。 */
export function tree(kit: Kit, parent: T.Object3D, position: Vec3, options: TreeOptions) {
  const group = new T.Group();
  group.position.fromArray(position);
  group.scale.setScalar(options.scale ?? 1);
  parent.add(group);
  const palette = options.palette;
  const style = options.style ?? 'round';

  if (style === 'pine') {
    kit.round(group, 0.06, 0.1, 1.5, [0, 0.75, 0], palette.woodDark, 6, { ink: true });
    for (let layer = 0; layer < 3; layer++) {
      const radius = 0.52 - layer * 0.12;
      kit.cone(group, radius, 0.62, [0, 0.9 + layer * 0.36, 0], layer % 2 ? palette.leaf : palette.leafDark, 7, { ink: true, inkScale: 1.03 });
    }
    return group;
  }

  if (style === 'willow') {
    kit.round(group, 0.07, 0.12, 1.35, [0, 0.68, 0], palette.woodDark, 6, { ink: true });
    for (let branch = 0; branch < 4; branch++) {
      const angle = (branch / 4) * Math.PI * 2 + 0.4;
      kit.beam(group, [0, 1.05, 0], [Math.cos(angle) * 0.42, 1.32, Math.sin(angle) * 0.42], 0.04, palette.woodDark, { shadow: false });
    }
    kit.ball(group, 0.46, [0, 1.42, 0], palette.leaf, { ink: true, inkScale: 1.04, scale: [1.2, 0.72, 1.2] });
    for (let strand = 0; strand < 14; strand++) {
      const angle = (strand / 14) * Math.PI * 2;
      const radius = 0.3 + (strand % 3) * 0.1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      kit.beam(group, [x * 0.6, 1.5, z * 0.6], [x, 0.72 - (strand % 4) * 0.1, z], 0.022, palette.leafDark, { shadow: false });
      kit.ball(group, 0.07, [x, 0.7 - (strand % 4) * 0.1, z], palette.leaf, { shadow: false });
    }
    return group;
  }

  kit.round(group, 0.08, 0.14, 1.4, [0, 0.7, 0], palette.woodDark, 6, { ink: true });
  for (let branch = 0; branch < 3; branch++) {
    const angle = (branch / 3) * Math.PI * 2;
    kit.beam(group, [0, 1.0, 0], [Math.cos(angle) * 0.34, 1.38, Math.sin(angle) * 0.34], 0.045, palette.woodDark, { shadow: false });
  }
  const blobs: Array<[number, number, number, number]> = [
    [0, 1.6, 0, 0.62],
    [-0.4, 1.34, 0.16, 0.44],
    [0.36, 1.36, -0.2, 0.42],
    [0.1, 1.28, 0.4, 0.34],
  ];
  blobs.forEach(([x, y, z, radius], index) => {
    const blob = kit.rock(group, radius, [x, y, z], index % 2 ? palette.leaf : palette.leafDark, { ink: true, inkScale: 1.04 });
    blob.scale.set(1, 0.78, 1);
    blob.rotation.set(index * 0.7, index * 1.3, index * 0.4);
  });
  if (options.blossom) {
    for (let dot = 0; dot < 7; dot++) {
      const angle = dot * 1.9;
      kit.ball(group, 0.07, [Math.cos(angle) * 0.52, 1.46 + Math.sin(dot) * 0.2, Math.sin(angle) * 0.5], options.blossom, { shadow: false });
    }
  }
  return group;
}

export interface PersonOptions {
  scale?: number;
  palette: Palette;
  robe?: string;
  hat?: 'straw' | 'bun' | 'none';
  facing?: number;
  sitting?: boolean;
  arms?: 'idle' | 'up' | 'front';
}

/** 小人物：一头一袍，尺寸收着做，才像微缩模型里的点景。 */
export function person(kit: Kit, parent: T.Object3D, position: Vec3, options: PersonOptions) {
  const group = new T.Group();
  group.position.fromArray(position);
  group.scale.setScalar(options.scale ?? 1);
  group.rotation.y = options.facing ?? 0;
  parent.add(group);
  const palette = options.palette;
  const robe = options.robe ?? palette.robe;

  kit.round(group, 0.15, 0.26, 0.56, [0, 0.28, 0], robe, 8, { ink: true, inkScale: 1.04 });
  kit.round(group, 0.2, 0.17, 0.12, [0, 0.58, 0], palette.robeAlt, 8, { shadow: false });
  kit.ball(group, 0.13, [0, 0.7, 0], palette.skin, { ink: true, inkScale: 1.06 });

  if (options.hat === 'straw') {
    kit.cone(group, 0.26, 0.16, [0, 0.78, 0], palette.woodLight, 8, { ink: true });
  } else if (options.hat !== 'none') {
    kit.ball(group, 0.13, [0, 0.76, -0.01], palette.ink, { ink: false, scale: [1, 0.7, 1] });
    kit.ball(group, 0.07, [0, 0.86, -0.02], palette.ink, { shadow: false });
  }

  if (options.sitting) {
    group.position.y = position[1] - 0.14;
    kit.round(group, 0.14, 0.22, 0.3, [0, 0.16, 0], robe, 8, { ink: true, inkScale: 1.04 });
  }
  const armAngle = options.arms === 'up' ? 1.1 : options.arms === 'front' ? 0.9 : 0.25;
  for (const side of [-1, 1]) {
    const arm = kit.round(group, 0.055, 0.05, 0.34, [side * 0.2, 0.44, options.arms === 'front' ? 0.1 : 0], robe, 6, { shadow: false });
    arm.rotation.z = side * armAngle;
    arm.rotation.x = options.arms === 'front' ? -0.9 : 0;
  }
  return group;
}

/** 一摊货：果篮、布匹、小玩具、茶器，用色块交代品类。 */
export function goods(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette, kind: 'fruit' | 'cloth' | 'toys' | 'tea') {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  const tones = [palette.accent, palette.accentAlt, palette.leaf, palette.woodLight];

  if (kind === 'fruit') {
    for (let index = 0; index < 7; index++) {
      const angle = index * 2.1;
      kit.ball(group, 0.075, [Math.cos(angle) * 0.16, 0.08 + (index % 3) * 0.02, Math.sin(angle) * 0.13], tones[index % 3], { shadow: false });
    }
    kit.round(group, 0.24, 0.19, 0.08, [0, 0.02, 0], palette.woodLight, 10, { ink: true });
  } else if (kind === 'cloth') {
    for (let index = 0; index < 3; index++) {
      const roll = kit.round(group, 0.075, 0.075, 0.42, [0, 0.1 + index * 0.13, 0], tones[index], 8, { ink: true, rot: [0, 0, Math.PI / 2] });
      roll.rotation.y = index * 0.2;
    }
  } else if (kind === 'toys') {
    kit.box(group, [0.3, 0.05, 0.24], [0, 0.03, 0], palette.woodLight);
    kit.ball(group, 0.09, [-0.06, 0.12, 0], palette.accent, { ink: true });
    kit.box(group, [0.1, 0.1, 0.1], [0.08, 0.1, 0.02], palette.accentAlt, { ink: true });
    kit.cone(group, 0.07, 0.16, [0.02, 0.16, -0.07], palette.leaf, 6, { ink: true });
  } else {
    for (let index = 0; index < 3; index++) {
      kit.round(group, 0.07, 0.05, 0.09, [-0.14 + index * 0.14, 0.06, 0], index % 2 ? palette.wall : palette.water, 10, { ink: true });
    }
    kit.round(group, 0.11, 0.09, 0.1, [0, 0.06, -0.18], palette.accentAlt, 10, { ink: true });
  }
  return group;
}

export function basket(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette, scale = 1) {
  const group = new T.Group();
  group.position.fromArray(position);
  group.scale.setScalar(scale);
  parent.add(group);
  kit.round(group, 0.18, 0.15, 0.22, [0, 0.11, 0], palette.woodLight, 10, { ink: true });
  kit.round(group, 0.19, 0.19, 0.04, [0, 0.22, 0], palette.wood, 10, { shadow: false });
  return group;
}

export function jar(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette, color?: string) {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  const body = kit.ball(group, 0.17, [0, 0.16, 0], color ?? palette.accentAlt, { ink: true });
  body.scale.set(1, 0.95, 1);
  kit.round(group, 0.09, 0.11, 0.09, [0, 0.31, 0], color ?? palette.accentAlt, 10, { ink: true });
  return group;
}

export function crate(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette, size = 0.34) {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  kit.box(group, [size, size * 0.8, size * 0.9], [0, size * 0.4, 0], palette.wood, { ink: true });
  for (const y of [0.1, 0.56]) kit.box(group, [size + 0.02, size * 0.12, size * 0.94], [0, size * y, 0], palette.woodDark, { shadow: false });
  return group;
}

/** 独轮小车：货郎的行头。 */
export function cart(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette) {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  kit.box(group, [0.66, 0.1, 0.42], [0, 0.3, 0], palette.wood, { ink: true });
  for (const side of [-1, 1]) kit.box(group, [0.68, 0.16, 0.04], [0, 0.4, side * 0.19], palette.woodDark, { shadow: false });
  kit.box(group, [0.6, 0.3, 0.36], [0, 0.5, 0], palette.cloth, { ink: true });
  for (const side of [-1, 1]) kit.round(group, 0.19, 0.19, 0.05, [0, 0.2, side * 0.2], palette.woodDark, 12, { ink: true, rot: [Math.PI / 2, 0, 0] });
  kit.beam(group, [0.3, 0.36, 0], [0.62, 0.56, 0], 0.03, palette.woodDark, { shadow: false });
  return group;
}
/** 灶上蒸汽：几团慢慢升起又淡掉的白。 */
export function steam(kit: Kit, texture: T.Texture, count: number) {
  const group = new T.Group();
  const puffs: T.Sprite[] = [];
  for (let index = 0; index < count; index++) {
    const sprite = kit.halo(group, texture, [0, index * 0.24, 0], 0.5 + (index % 3) * 0.14, '#ffffff', 0);
    puffs.push(sprite);
  }
  return {
    group,
    tick(time: number, activity: number) {
      puffs.forEach((puff, index) => {
        const phase = (time * 0.22 + index / puffs.length) % 1;
        puff.position.y = phase * 1.5;
        puff.position.x = Math.sin(phase * 6 + index) * 0.12;
        puff.material.opacity = activity * 0.4 * Math.sin(phase * Math.PI);
      });
    },
  };
}

export interface IslandOptions {
  radius: number;
  palette: Palette;
  /** 地面石板的疏密，只要不改，形状就固定。 */
  seed?: number;
  paving?: 'slabs' | 'earthen' | 'plank';
}

/** 微缩模型的底盘：一块浮空的圆地，上石板、下岩层，边缘一圈砌石。 */
export function island(kit: Kit, parent: T.Object3D, options: IslandOptions) {
  const group = new T.Group();
  parent.add(group);
  const palette = options.palette;
  const radius = options.radius;
  const rand = seeded(options.seed ?? 7);

  kit.round(group, radius, radius * 0.99, 0.16, [0, -0.08, 0], palette.stone, 14, { ink: true, inkScale: 1.01 });
  kit.round(group, radius * 0.97, radius * 0.86, 0.26, [0, -0.28, 0], palette.soil, 14, { ink: true });
  kit.round(group, radius * 0.84, radius * 0.16, 1.05, [0, -0.9, 0], palette.rock, 9, { ink: true, inkScale: 1.02 });
  for (let chunk = 0; chunk < 5; chunk++) {
    const angle = (chunk / 5) * Math.PI * 2 + 0.6;
    const rock = kit.rock(group, 0.16 + rand() * 0.14, [Math.cos(angle) * radius * 0.42, -0.62 - rand() * 0.3, Math.sin(angle) * radius * 0.42], palette.rock, { ink: true });
    rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  }

  const style = options.paving ?? 'slabs';
  if (style === 'slabs') {
    for (let row = -3; row <= 3; row++) {
      for (let column = -3; column <= 3; column++) {
        const x = column * (radius / 3.2) + (row % 2 ? radius / 6.4 : 0);
        const z = row * (radius / 3.4);
        if (Math.hypot(x, z) > radius * 0.86) continue;
        if (rand() < 0.12) continue;
        const slab = kit.box(group, [radius / 3.3 - 0.03, 0.045, radius / 3.6 - 0.03], [x, 0.008, z], rand() > 0.5 ? palette.stone : palette.stoneAlt, { shadow: false });
        slab.rotation.y = (rand() - 0.5) * 0.06;
      }
    }
  } else if (style === 'plank') {
    for (let row = -3; row <= 3; row++) {
      kit.box(group, [radius * 1.5, 0.05, radius / 3.6], [0, 0.006, row * (radius / 3.4)], row % 2 ? palette.wood : palette.woodLight, { shadow: false });
    }
  } else {
    for (let patch = 0; patch < 14; patch++) {
      const angle = rand() * Math.PI * 2;
      const distance = rand() * radius * 0.8;
      const blob = kit.rock(group, 0.16 + rand() * 0.2, [Math.cos(angle) * distance, 0.01, Math.sin(angle) * distance], rand() > 0.5 ? palette.moss : palette.stoneAlt, { shadow: false });
      blob.scale.set(1.3, 0.12, 1.3);
      blob.rotation.y = rand() * 3;
    }
  }

  // 边缘砌石：一圈小方块，是「模型底盘」的关键手感。
  const rimCount = 26;
  for (let index = 0; index < rimCount; index++) {
    const angle = (index / rimCount) * Math.PI * 2;
    const stone = kit.box(group, [0.24, 0.14, 0.16], [Math.cos(angle) * radius * 0.985, -0.02, Math.sin(angle) * radius * 0.985], index % 3 ? palette.stoneAlt : palette.stone, { shadow: false });
    stone.rotation.y = -angle;
    stone.rotation.z = (rand() - 0.5) * 0.1;
  }
  return group;
}

/** 地上的草：几簇细尖，别让石板太干。 */
export function grass(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette, seed = 3) {
  const rand = seeded(seed);
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  for (let tuft = 0; tuft < 5; tuft++) {
    const x = (rand() - 0.5) * 0.5;
    const z = (rand() - 0.5) * 0.5;
    const blade = kit.cone(group, 0.045, 0.1 + rand() * 0.12, [x, 0.06, z], tuft % 2 ? palette.leaf : palette.leafDark, 4, { shadow: false });
    blade.rotation.z = (rand() - 0.5) * 0.4;
  }
  return group;
}

export interface WaterOptions {
  radius: number;
  palette: Palette;
  ripples?: number;
}

/** 一小片水：浅色水面加几圈波光。 */
export function pool(kit: Kit, parent: T.Object3D, position: Vec3, options: WaterOptions) {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  kit.round(group, options.radius, options.radius, 0.04, [0, 0.02, 0], options.palette.water, 18, { shadow: false });
  const ripples = options.ripples ?? 3;
  for (let ring = 0; ring < ripples; ring++) {
    kit.round(group, options.radius * (0.3 + ring * 0.2), options.radius * (0.3 + ring * 0.2), 0.012, [0, 0.045, 0], options.palette.waterLight, 18, { shadow: false, opacity: 0.7 });
  }
  return group;
}

/** 石阶：把高处与地面接起来。 */
export function steps(kit: Kit, parent: T.Object3D, position: Vec3, palette: Palette, count = 2, shape: Shape = {}) {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  for (let index = 0; index < count; index++) {
    kit.box(group, [0.7 - index * 0.04, 0.08, 0.2], [0, 0.04 + index * 0.08, -index * 0.16], index % 2 ? palette.stone : palette.stoneAlt, { ...shape, shadow: false });
  }
  return group;
}
