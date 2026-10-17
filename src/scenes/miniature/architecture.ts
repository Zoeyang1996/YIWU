import * as T from 'three';
import type { Kit, Vec3 } from '../toon/Kit';
import type { Palette } from './palette';

export interface RoofOptions {
  width: number;
  depth: number;
  rise?: number;
  curl?: number;
  position: Vec3;
  rotation?: number;
  tile: string;
  tileDark: string;
  tiles?: boolean;
}

/** 屋面剖面：屋脊陡、檐口缓，末端微微起翘。 */
function profilePoint(depth: number, rise: number, curl: number, u: number) {
  return {
    z: (depth / 2) * u,
    y: rise * Math.pow(1 - u, 1.4) + curl * Math.pow(u, 5),
  };
}

/** 中式屋面：两坡曲面、檐下望板、两端封口，是一个不漏空的实体。 */
function roofShell(width: number, depth: number, rise: number, curl: number) {
  const columns = 8;
  const rows = 5;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const side of [-1, 1]) {
    const start = positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const u = row / rows;
      for (let column = 0; column <= columns; column++) {
        const x = -width / 2 + (width * column) / columns;
        const corner = Math.pow(Math.abs(x) / (width / 2), 3);
        const point = profilePoint(depth, rise, curl, u);
        positions.push(x, point.y * (1 + corner * 0.16 * u), side * point.z);
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const a = start + row * (columns + 1) + column;
        const b = a + 1;
        const c = a + columns + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const underside = positions.length / 3;
  positions.push(-width / 2, 0, -depth / 2, width / 2, 0, -depth / 2, width / 2, 0, depth / 2, -width / 2, 0, depth / 2);
  indices.push(underside, underside + 1, underside + 2, underside, underside + 2, underside + 3);

  for (const side of [-1, 1]) {
    const x = (side * width) / 2;
    const hub = positions.length / 3;
    positions.push(x, 0, 0);
    const outline: number[] = [];
    const bottomLeft = positions.length / 3;
    positions.push(x, 0, -depth / 2);
    outline.push(bottomLeft);
    for (let row = rows; row >= 0; row--) {
      const point = profilePoint(depth, rise, curl, row / rows);
      outline.push(positions.length / 3);
      positions.push(x, point.y, -point.z);
    }
    for (let row = 1; row <= rows; row++) {
      const point = profilePoint(depth, rise, curl, row / rows);
      outline.push(positions.length / 3);
      positions.push(x, point.y, point.z);
    }
    const bottomRight = positions.length / 3;
    positions.push(x, 0, depth / 2);
    outline.push(bottomRight);
    for (let index = 0; index < outline.length - 1; index++) indices.push(hub, outline[index], outline[index + 1]);
  }

  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mergeParts(parts: T.BufferGeometry[]) {
  const position: number[] = [];
  for (const part of parts) {
    const source = part.index ? part.toNonIndexed() : part;
    const array = source.getAttribute('position');
    for (let vertex = 0; vertex < array.count; vertex++) position.push(array.getX(vertex), array.getY(vertex), array.getZ(vertex));
    if (source !== part) source.dispose();
  }
  if (!position.length) return undefined;
  const merged = new T.BufferGeometry();
  merged.setAttribute('position', new T.Float32BufferAttribute(position, 3));
  merged.computeVertexNormals();
  return merged;
}

/** 瓦垄：沿两坡铺下的细棱，合并成一条几何体，省掉几十次绘制。 */
function tileRidges(kit: Kit, parent: T.Object3D, key: string, width: number, depth: number, rise: number, curl: number, count: number, color: string) {
  const parts: T.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < count; index++) {
      const x = -width / 2 + (width * (index + 0.5)) / count;
      const points: T.Vector3[] = [];
      for (let step = 0; step <= 5; step++) {
        const point = profilePoint(depth, rise, curl, step / 5);
        points.push(new T.Vector3(x, point.y + 0.03, side * point.z));
      }
      for (let step = 0; step < 5; step++) {
        const from = points[step];
        const to = points[step + 1];
        const length = from.distanceTo(to);
        const segment = new T.CylinderGeometry(0.024, 0.024, length, 4);
        segment.translate(0, length / 2, 0);
        segment.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), to.clone().sub(from).normalize()));
        segment.translate(from.x, from.y, from.z);
        parts.push(segment);
      }
    }
  }
  const merged = mergeParts(parts);
  parts.forEach(part => part.dispose());
  if (!merged) return;
  kit.mesh(parent, kit.own(key, merged), color, [0, 0, 0], { shadow: false });
}

