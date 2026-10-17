import * as T from 'three';

/** 墨线颜色：比纯黑更柔，贴纸面。 */
export const INK = '#2b2620';
/** 三渲二的阶梯光照：少阶最像手绘。 */
export function createRamp() {
  const steps = [86, 140, 194, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((value, index) => {
    data[index * 4] = value;
    data[index * 4 + 1] = value;
    data[index * 4 + 2] = value;
    data[index * 4 + 3] = 255;
  });
  const texture = new T.DataTexture(data, steps.length, 1, T.RGBAFormat);
  texture.minFilter = T.NearestFilter;
  texture.magFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** 低模硬边：把索引几何体拆开重算法线，得到干净的多面转折。 */
export function flatten(geometry: T.BufferGeometry) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  flat.computeVertexNormals();
  return flat;
}

/** 径向渐变贴图，用于光晕、蒸汽与地面投影。 */
export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

/** 颜色插值：把三个时辰的配色当作关键帧。 */
export function mixColor(from: T.Color, to: T.Color, t: number, target = new T.Color()) {
  return target.copy(from).lerp(to, T.MathUtils.clamp(t, 0, 1));
}

export function hex(value: number) {
  return `#${value.toString(16).padStart(6, '0')}`;
}
