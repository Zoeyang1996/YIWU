import * as T from 'three';
import { banner } from './banner';
import { house, bridge, shed } from './architecture';
import { basket, goods, grass, island, lantern, person, pool, steam, tree } from './props';
import type { BuildContext, Diorama } from './types';

/** 早市：一座茶楼、一棚热食、一道石桥，晨雾还没散。 */
export function buildMorning({ kit, palette, halo, steam: steamTexture }: BuildContext): Diorama {
  const root = new T.Group();
  island(kit, root, { radius: 3.15, palette, seed: 23, paving: 'slabs' });

  house(kit, root, [-0.95, 0, -1.5], { width: 1.5, depth: 1.12, height: 0.78, storeys: 2, palette, windowGlow: 0.18 });
  house(kit, root, [2.0, 0, -1.68], { width: 0.95, depth: 0.85, height: 0.62, palette, windowGlow: 0.14 });

  const stall = shed(kit, root, [1.05, 0, -0.42], { width: 1.72, depth: 1.14, height: 1.02, palette, cloth: palette.cloth });
  goods(kit, stall, [-0.42, 0.8, 0.06], palette, 'tea');
  goods(kit, stall, [0.32, 0.8, 0.06], palette, 'fruit');
  for (let index = 0; index < 3; index++) {
    const basketGroup = basket(kit, stall, [0.62, 0.8, -0.1 + index * 0.004], palette, 0.72 + index * 0.03);
    basketGroup.position.y = 0.8;
  }

  const stove = new T.Group();
  stove.position.set(1.5, 0, -0.16);
  root.add(stove);
  kit.round(stove, 0.26, 0.3, 0.34, [0, 0.17, 0], palette.stoneAlt, 10, { ink: true });
  kit.round(stove, 0.24, 0.24, 0.12, [0, 0.4, 0], palette.woodDark, 10, { ink: true });
  for (const y of [0.5, 0.62]) kit.round(stove, 0.2, 0.2, 0.1, [0, y, 0], palette.woodLight, 10, { ink: true });
  const steamGroup = steam(kit, steamTexture, 5);
  steamGroup.group.position.set(1.5, 0.56, -0.16);
  root.add(steamGroup.group);

  const poolGroup = pool(kit, root, [1.32, 0, 1.42], { radius: 0.72, palette, ripples: 3 });
  poolGroup.position.y = -0.01;
  for (const x of [-0.62, 0.62]) kit.box(root, [0.16, 0.2, 0.3], [1.32 + x, 0.1, 1.42], palette.stoneAlt, { ink: true });
  bridge(kit, root, [1.32, 0.02, 1.42], 1.5, palette);

  const teaStand = shed(kit, root, [-1.5, 0, 1.05], { width: 1.05, depth: 0.8, height: 0.86, palette, cloth: palette.accentAlt, counter: false });
  goods(kit, teaStand, [0, 0.72, 0.1], palette, 'fruit');
  basket(kit, teaStand, [-0.3, 0.72, 0.06], palette, 0.8);

  tree(kit, root, [-2.35, 0, 1.3], { palette, style: 'willow', scale: 0.98 });
  tree(kit, root, [2.45, 0, 0.55], { palette, style: 'round', scale: 0.72, blossom: palette.blossom });

  const flag = banner(kit, root, {
    character: '早',
    position: [-2.32, 0, -1.0],
    facing: 0.22,
    poleColor: palette.woodDark,
    bg: '#4d7a63',
    ink: '#f4efd9',
    border: '#cfb877',
    poleHeight: 3.6,
    width: 1.0,
    height: 2.15,
    seal: '#a94f38',
  });

  const lanterns = [
    lantern(kit, root, [0.22, 1.02, -0.34], { scale: 0.62, paper: '#f0c98c', cap: palette.woodDark, halo, glow: 0.25, haloSize: 1.1 }),
    lantern(kit, root, [1.86, 1.02, -0.34], { scale: 0.62, paper: '#f0c98c', cap: palette.woodDark, halo, glow: 0.25, haloSize: 1.1 }),
  ];
  lantern(kit, root, [-0.95, 1.5, -0.86], { scale: 0.5, paper: '#eec49a', cap: palette.woodDark, halo, glow: 0.2, haloSize: 0.9 });

  person(kit, root, [0.86, 0, -0.72], { palette, robe: palette.robe, hat: 'bun', facing: 0.06 });
  person(kit, root, [0.18, 0, 0.42], { palette, robe: palette.robeAlt, hat: 'straw', facing: 2.4 });
  person(kit, root, [-1.42, 0, 1.55], { palette, robe: '#9aa899', hat: 'bun', facing: 0.9, scale: 0.94 });
  person(kit, root, [1.92, 0, 0.95], { palette, robe: '#b0a48a', hat: 'straw', facing: -1.9, scale: 0.9 });

  for (const [x, z, seed] of [[-2.05, -0.15, 11], [0.45, 1.72, 12], [-0.6, -0.62, 13], [2.35, -0.6, 14], [-1.2, 0.25, 15]] as const) {
    grass(kit, root, [x, 0.02, z], palette, seed);
  }
  for (let moss = 0; moss < 6; moss++) {
    const angle = moss * 1.7;
    const patch = kit.rock(root, 0.2 + (moss % 3) * 0.05, [Math.cos(angle) * 2.5, 0.02, Math.sin(angle) * 2.3], palette.moss, { shadow: false });
    patch.scale.set(1.2, 0.1, 1.1);
    patch.rotation.y = angle;
  }

  return {
    group: root,
    tick(time, activity) {
      flag.tick(time, activity);
      steamGroup.tick(time, 0.55 + activity * 0.45);
      lanterns.forEach((item, index) => {
        if (!item.halo) return;
        const flicker = 0.42 + Math.sin(time * 3.1 + index * 1.7) * 0.1 + activity * 0.22;
        item.halo.material.opacity = flicker;
      });
    },
    dispose() {
      flag.dispose();
    },
  };
}