export function roof(kit: Kit, parent: T.Object3D, options: RoofOptions) {
  const rise = options.rise ?? 0.6;
  const curl = options.curl ?? 0.16;
  const group = new T.Group();
  group.position.fromArray(options.position);
  if (options.rotation) group.rotation.y = options.rotation;
  parent.add(group);

  const shell = roofShell(options.width, options.depth, rise, curl);
  const geometry = kit.own(`roof${options.width},${options.depth},${rise},${curl}`, shell);
  kit.mesh(group, geometry, options.tile, [0, 0, 0], { ink: true, inkScale: 1.01, double: true });

  if (options.tiles !== false) {
    tileRidges(kit, group, `ridges${options.width},${options.depth},${rise}`, options.width, options.depth, rise, curl, Math.max(4, Math.round(options.width / 0.34)), options.tileDark);
  }

  // 正脊与脊头：中式屋顶最快读出性格的一笔。
  kit.box(group, [options.width + 0.12, 0.09, 0.11], [0, rise + 0.05, 0], options.tileDark, { ink: true, inkScale: 1.06 });
  for (const x of [-1, 1]) {
    kit.box(group, [0.15, 0.18, 0.13], [x * (options.width / 2 + 0.05), rise + 0.11, 0], options.tileDark, { rot: [0, 0, x * 0.34] });
  }
  return group;
}

export interface HouseOptions {
  width: number;
  depth: number;
  height: number;
  storeys?: 1 | 2;
  rotation?: number;
  palette: Palette;
  windowGlow?: number;
}

export function house(kit: Kit, parent: T.Object3D, position: Vec3, options: HouseOptions) {
  const { palette } = options;
  const body = new T.Group();
  body.position.fromArray(position);
  body.rotation.y = options.rotation ?? 0;
  parent.add(body);
  const { width, depth, height } = options;

  kit.box(body, [width + 0.3, 0.16, depth + 0.3], [0, 0.08, 0], palette.stone, { ink: true });
  kit.box(body, [width, height, depth], [0, 0.16 + height / 2, 0], palette.wall, { ink: true, inkScale: 1.012 });

  for (const x of [-width / 2, width / 2]) {
    kit.box(body, [0.11, height, 0.11], [x, 0.16 + height / 2, depth / 2 - 0.02], palette.woodDark);
    kit.box(body, [0.11, height, 0.11], [x, 0.16 + height / 2, -depth / 2 + 0.02], palette.woodDark);
  }
  for (const y of [0.16 + height - 0.09, 0.24]) kit.box(body, [width + 0.07, 0.08, depth + 0.07], [0, y, 0], palette.woodDark);

  const bay = width / 3;
  const glow = options.windowGlow ?? 0;
  for (const index of [-1, 1]) {
    const x = index * bay;
    kit.box(body, [bay * 0.86, height * 0.56, 0.06], [x, 0.16 + height * 0.56, depth / 2], palette.woodDark);
    kit.box(body, [bay * 0.72, height * 0.46, 0.03], [x, 0.16 + height * 0.56, depth / 2 + 0.035], palette.wallAlt, { glow });
    for (let bar = -1; bar <= 1; bar++) kit.box(body, [0.042, height * 0.46, 0.05], [x + bar * bay * 0.22, 0.16 + height * 0.56, depth / 2 + 0.06], palette.woodLight, { shadow: false });
    for (const bar of [-0.13, 0.13]) kit.box(body, [bay * 0.72, 0.042, 0.05], [x, 0.16 + height * 0.56 + bar * height, depth / 2 + 0.06], palette.woodLight, { shadow: false });
  }
  kit.box(body, [bay * 0.82, height * 0.64, 0.07], [0, 0.16 + height * 0.32, depth / 2], palette.woodDark, { glow: glow * 0.5 });
  kit.box(body, [bay * 0.92, 0.07, 0.18], [0, 0.21, depth / 2 + 0.06], palette.stoneAlt);

  if (options.storeys === 2) {
    const upper = 0.16 + height;
    kit.box(body, [width * 0.94, height * 0.76, depth * 0.94], [0, upper + height * 0.38, 0], palette.wall, { ink: true });
    kit.box(body, [width + 0.12, 0.1, depth + 0.12], [0, upper + 0.05, 0], palette.woodDark);
    for (let bar = -1; bar <= 1; bar++) kit.box(body, [0.05, height * 0.56, 0.05], [bar * width * 0.26, upper + height * 0.4, depth * 0.47], palette.woodLight, { shadow: false });
    for (const x of [-width / 2, width / 2]) for (const z of [depth / 2, -depth / 2]) kit.box(body, [0.09, height * 0.76, 0.09], [x * 0.94, upper + height * 0.38, z * 0.94], palette.woodDark);
    for (let rail = 0; rail < 5; rail++) kit.box(body, [0.05, 0.2, 0.05], [-width * 0.4 + rail * width * 0.2, upper + 0.16, depth * 0.54], palette.woodLight, { shadow: false });
    kit.box(body, [width * 0.88, 0.06, 0.07], [0, upper + 0.29, depth * 0.54], palette.woodDark);
    roof(kit, body, { width: width * 1.22, depth: depth * 1.18, position: [0, upper + height * 0.76, 0], tile: palette.tile, tileDark: palette.tileDark, rise: 0.72, curl: 0.2 });
  } else {
    roof(kit, body, { width: width * 1.18, depth: depth * 1.16, position: [0, 0.16 + height, 0], tile: palette.tile, tileDark: palette.tileDark });
  }
  return body;
}

