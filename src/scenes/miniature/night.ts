import * as T from 'three';
import { banner } from './banner';
import { bridge, gateway, house, shed } from './architecture';
import { goods, grass, island, lantern, pool, seeded, steam } from './props';
import { nightTrees } from './nightTrees';
import type { BuildContext, Diorama } from './types';

/** 夜市：灯铺、食棚、一排河灯，月光把瓦顶压成墨色。 */
export function buildNight({ kit, palette, halo, steam: steamTexture }: BuildContext): Diorama {
  const root = new T.Group();
  island(kit, root, { radius: 3.15, palette, seed: 67, paving: 'slabs' });

  const nightHouse = house(kit, root, [-1.42, 0, -1.55], { width: 1.32, depth: 1.0, height: 0.74, storeys: 2, palette, windowGlow: 0.95 });
  // 建房后立即保存屋顶引用，避免后续新增木作改变 children 的末项。
  const houseRoof = nightHouse.children.at(-1) as T.Group;
  const nightGate = gateway(kit, root, [1.52, 0, -1.32], { width: 1.62, height: 1.4, palette });

  // 木构不再只靠大色块：屋檐下有斗拱、门窗细格和台基砖缝。
  for (const x of [-0.48, 0.48]) {
    for (const y of [0.55, 1.18]) {
      kit.box(nightHouse, [0.18, 0.055, 0.34], [x, y, 0.53], palette.woodDark, { shadow: false });
      kit.box(nightHouse, [0.1, 0.13, 0.21], [x, y - 0.085, 0.51], palette.woodLight, { shadow: false });
    }
  }
  for (const x of [-0.43, 0.43]) for (const y of [0.48, 0.58, 0.68, 0.78]) {
    kit.box(nightHouse, [0.3, 0.012, 0.014], [x, y, 0.543], palette.woodDark, { shadow: false });
  }
  for (const x of [-0.53, -0.38, 0.38, 0.53]) kit.box(nightHouse, [0.016, 0.38, 0.018], [x, 0.62, 0.545], palette.woodLight, { shadow: false });
  for (let index = 0; index < 9; index++) {
    const x = -0.62 + index * 0.155;
    kit.box(nightHouse, [0.018, 0.13, 0.018], [x, 0.13, 0.655], index % 2 ? '#66675e' : '#898a7b', { shadow: false });
  }
  for (const x of [-0.62, -0.23, 0.23, 0.62]) {
    kit.box(nightGate, [0.12, 0.07, 0.34], [x, 1.08, 0], palette.woodLight, { shadow: false });
    kit.box(nightGate, [0.07, 0.15, 0.22], [x, 0.98, 0], palette.woodDark, { shadow: false });
  }

  // 瓦片分层搭接，合为少量实例绘制，避免把细节变成大量独立网格。
  const roofGeometry = kit.geo('night-roof-tile', () => new T.BoxGeometry(0.118, 0.016, 0.145));
  const roofTiles = new T.InstancedMesh(roofGeometry, kit.mat('#ffffff'), 13 * 5 * 2);
  const tileTransform = new T.Object3D();
  let tileIndex = 0;
  for (const side of [-1, 1]) for (let row = 0; row < 5; row++) for (let column = 0; column < 13; column++) {
    const u = (row + 0.46) / 5;
    const x = -0.78 + (column + 0.5) * 1.56 / 13 + (row % 2 ? 0.025 : 0);
    const z = side * 0.59 * u;
    const y = 0.72 * Math.pow(1 - u, 1.4) + 0.2 * Math.pow(u, 5) + 0.042;
    tileTransform.position.set(x, y, z);
    const slope = (0.72 * 1.4 * Math.pow(1 - u, 0.4) - Math.pow(u, 4)) / 0.59;
    tileTransform.rotation.set(side * Math.atan(slope), 0, 0);
    tileTransform.scale.set(1, 1, Math.sqrt(1 + slope * slope));
    tileTransform.updateMatrix();
    roofTiles.setMatrixAt(tileIndex, tileTransform.matrix);
    roofTiles.setColorAt(tileIndex, new T.Color(column % 4 === 0 ? '#626c67' : row % 3 === 0 ? '#424b4b' : '#53605d'));
    tileIndex++;
  }
  roofTiles.castShadow = true;
  roofTiles.receiveShadow = true;
  houseRoof.add(roofTiles);
  tileTransform.scale.setScalar(1);

  const foodStall = shed(kit, root, [0.92, 0, 0.58], { width: 1.52, depth: 1.06, height: 0.98, palette, cloth: '#6d4049' });
  goods(kit, foodStall, [-0.36, 0.8, 0.06], palette, 'tea');
  goods(kit, foodStall, [0.26, 0.8, 0.06], palette, 'fruit');
  for (const x of [-0.57, -0.28, 0.01, 0.3, 0.59]) {
    kit.box(foodStall, [0.012, 0.035, 1.15], [x, 1.135, 0], '#9a6970', { shadow: false });
  }
  for (const x of [-0.49, 0.49]) {
    kit.round(foodStall, 0.105, 0.12, 0.2, [x, 0.89, 0.03], '#71533e', 12, { shadow: false });
    kit.round(foodStall, 0.12, 0.12, 0.025, [x, 1.0, 0.03], '#b18b5f', 12, { shadow: false });
  }
  const steamGroup = steam(kit, steamTexture, 5);
  steamGroup.group.position.set(0.86, 0.86, 0.42);
  root.add(steamGroup.group);

  const waterGroup = pool(kit, root, [-1.42, 0, 1.16], { radius: 0.8, palette, ripples: 2 });
  waterGroup.position.y = -0.01;
  for (const x of [-0.68, 0.68]) kit.box(root, [0.16, 0.2, 0.3], [-1.42 + x, 0.1, 1.16], palette.stoneAlt, { ink: true });
  bridge(kit, root, [-1.42, 0.02, 1.16], 1.62, palette);

  // 湿润的石板和苔痕沿主街分布，不改变原有通行与主体摆位。
  const rand = seeded(614);
  const paving = new T.InstancedMesh(kit.geo('night-small-slab', () => new T.BoxGeometry(0.32, 0.018, 0.22)), kit.mat('#ffffff'), 66);
  for (let index = 0; index < 66; index++) {
    const row = Math.floor(index / 11);
    const column = index % 11;
    const x = -2.45 + column * 0.46 + (row % 2) * 0.2;
    const z = -0.47 + row * 0.38;
    tileTransform.position.set(x, 0.036 + rand() * 0.008, z);
    tileTransform.rotation.set(0, (rand() - 0.5) * 0.08, 0);
    tileTransform.scale.setScalar(Math.hypot(x + 1.42, z - 1.16) < 0.92 ? 0.001 : 1);
    tileTransform.updateMatrix();
    paving.setMatrixAt(index, tileTransform.matrix);
    paving.setColorAt(index, new T.Color(index % 7 === 0 ? '#56695d' : index % 3 === 0 ? '#909084' : '#777b70'));
  }
  paving.receiveShadow = true;
  root.add(paving);
  tileTransform.scale.setScalar(1);

  const trees = nightTrees(kit, root);

  const stallLight = new T.PointLight('#ffba70', 2.8, 3.4, 2);
  stallLight.position.set(0.92, 1.45, 0.56);
  root.add(stallLight);
  const windowLight = new T.PointLight('#e6a363', 1.5, 2.5, 2);
  windowLight.position.set(-1.35, 1.25, -0.8);
  root.add(windowLight);

  const flag = banner(kit, root, {
    character: '夜',
    position: [-2.66, 0, -0.36],
    facing: 0.34,
    poleColor: palette.woodDark,
    bg: '#1f3346',
    ink: '#f2ca7c',
    border: '#c8a05f',
    poleHeight: 3.7,
    width: 1.04,
    height: 2.24,
    seal: '#c9583f',
    emissive: '#26435a',
  });

  const lanterns = [
    lantern(kit, root, [-1.94, 1.16, -0.62], { scale: 0.62, paper: '#f4b96a', cap: '#4a3527', halo, glow: 1.1, haloSize: 1.5 }),
    lantern(kit, root, [-0.9, 1.16, -0.62], { scale: 0.62, paper: '#f4b96a', cap: '#4a3527', halo, glow: 1.1, haloSize: 1.5 }),
    lantern(kit, root, [1.2, 1.08, -1.24], { scale: 0.56, paper: '#f2b264', cap: '#4a3527', halo, glow: 1, haloSize: 1.35 }),
    lantern(kit, root, [1.84, 1.08, -1.24], { scale: 0.56, paper: '#f2b264', cap: '#4a3527', halo, glow: 1, haloSize: 1.35 }),
    lantern(kit, root, [0.32, 1.0, 0.62], { scale: 0.58, paper: '#f6c076', cap: '#4a3527', halo, glow: 1.15, haloSize: 0.4 }),
    lantern(kit, root, [1.52, 1.0, 0.62], { scale: 0.58, paper: '#f6c076', cap: '#4a3527', halo, glow: 1.15, haloSize: 0.4 }),
  ];
  // 街口的灯杆：两根细竹，各挑一盏。
  for (const [x, z, scale] of [[-2.68, 0.86, 0.66], [2.42, -0.42, 0.6]] as const) {
    kit.round(root, 0.035, 0.045, 2.3, [x, 1.15, z], palette.woodDark, 6, { ink: true });
    kit.beam(root, [x, 2.28, z], [x + 0.34, 2.24, z], 0.02, palette.woodDark, { shadow: false });
    lanterns.push(lantern(kit, root, [x + 0.4, 1.98, z], { scale, paper: '#f6c076', cap: '#4a3527', halo, glow: 1.2, haloSize: 1.4 }));
  }

  // 河灯：一盏盏小灯从桥下漂过。
  const riverLights: Array<{ group: T.Group; halo?: T.Sprite; phase: number }> = [];
  for (let index = 0; index < 4; index++) {
    const angle = (index / 4) * Math.PI * 2 + 0.6;
    const x = -1.42 + Math.cos(angle) * 0.42;
    const z = 1.16 + Math.sin(angle) * 0.34;
    const light = new T.Group();
    light.position.set(x, 0.06, z);
    root.add(light);
    kit.cone(light, 0.09, 0.06, [0, 0.03, 0], '#c0794f', 6, { shadow: false });
    kit.ball(light, 0.07, [0, 0.1, 0], '#ffd79a', { glow: 1.4, shadow: false });
    const glow = kit.halo(light, halo, [0, 0.1, 0], 0.62, '#ffce85', 0.75);
    riverLights.push({ group: light, halo: glow, phase: index * 1.7 });
  }

  // 萤火：几点飘着的暖光。
  const fireflies: Array<{ sprite: T.Sprite; base: T.Vector3; phase: number }> = [];
  for (let index = 0; index < 12; index++) {
    const angle = index * 2.3;
    const base = new T.Vector3(Math.cos(angle) * (0.9 + (index % 4) * 0.5), 0.6 + (index % 5) * 0.28, Math.sin(angle) * (0.8 + (index % 3) * 0.55));
    const sprite = kit.halo(root, halo, base.toArray() as [number, number, number], 0.16, '#ffe6a8', 0.5);
    fireflies.push({ sprite, base, phase: index * 0.9 });
  }

  for (const [x, z, seed] of [[-0.2, 1.86, 51], [2.06, 0.42, 52], [-2.24, 0.16, 53]] as const) {
    grass(kit, root, [x, 0.02, z], palette, seed);
  }

  return {
    group: root,
    tick(time, activity) {
      flag.tick(time, activity);
      steamGroup.tick(time, 0.6 + activity * 0.4);
      lanterns.forEach((item, index) => {
        if (!item.halo) return;
        const flicker = 0.55 + Math.sin(time * 4.3 + index * 2.1) * 0.12 + Math.sin(time * 11 + index) * 0.05;
        item.halo.material.opacity = flicker;
      });
      riverLights.forEach((light, index) => {
        light.group.position.y = 0.06 + Math.sin(time * 1.4 + light.phase) * 0.025;
        light.group.rotation.y = time * 0.25 + index;
        if (light.halo) light.halo.material.opacity = 0.6 + Math.sin(time * 3.2 + light.phase) * 0.15;
      });
      fireflies.forEach(firefly => {
        firefly.sprite.position.set(
          firefly.base.x + Math.sin(time * 0.7 + firefly.phase) * 0.24,
          firefly.base.y + Math.sin(time * 1.1 + firefly.phase * 1.7) * 0.18,
          firefly.base.z + Math.cos(time * 0.6 + firefly.phase) * 0.22,
        );
        firefly.sprite.material.opacity = 0.28 + Math.abs(Math.sin(time * 1.6 + firefly.phase)) * 0.42;
      });
    },
    dispose() {
      flag.dispose();
      roofTiles.dispose();
      paving.dispose();
      trees.dispose();
    },
  };
}
