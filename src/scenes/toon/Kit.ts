import * as T from 'three';
import { INK, flatten } from './toon';

export type Vec3 = [number, number, number];

export interface Shape {
  /** 是否描墨线（三渲二的黑色勾边）。 */
  ink?: boolean;
  inkScale?: number;
  /** 自发光强度，灯笼与窗纸用。 */
  glow?: number;
  opacity?: number;
  rot?: Vec3;
  scale?: Vec3 | number;
  /** 细小零件可关掉投影，省一点阴影开销。 */
  shadow?: boolean;
  /** 双面材质，屋面与布片用。 */
  double?: boolean;
}

/** 三渲二微缩模型的积木：统一的材质、勾边与低模几何。 */
export class Kit {
  readonly materials = new Map<string, T.MeshToonMaterial>();
  private readonly geometries = new Map<string, T.BufferGeometry>();
  private readonly outlines = new Map<string, T.BufferGeometry>();
  private readonly inkMaterial: T.MeshBasicMaterial;

  constructor(readonly ramp: T.DataTexture) {
    this.inkMaterial = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
  }

  mat(color: string, glow = 0, opacity = 1, double = false) {
    const key = `${color}|${glow}|${opacity}|${double}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new T.MeshToonMaterial({
        color,
        gradientMap: this.ramp,
        emissive: glow > 0 ? color : '#000000',
        emissiveIntensity: glow,
        transparent: opacity < 1,
        opacity,
        side: double ? T.DoubleSide : T.FrontSide,
      });
      this.materials.set(key, material);
    }
    return material;
  }

  geo(key: string, build: () => T.BufferGeometry) {
    let geometry = this.geometries.get(key);
    if (!geometry) {
      geometry = flatten(build());
      this.geometries.set(key, geometry);
    }
    return geometry;
  }

  /** 接管一条自造几何体，统一在 dispose 时释放。 */
  own(key: string, geometry: T.BufferGeometry) {
    const existing = this.geometries.get(key);
    if (existing) {
      geometry.dispose();
      return existing;
    }
    this.geometries.set(key, geometry);
    return geometry;
  }

  mesh(parent: T.Object3D, geometry: T.BufferGeometry, color: string, position: Vec3, shape: Shape = {}) {
    const mesh = new T.Mesh(geometry, this.mat(color, shape.glow ?? 0, shape.opacity ?? 1, shape.double ?? false));
    mesh.position.fromArray(position);
    if (shape.rot) mesh.rotation.fromArray(shape.rot);
    if (shape.scale !== undefined) {
      if (typeof shape.scale === 'number') mesh.scale.setScalar(shape.scale);
      else mesh.scale.fromArray(shape.scale);
    }
    const shadows = shape.shadow ?? true;
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    parent.add(mesh);
    if (shape.ink) this.ink(mesh, shape.inkScale ?? 1.05);
    return mesh;
  }

  /** 反向外壳勾边：沿法线把外壳撑开一个固定厚度，才像毛笔描出的墨线。 */
  private ink(mesh: T.Mesh, scale: number) {
    const outline = new T.Mesh(this.outlineGeometry(mesh.geometry, scale), this.inkMaterial);
    outline.castShadow = false;
    outline.receiveShadow = false;
    mesh.add(outline);
    return outline;
  }

  private outlineGeometry(geometry: T.BufferGeometry, scale: number) {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius ?? 0.5;
    const key = `${geometry.uuid}|${scale}`;
    const cached = this.outlines.get(key);
    if (cached) return cached;

    // inkScale 现在按「相对粗细」理解（1.02 为常规）；绝对厚度跟着物体半径走，线条才匀。
    const weight = scale / 1.02;
    const thickness = T.MathUtils.clamp(radius * 0.085 * weight, 0.02, 0.075);
    const source = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const position = source.getAttribute('position');
    const normal = source.getAttribute('normal');
    const array = Float32Array.from(position.array as Float32Array);
    for (let vertex = 0; vertex < position.count; vertex++) {
      array[vertex * 3] += normal.getX(vertex) * thickness;
      array[vertex * 3 + 1] += normal.getY(vertex) * thickness;
      array[vertex * 3 + 2] += normal.getZ(vertex) * thickness;
    }
    source.setAttribute('position', new T.Float32BufferAttribute(array, 3));
    this.outlines.set(key, source);
    return source;
  }

  box(parent: T.Object3D, size: Vec3, position: Vec3, color: string, shape: Shape = {}) {
    return this.mesh(parent, this.geo(`box${size.join(',')}`, () => new T.BoxGeometry(...size)), color, position, shape);
  }

  round(parent: T.Object3D, top: number, bottom: number, height: number, position: Vec3, color: string, sides = 10, shape: Shape = {}) {
    return this.mesh(parent, this.geo(`cyl${top},${bottom},${height},${sides}`, () => new T.CylinderGeometry(top, bottom, height, sides)), color, position, shape);
  }

  ball(parent: T.Object3D, radius: number, position: Vec3, color: string, shape: Shape = {}) {
    return this.mesh(parent, this.geo(`sph${radius}`, () => new T.SphereGeometry(radius, 10, 7)), color, position, shape);
  }

  rock(parent: T.Object3D, radius: number, position: Vec3, color: string, shape: Shape = {}) {
    return this.mesh(parent, this.geo(`ico${radius}`, () => new T.IcosahedronGeometry(radius, 0)), color, position, shape);
  }

  cone(parent: T.Object3D, radius: number, height: number, position: Vec3, color: string, sides = 8, shape: Shape = {}) {
    return this.mesh(parent, this.geo(`cone${radius},${height},${sides}`, () => new T.ConeGeometry(radius, height, sides)), color, position, shape);
  }

  /** 两点之间的细杆：竹竿、绳索、栏杆。 */
  beam(parent: T.Object3D, from: Vec3, to: Vec3, width: number, color: string, shape: Shape = {}) {
    const start = new T.Vector3().fromArray(from);
    const end = new T.Vector3().fromArray(to);
    const offset = end.clone().sub(start);
    const length = offset.length();
    const middle = start.clone().add(end).multiplyScalar(0.5).toArray() as Vec3;
    const mesh = this.mesh(parent, this.geo(`rod${width},${length.toFixed(3)},6`, () => new T.CylinderGeometry(width, width, length, 6)), color, middle, shape);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), offset.normalize());
    return mesh;
  }

  /** 面向镜头的光晕面片：灯笼、香火、星点。 */
  halo(parent: T.Object3D, texture: T.Texture, position: Vec3, size: number, color: string, opacity = 0.8) {
    const material = new T.SpriteMaterial({ map: texture, color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending });
    const sprite = new T.Sprite(material);
    sprite.position.fromArray(position);
    sprite.scale.setScalar(size);
    parent.add(sprite);
    return sprite;
  }

  dispose() {
    this.geometries.forEach(geometry => geometry.dispose());
    this.outlines.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());
    this.inkMaterial.dispose();
  }
}
