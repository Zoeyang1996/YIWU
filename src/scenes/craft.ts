import * as T from 'three';
import type { ProductKind } from '../data/catalog';
export class Craft {
  geometries = new Map<string, T.BufferGeometry>();
  materials = new Map<string, T.MeshStandardMaterial>();
  textures: T.Texture[] = [];
  mat(color: string, glow = false) {
    const key = color + glow;
    if (!this.materials.has(key)) this.materials.set(key, new T.MeshStandardMaterial({ color, roughness: .87, flatShading: true, emissive: glow ? color : '#000000', emissiveIntensity: glow ? .25 : 0 }));
    return this.materials.get(key)!;
  }
  mesh(parent: T.Object3D, geo: T.BufferGeometry, color: string, pos: number[], glow = false) {
    const m = new T.Mesh(geo, this.mat(color, glow)); m.position.set(pos[0], pos[1], pos[2]); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  geometry(key: string, make: () => T.BufferGeometry) { if (!this.geometries.has(key)) this.geometries.set(key, make()); return this.geometries.get(key)!; }
  box(p: T.Object3D, size: number[], pos: number[], color: string) { return this.mesh(p, this.geometry(`b${size}`, () => new T.BoxGeometry(...size as [number, number, number])), color, pos); }
  ball(p: T.Object3D, size: number[], pos: number[], color: string, glow = false) { const m = this.mesh(p, this.geometry('sphere', () => new T.SphereGeometry(1, 12, 8)), color, pos, glow); m.scale.set(...size as [number, number, number]); return m; }
  cylinder(p: T.Object3D, top: number, bottom: number, height: number, pos: number[], color: string, sides = 12) { return this.mesh(p, this.geometry(`c${top},${bottom},${height},${sides}`, () => new T.CylinderGeometry(top, bottom, height, sides)), color, pos); }
  beam(p: T.Object3D, a: number[], b: number[], width: number, color: string) { const start = new T.Vector3(...a as [number, number, number]); const end = new T.Vector3(...b as [number, number, number]); const v = end.clone().sub(start); const m = this.cylinder(p, width, width, v.length(), start.add(end).multiplyScalar(.5).toArray(), color, 7); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize()); return m; }
  sign(p: T.Object3D, text: string, pos: number[], width = 2, height = .65, bg = '#3e554b', ink = '#eed9a8') {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 160); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(10, 10, 492, 140); ctx.font = 'bold 70px "STKaiti", "KaiTi", "SimSun", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink; ctx.fillText(text, 256, 83, 465);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; this.textures.push(texture);
    const mat = new T.MeshStandardMaterial({ map: texture, roughness: 1 }); this.materials.set('sign' + this.materials.size, mat);
    const m = new T.Mesh(this.geometry(`sign${width},${height}`, () => new T.BoxGeometry(width, height, .08)), mat); m.position.set(...pos as [number, number, number]); p.add(m); return m;
  }
  roof(p: T.Object3D, w: number, d: number, y: number, color: string) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const t = i / 6; const t2 = (i + 1) / 6;
        const h = (u: number) => y + .9 * (1 - u) ** 2 + .18 * u ** 8;
        const z1 = side * t * d / 2, z2 = side * t2 * d / 2;
        const strip = this.box(p, [w + t * .35, .12, Math.hypot(z2 - z1, h(t2) - h(t)) + .045], [0, (h(t) + h(t2)) / 2, (z1 + z2) / 2], color);
        strip.rotation.x = -Math.atan2(h(t2) - h(t), z2 - z1);
      }
      for (let x = -w / 2; x <= w / 2; x += .32) this.beam(p, [x, y + .2, side * d / 2], [x, y + .35, side * d * .36], .045, '#657d70');
    }
    this.beam(p, [-w / 2 - .25, y + .92, 0], [w / 2 + .25, y + .92, 0], .105, '#6e8271');
    for (const side of [-1, 1]) this.beam(p, [side * w / 2, y + .92, 0], [side * (w / 2 + .4), y + 1.12, 0], .09, '#6e8271');
  }
  lantern(p: T.Object3D, pos: number[], scale = 1, color = '#d98545') {
    const g = new T.Group(); g.position.set(...pos as [number, number, number]); g.scale.setScalar(scale); p.add(g);
    this.ball(g, [.28, .36, .28], [0, 0, 0], color, true);
    for (const y of [-.34, .34]) this.cylinder(g, .16, .16, .07, [0, y, 0], '#8f6139');
    this.beam(g, [0, .38, 0], [0, .7, 0], .018, '#6c5340'); this.beam(g, [0, -.38, 0], [0, -.65, 0], .03, '#c27738'); return g;
  }
  person(kind: string, color: string) {
    const g = new T.Group(); this.cylinder(g, .2, .34, .66, [0, .57, 0], color);
    this.ball(g, [.29, .29, .27], [0, 1.13, 0], kind === 'frog' ? '#83a46f' : kind === 'cat' ? '#d3b998' : kind === 'food' ? '#93a68a' : '#eccb99');
    for (const x of [-.13, .13]) { this.box(g, [.14, .24, .23], [x, .14, .06], '#4c5147'); if (kind !== 'frog') this.ball(g, [.035, .045, .025], [x * .8, 1.16, .257], '#343b35'); }
    for (const x of [-.3, .3]) { const arm = this.ball(g, [.09, .23, .09], [x, .7, .05], color); if (x > 0) g.userData.waveArm = arm; }
    if (kind === 'frog') for (const x of [-.19, .19]) { this.ball(g, [.14, .15, .13], [x, 1.36, .05], '#83a46f'); this.ball(g, [.067, .08, .035], [x, 1.38, .164], '#fbebc8'); this.ball(g, [.028, .04, .015], [x, 1.38, .193], '#303e30'); }
    else if (kind === 'cat' || kind === 'food') for (const x of [-.22, .22]) this.cylinder(g, 0, .12, .26, [x, 1.42, 0], kind === 'cat' ? '#d3b998' : '#e1ca8f', 4);
    else { this.ball(g, [.3, .14, .28], [0, 1.34, -.03], '#44443b'); if (kind === 'lantern') this.lantern(g, [0, 1.55, 0], .35); }
    if (kind === 'player') { this.box(g, [.38, .41, .16], [0, .66, -.24], '#ad6a40'); this.cylinder(g, .04, .45, .15, [0, 1.49, 0], '#d9b873'); }
    return g;
  }
  product(kind: ProductKind, color = '#b46148') {
    const g = new T.Group();
    if (kind === 'drum') { this.cylinder(g, .06, .06, 1.15, [0, -.3, 0], '#ad7c4f'); const drum = this.cylinder(g, .48, .48, .25, [0, .4, 0], color, 32); drum.rotation.x = Math.PI / 2; for (const z of [-.135, .135]) { const face = this.cylinder(g, .42, .42, .02, [0, .4, z], '#eed9a5', 32); face.rotation.x = Math.PI / 2; } for (const x of [-.7, .7]) { this.beam(g, [x / 1.5, .4, 0], [x, .15, 0], .017, '#8c613d'); this.ball(g, [.07, .07, .07], [x, .15, 0], color); } this.sign(g, '福', [0, .4, .153], .28, .28, '#eed9a5', color); }
    if (kind === 'frog') { this.ball(g, [.65, .34, .5], [0, 0, 0], color); for (const x of [-.35, .35]) { this.ball(g, [.24, .2, .48], [x, -.2, .1], color); this.ball(g, [.2, .21, .2], [x, .34, .26], color); this.ball(g, [.12, .12, .055], [x, .36, .43], '#efe7ce'); this.ball(g, [.055, .07, .03], [x, .36, .48], '#344d36'); } this.box(g, [.1, .2, .1], [0, .4, -.24], '#bc9850'); this.box(g, [.45, .09, .07], [0, .51, -.24], '#bc9850'); }
    if (kind === 'lantern') { const l = this.lantern(g, [0, 0, 0], 1.75, color); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.beam(l, [Math.sin(a) * .16, .32, Math.cos(a) * .16], [Math.sin(a) * .29, 0, Math.cos(a) * .29], .012, '#edc783'); this.beam(l, [Math.sin(a) * .29, 0, Math.cos(a) * .29], [Math.sin(a) * .16, -.32, Math.cos(a) * .16], .012, '#edc783'); } }
    if (kind === 'rabbit') { this.ball(g, [.5, .4, .43], [0, -.2, 0], '#f0ddb1', true); this.ball(g, [.36, .34, .32], [0, .24, .13], '#f4e5c5', true); for (const x of [-.18, .18]) { const ear = this.ball(g, [.1, .4, .11], [x, .72, .08], '#f4e5c5', true); ear.rotation.z = -x; this.ball(g, [.035, .045, .022], [x * .8, .29, .421], '#584538'); } this.ball(g, [.14, .14, .14], [.42, -.15, -.27], '#f4e5c5'); }
    if (kind === 'book') { this.box(g, [.84, .13, 1.15], [0, 0, 0], '#dfd0ae'); for (const y of [-.09, .09]) this.box(g, [.9, .035, 1.2], [0, y, 0], color); for (let z = -.45; z < .5; z += .2) this.beam(g, [-.36, -.1, z], [-.36, .13, z], .015, '#e2c88e'); const label = this.sign(g, '百物志', [.1, .115, -.18], .42, .55, '#e8d8b6', '#425950'); label.rotation.x = -Math.PI / 2; g.rotation.x = .35; }
    if (kind === 'tea') { this.cylinder(g, .22, .28, .1, [0, -.35, 0], color); this.cylinder(g, .58, .26, .55, [0, -.03, 0], color, 32); this.cylinder(g, .54, .54, .02, [0, .255, 0], '#c9d3b4', 32); this.cylinder(g, .46, .46, .025, [0, .27, 0], '#8d7047', 32); }
    return g;
  }
  dispose() { this.geometries.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()); }
}
