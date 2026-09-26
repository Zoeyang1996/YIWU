import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/** T01：纯几何体空间样板，不依赖尚未制作的 GLB 文件。 */
export function createOverview(host: HTMLElement, onError: () => void) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eee6d7');
  const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 100);
  camera.position.set(13, 12, 17);
  camera.lookAt(0, 1, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  let observer: ResizeObserver | undefined;
  let disposed = false;

  const contextLost = (event: Event) => {
    event.preventDefault();
    onError();
  };
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  }

  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', '正交视角的牌楼、道路与四个摊位占位模型');
    host.append(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);

    // 基础光照
    const hemisphere = new THREE.HemisphereLight('#fff6df', '#6d7970', 2.5);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight('#fff2d3', 3);
    sun.position.set(-5, 10, 8);
    scene.add(sun);

    function box(size: [number, number, number], position: [number, number, number], color: string) {
      const geometry = new THREE.BoxGeometry(...size);
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
      geometries.add(geometry);
      materials.add(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      scene.add(mesh);
      return mesh;
    }

    box([14, 0.4, 12], [0, -0.3, 0], '#c6b799');
    box([3.2, 0.12, 11.5], [0, -0.02, 0], '#e4d7ba');
    for (const x of [-2.5, 2.5]) {
      box([0.55, 4.5, 0.55], [x, 2.15, 3.7], '#914b3b');
      box([0.85, 0.4, 0.85], [x, 0.1, 3.7], '#928f7d');
    }
    box([6.4, 0.55, 0.8], [0, 4.2, 3.7], '#914b3b');
    box([7.1, 0.3, 1.65], [0, 4.65, 3.7], '#405953');
    box([6.3, 0.3, 1.2], [0, 4.95, 3.7], '#526d60');
    box([1.7, 0.8, 0.16], [0, 4.1, 4.18], '#d8b56d');
    for (const x of [-4, 4]) {
      for (const z of [-3.2, 0.5]) {
        box([2.5, 1.1, 1.7], [x, 0.5, z], '#a77953');
        for (const dx of [-1.05, 1.05]) {
          box([0.12, 2.5, 0.12], [x + dx, 1.2, z], '#72523d');
        }
        box([2.9, 0.22, 2.1], [x, 2.55, z], x < 0 ? '#a46149' : '#668374');
      }
    }

    // 模型槽占位（后续 GLB 替换点）
    const slotMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true });
    const modelSlots = [
      { id: 'gateway_main', name: '总览牌楼', suggested: 'public/models/gateway_main.glb', pos: [0, 4.6, 3.7] },
      { id: 'stall_left', name: '摊位_A_左', suggested: 'public/models/stall_left.glb', pos: [-4, 0.5, -3.2] },
      { id: 'stall_right', name: '摊位_B_右', suggested: 'public/models/stall_right.glb', pos: [4, 0.5, 0.5] },
      { id: 'stall_front', name: '摊位_C_前', suggested: 'public/models/stall_front.glb', pos: [0, 0.5, 0.5] },
      { id: 'character_player', name: '主角站位', suggested: 'public/models/character_player.glb', pos: [1.2, 0, 1.8] },
      { id: 'prop_lantern', name: '环境灯笼群', suggested: 'public/models/prop_lantern.glb', pos: [2.8, 3.0, 2.0] },
    ];
    for (const slot of modelSlots) {
      const g = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      geometries.add(g);
      const m = slotMaterial.clone();
      materials.add(m);
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(...(slot.pos as [number, number, number]));
      mesh.userData.slotId = slot.id;
      scene.add(mesh);
    }

    // GLTF 加载器与替换 API
    const loader = new GLTFLoader();
    const loaded: Record<string, THREE.Object3D | null> = {};
    async function replaceSlot(id: string, url: string) {
      try {
        // 卸载旧模型
        const prev = loaded[id];
        if (prev && prev.parent) prev.parent.remove(prev);
        const gltf = await loader.loadAsync(url);
        const obj = gltf.scene || gltf.scenes[0];
        // 查找占位标记并插入
        const slotMesh = Array.from(scene.children).find(c => (c as any).userData?.slotId === id) as THREE.Object3D | undefined;
        if (slotMesh) {
          // 将模型放到占位点并根据占位盒大小自适应缩放
          // 计算加载模型 bbox
          const bbox = new THREE.Box3().setFromObject(obj);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          // 计算占位物 bbox
          const slotBbox = new THREE.Box3().setFromObject(slotMesh);
          const slotSize = new THREE.Vector3();
          slotBbox.getSize(slotSize);
          // 防止零尺寸
          const eps = 1e-4;
          size.x = Math.max(size.x, eps); size.y = Math.max(size.y, eps); size.z = Math.max(size.z, eps);
          slotSize.x = Math.max(slotSize.x, 0.9); slotSize.y = Math.max(slotSize.y, 0.9); slotSize.z = Math.max(slotSize.z, 0.9);
          const sx = slotSize.x / size.x; const sy = slotSize.y / size.y; const sz = slotSize.z / size.z;
          const s = Math.min(sx, sy, sz) * 0.9; // 留一点空隙
          obj.scale.setScalar(s);
          // 调整位置：将 obj 的中心对齐到 slotMesh 的位置
          const objCenter = new THREE.Vector3();
          new THREE.Box3().setFromObject(obj).getCenter(objCenter);
          const targetPos = slotMesh.position.clone();
          obj.position.add(targetPos.clone().sub(objCenter));
          scene.add(obj);
          loaded[id] = obj;
        } else {
          // 放到场景中心为兜底
          obj.position.set(0, 0, 0);
          scene.add(obj);
          loaded[id] = obj;
        }
        // 通知宿主页面该 slot 已加载（或替换）
        try { host.dispatchEvent(new CustomEvent('slot-loaded', { detail: { id, url, success: true } })); } catch {}
        return obj;
      } catch (e) {
        console.error('替换模型失败', id, url, e);
        try { host.dispatchEvent(new CustomEvent('slot-loaded', { detail: { id, url, success: false, error: String(e) } })); } catch {}
        return null;
      }
    }

    const resize = () => {
      if (disposed) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const aspect = width / height;
      const halfHeight = Math.max(8, 11 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    resize();
    observer = new ResizeObserver(() => {
      try { resize(); } catch { onError(); }
    });
    observer.observe(host);

    // 渲染循环与过渡目标
    let rafId = 0;
    const target = {
      hemiColor: new THREE.Color('#fff6df'),
      hemiIntensity: 2.5,
      sunColor: new THREE.Color('#fff2d3'),
      sunIntensity: 3,
      bg: new THREE.Color('#eee6d7'),
    } as const;

    function animate() {
      if (disposed) return;
      hemisphere.color.lerp(target.hemiColor, 0.06);
      hemisphere.intensity += (target.hemiIntensity - hemisphere.intensity) * 0.06;
      sun.color.lerp(target.sunColor, 0.06);
      sun.intensity += (target.sunIntensity - sun.intensity) * 0.06;
      if (scene.background) scene.background.lerp(target.bg, 0.06);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    function setTime(t: 'noon' | 'night' | 'morning') {
      if (t === 'noon') {
        target.hemiColor.set('#fff6df'); (target as any).hemiIntensity = 2.6;
        target.sunColor.set('#fff2d3'); (target as any).sunIntensity = 3.0;
        target.bg.set('#efe7d0');
      } else if (t === 'night') {
        target.hemiColor.set('#223244'); (target as any).hemiIntensity = 0.6;
        target.sunColor.set('#ffbb66'); (target as any).sunIntensity = 1.6;
        target.bg.set('#0f2633');
      } else {
        target.hemiColor.set('#f6f9f2'); (target as any).hemiIntensity = 1.8;
        target.sunColor.set('#fff1c9'); (target as any).sunIntensity = 2.2;
        target.bg.set('#e9f1ec');
      }
    }

    // 将模型槽信息写入页面 legend（若存在），并在条目上绑定点击替换行为
    const legend = host.closest('#app')?.querySelector<HTMLElement>('.legend-list');
    if (legend) {
      legend.innerHTML = '';
      for (const slot of modelSlots) {
        const li = document.createElement('li');
        li.innerHTML = `<b data-slot="${slot.id}">${slot.id}</b>: ${slot.name} — 建议路径 <i>${slot.suggested}</i>`;
        li.dataset.slot = slot.id;
        // 点击条目会尝试加载建议路径（若文件存在）
        li.addEventListener('click', () => {
          const url = slot.suggested;
          // 在 public 路径下直接请求
          replaceSlot(slot.id, url).then((obj) => {
            if (obj) {
              li.style.opacity = '0.8';
            } else {
              li.style.opacity = '0.4';
            }
          });
        });
        legend.appendChild(li);
      }
    }

    return { dispose() {
      if (disposed) return; disposed = true; observer?.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', contextLost); geometries.forEach(g => g.dispose()); materials.forEach(m => { try { (m as any).dispose?.(); } catch {} }); renderer.dispose(); renderer.domElement.remove(); cancelAnimationFrame(rafId);
    }, setTime, replaceSlot };
  } catch (error) {
    dispose();
    throw error;
  }
}
