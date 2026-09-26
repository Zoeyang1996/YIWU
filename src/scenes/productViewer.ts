import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Craft } from './craft';
import type { Product } from '../data/catalog';
export function productViewer(host: HTMLElement, product: Product, onError: () => void) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); host.append(renderer.domElement);
  const scene = new T.Scene(), craft = new Craft(), camera = new T.PerspectiveCamera(35, 1, .1, 30); camera.position.set(2.5, 1.6, 4);
  scene.add(new T.HemisphereLight('#fff3d9', '#6a8575', 3)); const light = new T.DirectionalLight('#ffdeb0', 3); light.position.set(-3, 4, 5); scene.add(light);
  const model = craft.product(product.kind, product.color); scene.add(model);
  const originalColors = [...craft.materials.values()].map(m => ({ material: m, color: m.color.clone(), emissive: m.emissive.clone() }));
  function setVariant(second: boolean) {
    for (const entry of originalColors) {
      const isMain = entry.color.equals(new T.Color(product.color));
      const isPaper = (product.kind === 'rabbit') && ['#f0ddb1', '#f4e5c5'].some(c => entry.color.equals(new T.Color(c)));
      entry.material.color.copy(entry.color); entry.material.emissive.copy(entry.emissive);
      if (second && (isMain || isPaper)) { entry.material.color.set(product.kind === 'rabbit' ? '#e9be8a' : product.kind === 'book' ? '#ae6650' : product.kind === 'tea' ? '#d6c49d' : product.kind === 'lantern' ? '#dfac57' : '#668d7c'); if (entry.emissive.getHex() !== 0) entry.material.emissive.copy(entry.material.color); }
    }
  }
  const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.minDistance = 2.1; controls.maxDistance = 7; controls.enableDamping = true; controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = .7;
  let frame = 0, alive = true; function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); renderer.render(scene, camera); }
  const observer = new ResizeObserver(resize); observer.observe(host); resize(); const lost = (e: Event) => { e.preventDefault(); onError(); }; renderer.domElement.addEventListener('webglcontextlost', lost);
  function render() { if (!alive) return; frame = requestAnimationFrame(render); controls.update(); renderer.render(scene, camera); } render();
  return { setVariant, reset() { controls.reset(); camera.position.set(2.5, 1.6, 4); }, demo() { model.rotation.y += Math.PI / 2; }, dispose() { alive = false; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); renderer.domElement.removeEventListener('webglcontextlost', lost); craft.dispose(); renderer.dispose(); renderer.domElement.remove(); } };
}
