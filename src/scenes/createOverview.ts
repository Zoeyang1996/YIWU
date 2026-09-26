import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Craft } from './craft';
import { animationStep } from './motion';
import { stalls, markets, products, type Market, type Stall } from '../data/catalog';
interface Options { onError: () => void; onStall: (id: string) => void; onTime: (market: Market) => void; onApproach: (name: string) => void; onProduct: (id: string) => void }
export function createOverview(host: HTMLElement, options: Options) {
  const scene = new T.Scene(), craft = new Craft();
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  host.append(renderer.domElement); renderer.domElement.setAttribute('aria-label', '义乌三时市集，可点击摊位或地面，使用方向键行走');
  const camera = new T.OrthographicCamera(-18, 18, 13, -13, .1, 160);
  const hemi = new T.HemisphereLight('#fff3d5', '#78877a', 2.3); scene.add(hemi);
  const sun = new T.DirectionalLight('#ffe3b1', 3.4); sun.position.set(-12, 22, 13); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 }); sun.shadow.bias = -.001; sun.shadow.normalBias = .05; scene.add(sun);
  const stallLights = stalls.map(s => { const light = new T.PointLight('#ffb75d', 0, 8, 2); light.position.set(s.x, 2.6, -.9); scene.add(light); return light; });
  const fill = new T.DirectionalLight('#9bbacb', .8); fill.position.set(8, 8, -12); scene.add(fill);
  const world = new T.Group(); scene.add(world);
  const ground = craft.box(world, [26, .65, 17], [0, -.42, -.2], '#b6b495'); ground.castShadow = false;
  craft.box(world, [26.25, .18, 17.25], [0, -.1, -.2], '#d5cdb0'); craft.box(world, [24.9, .045, 5.1], [0, .02, 2], '#c0b79a');
  for (let x = -12; x <= 12; x += 1.2) for (let z = -.3; z < 4.5; z += .85) { const tile = craft.box(world, [1.14, .04, .79], [x + (Math.round(z / .85) % 2) * .12, .045, z], Math.round(x * 10 + z * 20) % 3 ? '#d1c8ab' : '#c6bd9f'); tile.castShadow = false; }
  for (let x = -12.5; x < 13; x += .7) for (const z of [-8.65, 8.35]) craft.box(world, [.65, .24, .35], [x, .02, z], '#bebba1');
  function building(x: number, z: number, w: number, h: number) {
    const g = new T.Group(); g.position.set(x, 0, z); world.add(g); craft.box(g, [w, h, 2.4], [0, h / 2, 0], '#d9c5a2');
    for (const y of [.22, h * .57, h - .1]) craft.box(g, [w + .08, .13, 2.48], [0, y, 0], '#765e46');
    for (const xx of [-w / 2 + .1, 0, w / 2 - .1]) craft.box(g, [.15, h, 2.48], [xx, h / 2, 0], '#79634c');
    for (const xx of [-w * .26, w * .26]) { craft.box(g, [w * .27, 1.25, .1], [xx, h * .61, 1.26], '#57685b'); for (let dx = -.4; dx <= .4; dx += .2) craft.box(g, [.035, 1.2, .12], [xx + dx, h * .61, 1.33], '#b5986b'); for (const dy of [-.35, 0, .35]) craft.box(g, [w * .27, .04, .12], [xx, h * .61 + dy, 1.33], '#b5986b'); }
    craft.roof(g, w + .65, 3.1, h, '#4d6d64'); return g;
  }
  building(-8.5, -6.5, 5.8, 4.3); building(-1.8, -6.8, 5.8, 5.1); building(5, -6.5, 5.8, 4.2); building(10.5, -6.6, 3.1, 3.3);
  const gate = new T.Group(); gate.position.set(-2.6, 0, 5.55); world.add(gate);
  for (const x of [-4.2, -2.5, 2.5, 4.2]) { craft.box(gate, [.42, 4.2, .42], [x, 2.1, 0], '#914f39'); craft.box(gate, [.68, .5, .7], [x, .25, 0], '#a29d81'); craft.box(gate, [.61, .15, .64], [x, .59, 0], '#c4ba99'); }
  craft.box(gate, [5.8, .4, .58], [0, 3.65, 0], '#9e593f'); craft.box(gate, [5.8, .2, .64], [0, 4.4, 0], '#a46b44');
  const top = new T.Group(); top.position.y = 4.4; gate.add(top); craft.roof(top, 6, 1.8, 0, '#3e6c61');
  for (const x of [-3.35, 3.35]) { const wing = new T.Group(); wing.position.set(x, 3.3, 0); gate.add(wing); craft.roof(wing, 2.25, 1.65, 0, '#456f61'); craft.box(gate, [1.5, .6, .18], [x, 2.94, 0], '#92744b'); }
  craft.sign(gate, '义乌三时集', [0, 3.97, .36], 3.1, .66, '#3e5f52', '#edcd83');
  for (const x of [-2.4, 2.4]) { craft.lantern(gate, [x, 3.2, .45], .9); for (let y = 1.25; y < 3; y += .38) craft.box(gate, [.1, .08, .44], [x, y, 0], '#c19b58'); }
  function tree(x: number, z: number, scale: number) { const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); world.add(g); craft.cylinder(g, .15, .28, 3.3, [0, 1.6, 0], '#79674d', 7); for (let i = 0; i < 7; i++) { const a = i * 2.4, px = Math.sin(a) * 1.05, pz = Math.cos(a) * .85, y = 3 + i % 3 * .5; craft.beam(g, [0, 2.1, 0], [px, y, pz], .09, '#79674d'); const m = craft.mesh(g, craft.geometry('tree', () => new T.IcosahedronGeometry(1, 1)), ['#789377', '#92a383', '#667f63'][i % 3], [px, y, pz]); m.scale.set(1.2, .8, 1); } }
  tree(-11.7, -4.4, 1.5); tree(11.8, 4, 1.2); tree(-11.8, 6, .8);
  const stallObjects: T.Group[] = [], stallRoofs: T.Group[] = [], signs: T.Mesh[][] = [], spirits: T.Group[] = [], humans: T.Group[] = [], awnings: T.Mesh[] = [], steam: T.Mesh[] = [];
  for (const stall of stalls) {
    const g = new T.Group(); g.position.set(stall.x, 0, -2.4); g.userData.stallId = stall.id; world.add(g); stallObjects.push(g);
    craft.box(g, [4.2, .13, 3.7], [0, .04, 0], '#b8ae8b'); craft.box(g, [3.55, 1.1, 1.0], [0, .66, .8], '#986e49'); craft.box(g, [3.8, .16, 1.25], [0, 1.28, .8], '#bd9765');
    for (let x = -1.65; x < 1.8; x += .46) craft.box(g, [.045, .93, 1.025], [x, .67, .8], '#77543b');
    for (const x of [-1.75, 1.75]) for (const z of [-1.25, 1.2]) craft.box(g, [.13, 3.1, .13], [x, 1.55, z], '#78593c');
    craft.box(g, [3.5, .12, .6], [0, 1.8, -1.1], '#9b7b50'); const roof = new T.Group(); g.add(roof); stallRoofs.push(roof);
    for (let i = 0; i < 8; i++) { const z = -1.5 + i * .44, y = 3.1 + .42 * Math.sin(i / 7 * Math.PI); const strip = craft.box(roof, [4.15, .11, .48], [0, y, z], i % 2 ? stall.color : new T.Color(stall.color).multiplyScalar(1.12).getStyle()); strip.rotation.x = -.25 * Math.cos(i / 7 * Math.PI); }
    awnings.push(craft.box(roof, [4.12, .38, .08], [0, 2.98, 1.62], stall.color)); for (let x = -1.9; x <= 2; x += .27) craft.box(roof, [.06, .4, .085], [x, 2.97, 1.625], '#d4b980');
    signs.push(markets.map(m => craft.sign(g, stall.names[m], [0, 2.5, 1.32], 2.2, .57)));
    craft.lantern(g, [-1.8, 2.6, 1.38], .7); craft.lantern(g, [1.8, 2.6, 1.38], .7);
    const human = craft.person('human', stall.color); human.position.set(0, .54, -.15); g.add(human); humans.push(human);
    const spirit = craft.person(stall.kind, stall.color); spirit.position.copy(human.position); g.add(spirit); spirits.push(spirit);
    stall.products.forEach((id, i) => { const p = products.find(p => p.id === id)!; const obj = craft.product(p.kind, p.color); obj.scale.setScalar(.35); obj.position.set(-1.15 + i * 1.1, 1.56, .9); obj.userData.productId = p.id; g.add(obj); });
    for (let i = 0; i < 5; i++) craft.cylinder(g, .16, .12, .3 + i % 2 * .18, [-1.3 + i * .62, 2.02, -1.1], ['#c39263', '#8fa18d', '#ad7254'][i % 3]);
    for (const x of [-1.5, 1.5]) { craft.cylinder(g, .35, .29, .58, [x, .35, 1.8], '#a08255'); craft.cylinder(g, .37, .37, .055, [x, .63, 1.8], '#c3a778'); }
    if (stall.kind === 'frog') for (const x of [-1.35, 1.35]) { craft.beam(g, [x, 1.3, .5], [x, 2.55, .5], .025, '#b6995f'); for (let i = 0; i < 4; i++) { const blade = craft.box(g, [.26, .26, .03], [x + Math.sin(i * Math.PI / 2) * .17, 2.55 + Math.cos(i * Math.PI / 2) * .17, .5], ['#dba756', '#c87a5a', '#79a39a', '#e3c998'][i]); blade.rotation.z = Math.PI / 4; } }
    if (stall.kind === 'cat') {
      for (const x of [-1.3, 1.3]) { craft.box(g, [.74, 1.5, .38], [x, 1.7, -.9], '#745c40'); for (const y of [1.15, 1.65, 2.15]) { craft.box(g, [.8, .07, .55], [x, y, -.75], '#bb9965'); for (let k = 0; k < 4; k++) craft.box(g, [.13, .32, .3], [x-.24+k*.16, y+.2, -.73], ['#748e7e','#c3a476','#a2674e','#c8b585'][k]); } }
    }
    if (stall.kind === 'food') { for (let i = 0; i < 3; i++) { craft.cylinder(g, .38, .37, .15, [-.95, 1.43+i*.17, .9], '#bf9d67'); craft.cylinder(g, .4, .4, .04, [-.95, 1.52+i*.17, .9], '#dec293'); } }
    if (stall.kind === 'lantern') for (let i = 0; i < 3; i++) craft.lantern(g, [-1 + i, 2.5, -.85], .75, '#e1a95d');
    if (stall.kind === 'food') for (let i = 0; i < 7; i++) { const puff = craft.ball(g, [.13, .1, .13], [1.1, 1.7 + i * .19, .8], '#f1e8d1'); puff.material = craft.mat('#f1e8d1').clone(); (puff.material as T.MeshStandardMaterial).transparent = true; craft.materials.set('puff' + i, puff.material as T.MeshStandardMaterial); steam.push(puff); }
  }
  for (const x of [-10.5, 10.5]) craft.cylinder(world, .055, .09, 5.1, [x, 2.5, 0], '#806744');
  for (let i = 0; i < 14; i++) { const x = -10.5 + i * 21 / 13, y = 4.7 - Math.sin(i / 13 * Math.PI) * .8; if (i < 13) craft.beam(world, [x, y + .4, 0], [x + 21 / 13, 5.1 - Math.sin((i + 1) / 13 * Math.PI) * .8, 0], .016, '#746749'); if (i % 2 === 0) craft.lantern(world, [x, y, 0], .6); }
  const referenceAnchor = new T.Group(); referenceAnchor.position.set(8, 0, 5.4); world.add(referenceAnchor);
  const cartFallback = craft.box(referenceAnchor, [2, .9, 1.25], [0, .6, 0], '#9b7e55'); let external: T.Object3D | undefined;
  const disposeExternal = (object: T.Object3D) => { const textures = new Set<T.Texture>(); object.traverse(o => { if (o instanceof T.Mesh) { o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { for (const value of Object.values(m)) if (value instanceof T.Texture) textures.add(value); m.dispose(); } } }); textures.forEach(t => t.dispose()); };
  new GLTFLoader().load('/assets/models/stalls/reference-stall.glb', gltf => { if (disposed) { disposeExternal(gltf.scene); return; } external = gltf.scene; const bounds = new T.Box3().setFromObject(external), size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3()); const scale = 2.7 / Math.max(size.x, size.y, size.z); external.scale.setScalar(scale); external.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale); external.traverse(o => { if (o instanceof T.Mesh) { o.castShadow = true; o.receiveShadow = true; } }); referenceAnchor.add(external); cartFallback.visible = false; }, undefined, () => {});
  const player = craft.person('player', '#788c75'); player.position.set(0, 0, 3); scene.add(player); player.visible = false;
  const ring = new T.Mesh(new T.RingGeometry(.38, .5, 32), new T.MeshBasicMaterial({ color: '#f7d395', transparent: true, opacity: .75, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .09; player.add(ring);
  const dots = new Float32Array(120 * 3); for (let i = 0; i < 120; i++) { dots[i * 3] = Math.sin(i * 32.7) * 13; dots[i * 3 + 1] = 1 + i % 17 * .38; dots[i * 3 + 2] = Math.cos(i * 8.3) * 8; }
  const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute('position', new T.BufferAttribute(dots, 3)); const dustMat = new T.PointsMaterial({ color: '#ffe0a0', size: .065, transparent: true, opacity: 0 }); const dust = new T.Points(dustGeo, dustMat); scene.add(dust);
  let disposed = false, frame = 0, time: Market = 'noon', visualTime = 0, targetTime = 0, street = false, blocked = false, selected: Stall | undefined;
  let approach: Stall | undefined, destination: T.Vector3 | undefined; const keys = new Set<string>(); let previous = performance.now(); const look = new T.Vector3(0, 1, 0); camera.position.set(21, 19, 27); let span = 24;
  const positions: Partial<Record<Market, T.Vector3>> = {}; let savedPosition: T.Vector3 | undefined;
  const palettes = [{ light: '#ffe5b5', intensity: 3.4, ambient: 2.3 }, { light: '#ffd194', intensity: .35, ambient: .72 }, { light: '#fff0cd', intensity: 2.1, ambient: 2.1 }];
  function resize() { renderer.setSize(host.clientWidth, host.clientHeight); renderer.render(scene, camera); }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  function setTime(m: Market) { time = m; targetTime = markets.indexOf(m); signs.forEach(list => list.forEach((s, i) => { s.visible = i === targetTime; })); }
  function setMode(isStreet: boolean, m: Market) { if (street) positions[time] = player.position.clone(); street = isStreet; setTime(m); selected = undefined; approach = undefined; destination = undefined; savedPosition = undefined; keys.clear(); if (street) player.position.copy(positions[m] ?? new T.Vector3(0, 0, 3)); player.visible = street; }
  function visit(id: string) { if (!street || blocked) return; const s = stalls.find(s => s.id === id); if (!s) return; if (!savedPosition) savedPosition = player.position.clone(); selected = undefined; approach = s; destination = new T.Vector3(s.x, 0, .6); options.onApproach(s.names[time]); }
  function focusStall(id?: string) { selected = stalls.find(s => s.id === id); if (selected && !savedPosition) { savedPosition = player.position.clone(); player.position.set(selected.x, 0, .6); } approach = undefined; destination = undefined; keys.clear(); if (!selected && savedPosition) { player.position.copy(savedPosition); savedPosition = undefined; } }
  const ray = new T.Raycaster(), pointer = new T.Vector2();
  function hit(e: PointerEvent) { const r = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(pointer, camera); return ray.intersectObjects(stallObjects, true)[0]; }
  function onPointer(e: PointerEvent) { if (blocked) return; const target = hit(e); if (selected) { let item: T.Object3D | undefined = target?.object; while (item && !item.userData.productId) item = item.parent ?? undefined; if (item?.userData.productId && selected.products.includes(item.userData.productId)) options.onProduct(item.userData.productId); return; } if (target) { let obj: T.Object3D | null = target.object; while (obj && !obj.userData.stallId) obj = obj.parent; if (obj && street) visit(obj.userData.stallId); return; } if (street) { const point = ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), new T.Vector3()); if (point && point.x > -11 && point.x < 11 && point.z > .25 && point.z < 4.3) { destination = point.setY(0); approach = undefined; savedPosition = undefined; } } }
  const hover = (e: PointerEvent) => { renderer.domElement.style.cursor = !blocked && street && hit(e) ? 'pointer' : 'default'; };
  let wheelTimer = 0;
  function wheel(e: WheelEvent) { if (street || blocked) return; e.preventDefault(); targetTime = T.MathUtils.clamp(targetTime + e.deltaY * .0025, 0, 2); const nearest = markets[Math.round(targetTime)]; if (nearest !== time) { time = nearest; signs.forEach(list => list.forEach((s, i) => { s.visible = i === markets.indexOf(time); })); options.onTime(time); } clearTimeout(wheelTimer); wheelTimer = window.setTimeout(() => { targetTime = Math.round(targetTime); }, 160); }
  const keyboard = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) if (street && !blocked && !selected) { e.preventDefault(); keys.add(e.key.toLowerCase()); destination = undefined; approach = undefined; savedPosition = undefined; } };
  const keyup = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase()), blur = () => keys.clear(), contextLost = (e: Event) => { e.preventDefault(); options.onError(); };
  renderer.domElement.addEventListener('pointerdown', onPointer); renderer.domElement.addEventListener('pointermove', hover); renderer.domElement.addEventListener('wheel', wheel, { passive: false }); renderer.domElement.addEventListener('webglcontextlost', contextLost); window.addEventListener('keydown', keyboard); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur);
  let greetUntil = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(now: number) {
    if (disposed) return; frame = requestAnimationFrame(render); const { dt, ease } = animationStep(now, previous, reduce); previous = now;
    visualTime = T.MathUtils.clamp(T.MathUtils.lerp(visualTime, targetTime, ease), 0, 2); const a = Math.min(Math.floor(visualTime), 1), b = a + 1, blend = visualTime - a, night = 1 - Math.abs(visualTime - 1); const pa = palettes[a], pb = palettes[b]; sun.color.set(pa.light).lerp(new T.Color(pb.light), blend); sun.intensity = T.MathUtils.lerp(pa.intensity, pb.intensity, blend); hemi.intensity = T.MathUtils.lerp(pa.ambient, pb.ambient, blend);
    stallLights.forEach(l => { l.intensity = night * 7; }); fill.intensity = .8 - night * .35; hemi.color.set('#fff3d5').lerp(new T.Color('#a6c6d4'), night);
    craft.materials.forEach((m, key) => { if (key.endsWith('true')) m.emissiveIntensity = .15 + night * 1.9; }); spirits.forEach((s, i) => { s.scale.setScalar(Math.max(.001, night)); s.visible = night > .03; s.position.y = .54 + (reduce ? 0 : Math.sin(now * .0018 + i) * .04); const arm = s.userData.waveArm as T.Object3D; if (arm) arm.rotation.z = now < greetUntil ? -.7 + Math.sin(now * .018) * .5 : 0; humans[i].scale.setScalar(Math.max(.001, 1 - night)); humans[i].visible = night < .97; });
    awnings.forEach((m, i) => { m.scale.y = 1 + night * .6; m.rotation.z = reduce ? 0 : Math.sin(now * .0015 + i) * .009; }); steam.forEach((p, i) => { p.position.y = 1.6 + (now * .0003 + i * .2) % 1.7; (p.material as T.MeshStandardMaterial).opacity = visualTime / 2 * .45 * (1 - (p.position.y - 1.6) / 1.7); }); dustMat.opacity = night * .7; dust.rotation.y = reduce ? 0 : now * .000015;
    let moving = false;
    if (street && !blocked && !selected) { const move = new T.Vector3(); if (destination) { move.copy(destination).sub(player.position); move.y = 0; if (move.length() < .13) { player.position.copy(destination); destination = undefined; move.set(0, 0, 0); if (approach) { const id = approach.id; selected = approach; approach = undefined; options.onStall(id); } } else move.normalize(); } else { const h = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')), v = Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown')); move.set(h * .92 - v * .38, 0, -h * .38 - v * .92); if (move.lengthSq()) move.normalize(); } if (move.lengthSq()) { moving = true; player.position.addScaledVector(move, dt * 4.8); player.position.x = T.MathUtils.clamp(player.position.x, -11, 11); player.position.z = T.MathUtils.clamp(player.position.z, .25, 4.3); player.rotation.y = Math.atan2(move.x, move.z); } }
    player.position.y = moving && !reduce ? Math.sin(now * .016) * .045 : 0;
    const targetLook = new T.Vector3(), targetPosition = new T.Vector3(); let targetSpan: number; const narrow = host.clientWidth < 650;
    if (selected) { targetLook.set(selected.x + (narrow ? 0 : .85), 1.7, -2.1); targetPosition.set(selected.x + .65, 3.1, 7.8); targetSpan = narrow ? 7.5 : 6; } else if (street) { targetLook.set(player.position.x * .65, .6, -.6); targetPosition.copy(targetLook).add(new T.Vector3(8, 12, 18)); targetSpan = narrow ? 17 : 14; } else { targetLook.set(0, 1.2, -.6); targetPosition.set(19, 18, 26); targetSpan = Math.max(22, 36 / (host.clientWidth / Math.max(host.clientHeight, 1))); }
    look.lerp(targetLook, ease); camera.position.lerp(targetPosition, ease); span = T.MathUtils.lerp(span, targetSpan, ease); camera.lookAt(look); const aspect = host.clientWidth / Math.max(host.clientHeight, 1); camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix();
    gate.visible = !street; referenceAnchor.visible = !street; stallRoofs.forEach((roof, i) => { roof.visible = !selected || stalls[i].id !== selected.id; }); renderer.render(scene, camera);
  }
  setTime('noon'); frame = requestAnimationFrame(render);
  return { setTime, setMode, visit, focusStall, setBlocked(value: boolean) { blocked = value; keys.clear(); }, move(key: string, pressed: boolean) { if (pressed && !blocked && !selected) { keys.add(key); destination = undefined; } else keys.delete(key); }, play() { greetUntil = performance.now() + 1600; },
    dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frame); clearTimeout(wheelTimer); observer.disconnect(); window.removeEventListener('keydown', keyboard); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur); renderer.domElement.removeEventListener('pointerdown', onPointer); renderer.domElement.removeEventListener('pointermove', hover); renderer.domElement.removeEventListener('wheel', wheel); renderer.domElement.removeEventListener('webglcontextlost', contextLost); if (external) disposeExternal(external); ring.geometry.dispose(); ring.material.dispose(); dustGeo.dispose(); dustMat.dispose(); craft.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}

