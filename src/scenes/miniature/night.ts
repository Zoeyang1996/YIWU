import * as T from 'three';
import { banner } from './banner';
import { bridge, gateway, house, shed } from './architecture';
import { goods, grass, island, lantern, person, pool, steam, tree } from './props';
import type { BuildContext, Diorama } from './types';

/** 夜市：灯铺、食棚、一排河灯，月光把瓦顶压成墨色。 */
export function buildNight({ kit, palette, halo, steam: steamTexture }: BuildContext): Diorama {
  const root = new T.Group();
  island(kit, root, { radius: 3.15, palette, seed: 67, paving: 'slabs' });

  house(kit, root, [-1.42, 0, -1.55], { width: 1.32, depth: 1.0, height: 0.74, storeys: 2, palette, windowGlow: 0.95 });
  gateway(kit, root, [1.52, 0, -1.32], { width: 1.62, height: 1.4, palette });

  const foodStall = shed(kit, root, [0.92, 0, 0.58], { width: 1.52, depth: 1.06, height: 0.98, palette, cloth: '#6d4049' });
  goods(kit, foodStall, [-0.36, 0.8, 0.06], palette, 'tea');
  goods(kit, foodStall, [0.26, 0.8, 0.06], palette, 'fruit');
  const steamGroup = steam(kit, steamTexture, 5);
  steamGroup.group.position.set(0.86, 0.86, 0.42);
  root.add(steamGroup.group);

  const waterGroup = pool(kit, root, [-1.42, 0, 1.16], { radius: 0.8, palette, ripples: 2 });
  waterGroup.position.y = -0.01;
  for (const x of [-0.68, 0.68]) kit.box(root, [0.16, 0.2, 0.3], [-1.42 + x, 0.1, 1.16], palette.stoneAlt, { ink: true });
  bridge(kit, root, [-1.42, 0.02, 1.16], 1.62, palette);

  tree(kit, root, [2.32, 0, 1.06], { palette, style: 'willow', scale: 0.86 });
  tree(kit, root, [-2.5, 0, -1.72], { palette, style: 'pine', scale: 0.62 });

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

  person(kit, root, [-0.62, 0, -0.72], { palette, robe: '#5d6b62', hat: 'bun', facing: 0.5 });
  person(kit, root, [0.28, 0, 0.12], { palette, robe: '#6f7d63', hat: 'bun', facing: -2.2, scale: 0.96 });
  person(kit, root, [1.06, 0, 1.62], { palette, robe: '#7a6a58', hat: 'straw', facing: -2.8, arms: 'front' });
  person(kit, root, [-2.02, 0, 1.72], { palette, robe: '#4f5f68', hat: 'bun', facing: 1.2, scale: 0.92 });

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
    },
  };
}