export interface GatewayOptions {
  width: number;
  height: number;
  palette: Palette;
}

/** 牌楼：一座微缩场景的门面，匾额留白只挂灯，不给画面添字。 */
export function gateway(kit: Kit, parent: T.Object3D, position: Vec3, options: GatewayOptions) {
  const { palette } = options;
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  const { width, height } = options;

  for (const x of [-width / 2, -width / 6, width / 6, width / 2]) {
    kit.round(group, 0.1, 0.12, height, [x, height / 2, 0], palette.woodDark, 8, { ink: true });
    kit.box(group, [0.3, 0.14, 0.3], [x, 0.07, 0], palette.stone, { ink: true });
  }
  kit.box(group, [width + 0.5, 0.22, 0.28], [0, height - 0.32, 0], palette.woodDark, { ink: true });
  kit.box(group, [width * 0.5, 0.46, 0.22], [0, height + 0.02, 0], palette.wood, { ink: true });
  kit.box(group, [width * 0.44, 0.36, 0.06], [0, height + 0.02, 0.13], palette.woodLight, { shadow: false });
  roof(kit, group, { width: width + 0.66, depth: 0.86, position: [0, height + 0.32, 0], tile: palette.tile, tileDark: palette.tileDark, rise: 0.46, curl: 0.13 });
  for (const x of [-1, 1]) {
    roof(kit, group, { width: width * 0.4, depth: 0.72, position: [x * width * 0.42, height - 0.04, 0], tile: palette.tile, tileDark: palette.tileDark, rise: 0.32, curl: 0.11, tiles: false });
    kit.box(group, [0.46, 0.14, 0.14], [x * width * 0.5, height - 0.58, 0], palette.woodDark);
  }
  return group;
}

export interface ShedOptions {
  width: number;
  depth: number;
  height: number;
  palette: Palette;
  cloth?: string;
  counter?: boolean;
}

