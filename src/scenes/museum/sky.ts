import * as T from 'three';
import { radialTexture } from '../toon/toon';

export interface Mood {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  ink: string;
  muted: string;
  accent: string;
  line: string;
  light: string;
  lightIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  /** 太阳位置与大小，单位是场景里的世界坐标。 */
  sun: [number, number];
  sunSize: number;
  sunColor: string;
  moon: [number, number];
  moonSize: number;
  moonColor: string;
  stars: number;
}

const keyframes: [Mood, Mood, Mood] = [
  {
    skyTop: '#c3dbd2',
    skyMid: '#e8efdb',
    skyBottom: '#f9f2dd',
    ink: '#38493f',
    muted: '#7e8f81',
    accent: '#5c8170',
    line: '#6c745633',
    light: '#ffe9c8',
    lightIntensity: 0.86,
    hemiSky: '#e8f2e4',
    hemiGround: '#95a087',
    hemiIntensity: 0.42,
    sun: [-5.2, 2.4],
    sunSize: 3.4,
    sunColor: '#ffd699',
    moon: [-7.4, -8.2],
    moonSize: 2.8,
    moonColor: '#eae2c4',
    stars: 0,
  },
  {
    skyTop: '#d5e4c6',
    skyMid: '#f3e9c8',
    skyBottom: '#faf1d7',
    ink: '#3d4433',
    muted: '#8a8666',
    accent: '#b3542f',
    line: '#6c745633',
    light: '#fff4d8',
    lightIntensity: 1.02,
    hemiSky: '#f6f1d6',
    hemiGround: '#a89a76',
    hemiIntensity: 0.46,
    sun: [-3.2, 5.2],
    sunSize: 4.6,
    sunColor: '#ffcf7d',
    moon: [0, -12],
    moonSize: 2.6,
    moonColor: '#efe8cd',
    stars: 0,
  },
  {
    skyTop: '#0f1c22',
    skyMid: '#1a2f33',
    skyBottom: '#284441',
    ink: '#efe3c4',
    muted: '#a7b9b0',
    accent: '#dcae73',
    line: '#c4d2bc33',
    light: '#a9ccd2',
    lightIntensity: 0.52,
    hemiSky: '#3a555c',
    hemiGround: '#1b2828',
    hemiIntensity: 0.34,
    sun: [6.2, -9.4],
    sunSize: 3,
    sunColor: '#ffd694',
    moon: [-3.6, 6.4],
    moonSize: 3.2,
    moonColor: '#ece5c6',
    stars: 1,
  },
];

const from = new T.Color();
const to = new T.Color();
const mixed = new T.Color();

function blend(a: string, b: string, t: number) {
  from.set(a);
  to.set(b);
  mixed.copy(from).lerp(to, t);
  return `#${mixed.getHexString()}`;
}

/** 三个时辰的配色关键帧，按滚动进度连续插值。 */
export function sampleMood(progress: number): Mood {
  const clamped = T.MathUtils.clamp(progress, 0, 2);
  const index = Math.min(Math.floor(clamped), 1);
  const t = T.MathUtils.smoothstep(clamped - index, 0, 1);
  const a = keyframes[index];
  const b = keyframes[index + 1];
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    skyTop: blend(a.skyTop, b.skyTop, t),
    skyMid: blend(a.skyMid, b.skyMid, t),
    skyBottom: blend(a.skyBottom, b.skyBottom, t),
    ink: blend(a.ink, b.ink, t),
    muted: blend(a.muted, b.muted, t),
    accent: blend(a.accent, b.accent, t),
    line: blend(a.line.slice(0, 7), b.line.slice(0, 7), t),
    light: blend(a.light, b.light, t),
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity),
    hemiSky: blend(a.hemiSky, b.hemiSky, t),
    hemiGround: blend(a.hemiGround, b.hemiGround, t),
    hemiIntensity: lerp(a.hemiIntensity, b.hemiIntensity),
    sun: [lerp(a.sun[0], b.sun[0]), lerp(a.sun[1], b.sun[1])],
    sunSize: lerp(a.sunSize, b.sunSize),
    sunColor: blend(a.sunColor, b.sunColor, t),
    moon: [lerp(a.moon[0], b.moon[0]), lerp(a.moon[1], b.moon[1])],
    moonSize: lerp(a.moonSize, b.moonSize),
    moonColor: blend(a.moonColor, b.moonColor, t),
    stars: lerp(a.stars, b.stars),
  };
}

