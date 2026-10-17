import * as T from 'three';
import { Kit } from './toon/Kit';
import { createRamp, radialTexture } from './toon/toon';
import { animationStep } from './motion';
import { Orbit } from './museum/orbit';
import { createSky, sampleMood } from './museum/sky';
import { palettes } from './miniature/palette';
import { buildMorning } from './miniature/morning';
import { buildNoon } from './miniature/noon';
import { buildNight } from './miniature/night';
import type { Diorama } from './miniature/types';
import type { Market } from '../data/catalog';

/** 三个时辰的出场顺序，也是滚轮的方向。 */
const order: Market[] = ['morning', 'noon', 'night'];
const step = (Math.PI * 2) / 3;
const carouselRadius = 8.8;
const lookHeight = 0.92;

export interface MiniatureOptions {
  onTime?: (market: Market) => void;
  onError?: () => void;
}

/** 首页的三时微缩展台：滚轮翻到下个时辰，拖动可环视。 */
export function createMiniatureMuseum(host: HTMLElement, options: MiniatureOptions = {}) {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(31, 1, 0.5, 160);
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '义乌三时市集微缩模型，滚动切换时辰，拖动可环视');

  const ramp = createRamp();
  const carousel = new T.Group();
  scene.add(carousel);

  const hemi = new T.HemisphereLight('#f4f1d8', '#8f987f', 1.6);
  scene.add(hemi);
  const key = new T.DirectionalLight('#ffe4ba', 2.4);
  key.position.set(-5, 9, carouselRadius + 7);
  key.target.position.set(0, lookHeight, carouselRadius);
  scene.add(key, key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.camera.left = -5.6;
  key.shadow.camera.right = 5.6;
  key.shadow.camera.top = 6.4;
  key.shadow.camera.bottom = -3.4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 34;
  key.shadow.bias = -0.0007;
  key.shadow.normalBias = 0.035;
  const fill = new T.DirectionalLight('#c6d9d2', 0.2);
  fill.position.set(7, 4, carouselRadius - 6);
  scene.add(fill);

  const halo = radialTexture('rgba(255,238,190,1)', 'rgba(255,222,150,0)', 128);
  const steamTexture = radialTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)', 96);

  const kits: Kit[] = [];
  const dioramas: Diorama[] = [];
  const builders = [buildMorning, buildNoon, buildNight];
  order.forEach((market, index) => {
    const kit = new Kit(ramp);
    kits.push(kit);
    const diorama = builders[index]({ kit, palette: palettes[market], halo, steam: steamTexture });
    const angle = index * step;
    diorama.group.position.set(0, -carouselRadius * Math.sin(angle), carouselRadius * Math.cos(angle));
    diorama.group.rotation.x = angle;
    carousel.add(diorama.group);
    dioramas.push(diorama);
  });

  const sky = createSky(scene);
  const target = new T.Vector3(0, lookHeight, carouselRadius);
  const orbit = new Orbit(camera, host, target);

  let disposed = false;
  let frame = 0;
  let previous = performance.now();
  let targetTime = 1;
  let visualTime = 1;
  let currentIndex = 1;
  let snapTimer = 0;
  let appliedMood = '';
  let distance = 15.4;

  function framingDistance() {
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const wanted = camera.aspect < 1 ? 6.9 : 10.6;
    return Math.max(wanted / (2 * tan * Math.max(camera.aspect, 0.52)), 15.4);
  }

  function resize() {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    distance = framingDistance();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  function paint(mood: ReturnType<typeof sampleMood>) {
    const signature = `${mood.skyTop}${mood.skyMid}${mood.skyBottom}${mood.ink}${mood.muted}${mood.accent}`;
    if (signature === appliedMood) return;
    appliedMood = signature;
    const style = host.closest<HTMLElement>('#app')?.style ?? document.documentElement.style;
    style.setProperty('--sky-top', mood.skyTop);
    style.setProperty('--sky-mid', mood.skyMid);
    style.setProperty('--sky-bottom', mood.skyBottom);
    style.setProperty('--ink', mood.ink);
    style.setProperty('--muted', mood.muted);
    style.setProperty('--accent', mood.accent);
    style.setProperty('--line', `${mood.line}33`);
  }

  function setTime(market: Market) {
    const index = order.indexOf(market);
    if (index >= 0) targetTime = index;
    currentIndex = index >= 0 ? index : currentIndex;
  }

  const wheel = (event: WheelEvent) => {
    if (disposed) return;
    event.preventDefault();
    targetTime = T.MathUtils.clamp(targetTime + event.deltaY * 0.0022, 0, 2);
    clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => { targetTime = Math.round(targetTime); }, 220);
  };

  const keyboard = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') targetTime = T.MathUtils.clamp(Math.round(targetTime) + 1, 0, 2);
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') targetTime = T.MathUtils.clamp(Math.round(targetTime) - 1, 0, 2);
  };

  const contextLost = (event: Event) => {
    event.preventDefault();
    options.onError?.();
  };

  renderer.domElement.addEventListener('wheel', wheel, { passive: false });
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  window.addEventListener('keydown', keyboard);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    const { dt, ease } = animationStep(now, previous, reduce);
    previous = now;

    visualTime = T.MathUtils.lerp(visualTime, targetTime, ease * 0.92 + 0.08);
    if (Math.abs(visualTime - targetTime) < 0.0006) visualTime = targetTime;
    carousel.rotation.x = -visualTime * step;

    const mood = sampleMood(visualTime);
    sky.apply(mood);
    paint(mood);
    key.color.set(mood.light);
    key.intensity = mood.lightIntensity;
    hemi.color.set(mood.hemiSky);
    hemi.groundColor.set(mood.hemiGround);
    hemi.intensity = mood.hemiIntensity;
    fill.intensity = 0.1 + (mood.stars > 0.5 ? 0.22 : 0.1);

    const seconds = now / 1000;
    let nearest = 0;
    let nearestGap = 9;
    dioramas.forEach((diorama, index) => {
      const gap = Math.abs(visualTime - index);
      if (gap < nearestGap) { nearestGap = gap; nearest = index; }
      diorama.tick(seconds, T.MathUtils.clamp(1 - gap, 0, 1));
    });
    if (nearest !== currentIndex) {
      currentIndex = nearest;
      options.onTime?.(order[nearest]);
    }

    orbit.update(dt, distance);
    renderer.render(scene, camera);
  }

  frame = requestAnimationFrame(render);

  return {
    setTime,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(snapTimer);
      observer.disconnect();
      renderer.domElement.removeEventListener('wheel', wheel);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      window.removeEventListener('keydown', keyboard);
      orbit.dispose();
      sky.dispose();
      dioramas.forEach(diorama => diorama.dispose());
      kits.forEach(kit => kit.dispose());
      halo.dispose();
      steamTexture.dispose();
      ramp.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