/** 摊棚与茶棚：细柱、布篷、错落的短帘。 */
export function shed(kit: Kit, parent: T.Object3D, position: Vec3, options: ShedOptions) {
  const { palette } = options;
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  const { width, depth, height } = options;
  const cloth = options.cloth ?? palette.cloth;

  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) kit.round(group, 0.042, 0.048, height, [x, height / 2, z], palette.wood, 6, { ink: true });
  }
  kit.box(group, [width + 0.16, 0.07, 0.07], [0, height, depth / 2], palette.woodDark, { shadow: false });
  kit.box(group, [width + 0.16, 0.07, 0.07], [0, height, -depth / 2], palette.woodDark, { shadow: false });

  const canopy = kit.box(group, [width + 0.36, 0.05, depth + 0.32], [0, height + 0.13, 0], cloth, { ink: true, inkScale: 1.008 });
  canopy.rotation.x = 0.03;
  for (let stripe = 0; stripe < 5; stripe++) {
    const z = -depth / 2 + ((stripe + 0.5) * (depth + 0.3)) / 5;
    kit.box(group, [width + 0.36, 0.052, (depth + 0.3) / 11], [0, height + 0.132, z], palette.clothAlt, { shadow: false });
  }
  for (let piece = 0; piece < 6; piece++) {
    const x = -width / 2 + (width * (piece + 0.5)) / 6;
    kit.box(group, [width / 6 - 0.035, 0.19, 0.028], [x, height - 0.04, depth / 2 + 0.13], piece % 2 ? palette.clothAlt : cloth, { shadow: false, rot: [0, 0, piece % 2 ? 0.015 : -0.015] });
  }
  if (options.counter !== false) {
    kit.box(group, [width * 0.94, 0.66, depth * 0.44], [0, 0.39, -depth * 0.18], palette.wood, { ink: true });
    kit.box(group, [width * 1.0, 0.08, depth * 0.5], [0, 0.76, -depth * 0.18], palette.woodLight, { ink: true });
  }
  return group;
}

/** 石拱桥：楔形石块围成弧，加两道矮栏。 */
export function bridge(kit: Kit, parent: T.Object3D, position: Vec3, span: number, palette: Palette) {
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  const steps = 9;
  const rise = span * 0.32;
  for (let index = 0; index < steps; index++) {
    const t = index / (steps - 1);
    const x = (t - 0.5) * span;
    const y = Math.sin(t * Math.PI) * rise;
    const block = kit.box(group, [span / steps + 0.03, 0.13, span * 0.28], [x, y, 0], index % 2 ? palette.stone : palette.stoneAlt, { ink: true, inkScale: 1.02 });
    block.rotation.z = Math.cos(t * Math.PI) * 0.4;
  }
  for (const side of [-1, 1]) {
    for (let index = 0; index <= 4; index++) {
      const t = index / 4;
      kit.box(group, [0.07, 0.24, 0.07], [(t - 0.5) * span * 0.9, Math.sin(t * Math.PI) * rise + 0.19, side * span * 0.13], palette.stoneAlt, { shadow: false });
    }
    kit.box(group, [span * 0.92, 0.06, 0.07], [0, rise * 0.34 + 0.4, side * span * 0.13], palette.stone, { shadow: false });
  }
  return group;
}

export interface CounterOptions {
  width?: number;
  depth?: number;
  height?: number;
  palette: Palette;
}

/** 摊位柜台：一张长条桌，桌面留给货品。 */
export function counter(kit: Kit, parent: T.Object3D, position: Vec3, options: CounterOptions) {
  const { palette } = options;
  const width = options.width ?? 1.5;
  const depth = options.depth ?? 0.6;
  const height = options.height ?? 0.6;
  const group = new T.Group();
  group.position.fromArray(position);
  parent.add(group);
  kit.box(group, [width, height, depth], [0, height / 2, 0], palette.wood, { ink: true });
  kit.box(group, [width + 0.08, 0.07, depth + 0.1], [0, height + 0.03, 0], palette.woodLight, { ink: true });
  for (let slat = 0; slat < 4; slat++) {
    kit.box(group, [0.028, height * 0.78, 0.02], [-width / 2 + (width * (slat + 0.5)) / 4, height / 2, depth / 2 + 0.012], palette.woodDark, { shadow: false });
  }
  return group;
}