function discTexture(kind: 'sun' | 'moon') {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;
  const glow = ctx.createRadialGradient(center, center, 0, center, center, center);
  if (kind === 'sun') {
    glow.addColorStop(0, 'rgba(255,250,226,1)');
    glow.addColorStop(0.33, 'rgba(255,231,166,1)');
    glow.addColorStop(0.37, 'rgba(255,214,140,0.6)');
    glow.addColorStop(0.62, 'rgba(255,201,120,0.2)');
    glow.addColorStop(1, 'rgba(255,196,112,0)');
  } else {
    glow.addColorStop(0, 'rgba(250,246,224,1)');
    glow.addColorStop(0.34, 'rgba(238,232,198,1)');
    glow.addColorStop(0.38, 'rgba(226,222,190,0.45)');
    glow.addColorStop(0.72, 'rgba(214,214,182,0.14)');
    glow.addColorStop(1, 'rgba(206,208,180,0)');
  }
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  if (kind === 'moon') {
    ctx.fillStyle = 'rgba(214,208,172,0.55)';
    for (const [x, y, r] of [[104, 108, 13], [126, 132, 8], [112, 140, 6], [142, 112, 7]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

export function createSky(scene: T.Scene) {
  const group = new T.Group();
  scene.add(group);

  const sunTexture = discTexture('sun');
  const moonTexture = discTexture('moon');
  const sunMaterial = new T.SpriteMaterial({ map: sunTexture, transparent: true, depthWrite: false });
  const moonMaterial = new T.SpriteMaterial({ map: moonTexture, transparent: true, depthWrite: false });
  const sun = new T.Sprite(sunMaterial);
  const moon = new T.Sprite(moonMaterial);
  sun.scale.setScalar(3.2);
  moon.scale.setScalar(3);
  group.add(sun, moon);

  const starTexture = radialTexture('rgba(255,246,214,1)', 'rgba(255,246,214,0)', 64);
  const starCount = 220;
  const positions = new Float32Array(starCount * 3);
  let seed = 987654321;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let index = 0; index < starCount; index++) {
    positions[index * 3] = (random() - 0.5) * 46;
    positions[index * 3 + 1] = -6 + random() * 26;
    positions[index * 3 + 2] = -24 - random() * 6;
  }
  const starGeometry = new T.BufferGeometry();
  starGeometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  const starMaterial = new T.PointsMaterial({ map: starTexture, size: 0.34, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
  const stars = new T.Points(starGeometry, starMaterial);
  group.add(stars);

  const apply = (mood: Mood) => {
    sun.position.set(mood.sun[0], mood.sun[1], -17);
    sun.scale.setScalar(mood.sunSize);
    sunMaterial.color.set(mood.sunColor);
    sunMaterial.opacity = T.MathUtils.clamp((mood.sun[1] + 2.4) / 4.2, 0, 1);

    moon.position.set(mood.moon[0], mood.moon[1], -17.5);
    moon.scale.setScalar(mood.moonSize);
    moonMaterial.color.set(mood.moonColor);
    moonMaterial.opacity = T.MathUtils.clamp((mood.moon[1] + 2.4) / 4.2, 0, 1);

    starMaterial.opacity = mood.stars * 0.85;
    sun.visible = sunMaterial.opacity > 0.01;
    moon.visible = moonMaterial.opacity > 0.01;
    stars.visible = starMaterial.opacity > 0.02;
  };

  return {
    apply,
    dispose() {
      group.removeFromParent();
      sunTexture.dispose();
      moonTexture.dispose();
      starTexture.dispose();
      sunMaterial.dispose();
      moonMaterial.dispose();
      starMaterial.dispose();
      starGeometry.dispose();
    },
  };
}
