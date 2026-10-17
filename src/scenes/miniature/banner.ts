import * as T from 'three';
import type { Kit, Vec3 } from '../toon/Kit';

export interface BannerOptions {
  /** 只写一个字：早、午、夜。 */
  character: string;
  position: Vec3;
  poleColor: string;
  bg: string;
  ink: string;
  border: string;
  /** 旗面朝向，绕 y 轴。 */
  facing?: number;
  poleHeight?: number;
  width?: number;
  height?: number;
  seal?: string;
  /** 夜里让幡自己带一点光，不然深色旗面会陷进夜色里。 */
  emissive?: string;
}

/** 一个字的幡面：色底、描边、大字，留白干净。 */
function bannerCanvas(options: BannerOptions) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = options.bg;
  ctx.fillRect(0, 0, 320, 640);

  ctx.strokeStyle = options.border;
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 280, 600);
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(42, 42, 236, 556);
  ctx.globalAlpha = 1;

  // 幡头幡脚：两条压边，像真的布幡。
  ctx.fillStyle = options.border;
  ctx.fillRect(20, 20, 280, 34);
  ctx.fillRect(20, 586, 280, 34);

  ctx.fillStyle = options.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 250px "STKaiti", "KaiTi", "Kaiti SC", "SimSun", serif';
  ctx.fillText(options.character, 160, 330, 232);

  if (options.seal) {
    ctx.fillStyle = options.seal;
    ctx.fillRect(130, 500, 60, 60);
  }

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** 长长的旗杆 + 很大的幡 + 一点飘动。 */
export function banner(kit: Kit, parent: T.Object3D, options: BannerOptions) {
  const group = new T.Group();
  group.position.fromArray(options.position);
  group.rotation.y = options.facing ?? 0;
  parent.add(group);

  const poleHeight = options.poleHeight ?? 3.5;
  const width = options.width ?? 0.98;
  const height = options.height ?? 2.1;

  kit.round(group, 0.1, 0.14, 0.2, [0, 0.1, 0], options.poleColor, 8, { ink: true });
  kit.round(group, 0.045, 0.06, poleHeight, [0, poleHeight / 2, 0], options.poleColor, 8, { ink: true });
  kit.ball(group, 0.075, [0, poleHeight + 0.04, 0], options.border, { glow: 0.25, ink: true });
  // 横杆与系绳：幡挂在杆侧，不再往画面里加字。
  const barY = poleHeight - 0.22;
  kit.beam(group, [0, barY, 0], [width * 0.86, barY, 0], 0.025, options.poleColor, { shadow: false });
  kit.beam(group, [0, barY - 0.5, 0], [width * 0.86, barY, 0], 0.012, options.border, { shadow: false });

  const geometry = new T.PlaneGeometry(width, height, 10, 16);
  const texture = bannerCanvas(options);
  const material = new T.MeshToonMaterial({ map: texture, gradientMap: kit.ramp, side: T.DoubleSide, transparent: true, emissive: options.emissive ?? '#000000', emissiveIntensity: options.emissive ? 0.3 : 0 });
  const cloth = new T.Mesh(geometry, material);
  cloth.position.set(width * 0.44, barY - height / 2 - 0.04, 0);
  cloth.castShadow = true;
  cloth.receiveShadow = false;
  group.add(cloth);

  // 上下两根杆把布面夹住，边缘才不会像一张纸。
  kit.round(group, 0.02, 0.02, width * 0.88, [width * 0.44, barY - 0.03, 0], options.poleColor, 6, { rot: [0, 0, Math.PI / 2], shadow: false });
  kit.round(group, 0.018, 0.018, width * 0.86, [width * 0.44, barY - height - 0.03, 0], options.poleColor, 6, { rot: [0, 0, Math.PI / 2], shadow: false });

  const base = Float32Array.from(geometry.attributes.position.array as Float32Array);
  const half = height / 2;
  return {
    group,
    cloth,
    tick(time: number, activity: number) {
      const position = geometry.attributes.position;
      for (let vertex = 0; vertex < position.count; vertex++) {
        const x = base[vertex * 3];
        const y = base[vertex * 3 + 1];
        const hang = (half - y) / height;
        const wave = hang * hang;
        position.setZ(vertex, Math.sin(time * 2.1 + x * 3.4 + hang * 2.2) * 0.12 * wave + Math.sin(time * 3.7 + hang * 5) * 0.03 * wave);
        position.setX(vertex, x + Math.sin(time * 1.3 + hang * 3.2) * 0.05 * wave);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      if (options.emissive) material.emissiveIntensity = 0.26 + activity * 0.14;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
