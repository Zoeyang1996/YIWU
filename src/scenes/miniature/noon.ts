import * as T from 'three';
import { banner } from './banner';
import { counter, gateway, house, shed } from './architecture';
import { cart, crate, goods, grass, island, jar, lantern, person, tree } from './props';
import type { BuildContext, Diorama } from './types';

/** 午市：牌楼底下最热闹，布棚、货担、花树都晒得发亮。 */
export function buildNoon({ kit, palette, halo }: BuildContext): Diorama {
  const root = new T.Group();
  island(kit, root, { radius: 3.15, palette, seed: 41, paving: 'slabs' });

  gateway(kit, root, [0, 0, -0.95], { width: 2.45, height: 1.78, palette });
  house(kit, root, [-1.95, 0, -1.95], { width: 1.0, depth: 0.8, height: 0.68, palette, windowGlow: 0.1 });
  house(kit, root, [1.95, 0, -1.95], { width: 1.0, depth: 0.8, height: 0.68, palette, windowGlow: 0.1 });

  for (const x of [-0.36, 0.36]) kit.box(root, [0.72, 0.07, 0.22], [x, 0.035, -0.18], palette.stoneAlt, { shadow: false });

  const clothStall = shed(kit, root, [-1.02, 0, 0.72], { width: 1.5, depth: 1.05, height: 1.02, palette, cloth: palette.cloth });
  goods(kit, clothStall, [-0.34, 0.82, 0.08], palette, 'cloth');
  goods(kit, clothStall, [0.24, 0.82, 0.08], palette, 'cloth');
  goods(kit, clothStall, [0.6, 0.82, -0.06], palette, 'toys');
  kit.box(clothStall, [0.44, 0.12, 0.3], [-0.5, 0.82, -0.2], palette.woodLight, { ink: true });

  const fruitStall = shed(kit, root, [1.15, 0, 0.78], { width: 1.4, depth: 1.0, height: 0.96, palette, cloth: palette.clothAlt });
  counter(kit, fruitStall, [0, 0, 0.06], { palette, width: 1.2, depth: 0.5, height: 0.6 });
  for (let index = 0; index < 3; index++) {
    goods(kit, fruitStall, [-0.34 + index * 0.34, 0.67, 0.06], palette, 'fruit');
  }
  jar(kit, root, [1.98, 0, 0.24], palette, palette.accent);
  jar(kit, root, [1.78, 0, 0.42], palette, palette.woodLight);

  cart(kit, root, [-2.18, 0, 0.32], palette);
  const cartTurn = root.children[root.children.length - 1];
  cartTurn.rotation.y = 1.35;
  crate(kit, root, [-2.32, 0, -0.42], palette, 0.36);
  crate(kit, root, [-2.06, 0, -0.56], palette, 0.3);

  tree(kit, root, [2.36, 0, 1.42], { palette, style: 'round', scale: 0.82, blossom: palette.blossom });
  tree(kit, root, [-2.42, 0, 1.72], { palette, style: 'pine', scale: 0.62 });

  const flag = banner(kit, root, {
    character: '午',
    position: [2.42, 0, -0.98],
    facing: -0.28,
    poleColor: palette.woodDark,
    bg: '#b8492f',
    ink: '#f7e6b6',
    border: '#e6c477',
    poleHeight: 3.65,
    width: 1.02,
    height: 2.2,
    seal: '#f2d79a',
  });

  const lanterns = [
    lantern(kit, root, [-0.42, 1.42, -0.88], { scale: 0.6, paper: '#e9a35e', cap: palette.woodDark, halo, glow: 0.18, haloSize: 1.05 }),
    lantern(kit, root, [0.42, 1.42, -0.88], { scale: 0.6, paper: '#e9a35e', cap: palette.woodDark, halo, glow: 0.18, haloSize: 1.05 }),
    lantern(kit, root, [-1.86, 1.08, 0.72], { scale: 0.52, paper: '#e7a866', cap: palette.woodDark, halo, glow: 0.16, haloSize: 0.95 }),
    lantern(kit, root, [0.62, 1.02, 0.78], { scale: 0.5, paper: '#e7a866', cap: palette.woodDark, halo, glow: 0.16, haloSize: 0.95 }),
  ];

  person(kit, root, [-0.62, 0, -0.24], { palette, robe: palette.robe, hat: 'bun', facing: 0.4 });
  person(kit, root, [0.5, 0, 0.24], { palette, robe: palette.robeAlt, hat: 'straw', facing: -2.6 });
  person(kit, root, [-0.9, 0, 1.62], { palette, robe: '#8d7f6d', hat: 'bun', facing: 2.9, arms: 'front' });
  person(kit, root, [1.62, 0, 0.06], { palette, robe: '#9c8f79', hat: 'straw', facing: -1.2 });
  person(kit, root, [-2.02, 0, 0.86], { palette, robe: palette.robeAlt, hat: 'bun', facing: 1.1, scale: 0.92 });

  for (const [x, z, seed] of [[-2.5, -0.2, 31], [0.02, 1.86, 32], [1.62, 1.86, 33], [-1.62, -1.2, 34]] as const) {
    grass(kit, root, [x, 0.02, z], palette, seed);
  }

  return {
    group: root,
    tick(time, activity) {
      flag.tick(time, activity);
      lanterns.forEach((item, index) => {
        if (!item.halo) return;
        item.halo.material.opacity = 0.3 + Math.sin(time * 2.6 + index) * 0.08 + activity * 0.14;
      });
    },
    dispose() {
      flag.dispose();
    },
  };
}
