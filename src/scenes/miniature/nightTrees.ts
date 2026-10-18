import * as T from 'three';
import type { Kit } from '../toon/Kit';
import { seeded } from './props';

/** 夜市样板专用植被：连续弯曲枝干与实例叶片，不使用球冠或锥形树冠。 */
export function nightTrees(kit: Kit, parent: T.Object3D) {
  const random = seeded(1710);
  const instances: T.InstancedMesh[] = [];
  let branchId = 0;
  function branch(group: T.Object3D, points: T.Vector3[], radius: number) {
    const curve = new T.CatmullRomCurve3(points);
    const geometry = kit.own(`night-branch-${branchId++}`, new T.TubeGeometry(curve, 10, radius, 7, false));
    kit.mesh(group, geometry, '#685442', [0, 0, 0]);
    return curve;
  }
  function foliage(group: T.Object3D, placements: T.Object3D[], width: number, length: number, name: string) {
    // 带中脊的尖叶，侧视也有厚度变化；共用几何与材质。
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute([
      0, 0, 0, -width / 2, length * .45, 0, 0, length * .5, width * .18,
      0, 0, 0, 0, length * .5, width * .18, width / 2, length * .45, 0,
      -width / 2, length * .45, 0, 0, length, 0, 0, length * .5, width * .18,
      0, length * .5, width * .18, 0, length, 0, width / 2, length * .45, 0,
    ], 3));
    geometry.computeVertexNormals();
    const mesh = new T.InstancedMesh(kit.own(name, geometry), kit.mat('#ffffff', 0, 1, true), placements.length);
    placements.forEach((placement, index) => {
      placement.updateMatrix();
      mesh.setMatrixAt(index, placement.matrix);
      mesh.setColorAt(index, new T.Color(['#657a48', '#89965c', '#506747', '#758657'][index % 4]));
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    instances.push(mesh);
  }
  const willow = new T.Group();
  willow.position.set(2.32, 0, 1.06);
  parent.add(willow);
  branch(willow, [new T.Vector3(0, 0, 0), new T.Vector3(-.08, .65, .04), new T.Vector3(.06, 1.3, -.06), new T.Vector3(-.06, 1.8, 0)], .065);
  const willowLeaves: T.Object3D[] = [];
  for (let limb = 0; limb < 7; limb++) {
    const angle = limb * 2.399;
    const tip = new T.Vector3(Math.cos(angle) * .47, 1.58 + random() * .25, Math.sin(angle) * .47);
    branch(willow, [new T.Vector3(0, .9 + random() * .35, 0), tip.clone().multiply(new T.Vector3(.55, 1, .55)), tip], .018);
    for (let strand = 0; strand < 5; strand++) {
      const spread = angle + (strand - 2) * .26;
      const end = new T.Vector3(Math.cos(spread) * (.52 + random() * .22), .25 + random() * .45, Math.sin(spread) * (.52 + random() * .22));
      const curve = branch(willow, [tip, new T.Vector3(end.x * 1.05, 1.35 + random() * .18, end.z * 1.05), end], .0035);
      for (let leaf = 0; leaf < 30; leaf++) {
        const t = .08 + leaf / 34;
        const position = curve.getPoint(t);
        const instance = new T.Object3D();
        instance.position.copy(position);
        instance.rotation.set(Math.PI + (random() - .5) * .5, spread + leaf * 2.4, (leaf % 2 ? 1 : -1) * .45);
        instance.scale.setScalar(.65 + random() * .65);
        willowLeaves.push(instance);
      }
    }
  }
  foliage(willow, willowLeaves, .035, .17, 'night-willow-leaf');

  const pine = new T.Group();
  pine.position.set(-2.5, 0, -1.72);
  parent.add(pine);
  branch(pine, [new T.Vector3(), new T.Vector3(.12, .5, .04), new T.Vector3(-.06, 1.05, 0), new T.Vector3(.16, 1.65, -.03)], .065);
  const needles: T.Object3D[] = [];
  for (let limb = 0; limb < 9; limb++) {
    const angle = limb * 2.399;
    const height = .6 + limb * .115;
    const reach = .53 - limb * .025;
    const tip = new T.Vector3(Math.cos(angle) * reach, height + .13, Math.sin(angle) * reach);
    branch(pine, [new T.Vector3(0, height, 0), new T.Vector3(tip.x * .6, height - .04, tip.z * .6), tip], .016);
    for (let cluster = 0; cluster < 8; cluster++) {
      const center = tip.clone().add(new T.Vector3((random() - .5) * .4, (random() - .5) * .12, (random() - .5) * .4));
      for (let needle = 0; needle < 24; needle++) {
        const instance = new T.Object3D();
        instance.position.copy(center);
        instance.rotation.set(random() * 1.8 - .9, random() * Math.PI * 2, random() * 2 - 1);
        instance.scale.setScalar(.6 + random() * .8);
        needles.push(instance);
      }
    }
  }
  foliage(pine, needles, .009, .14, 'night-pine-needle');
  return { dispose() { instances.forEach(mesh => mesh.dispose()); } };
}
