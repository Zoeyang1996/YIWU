import * as THREE from 'three';

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
    scene.add(new THREE.HemisphereLight('#fff6df', '#6d7970', 2.5));
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
      renderer.render(scene, camera);
    };
    resize();
    observer = new ResizeObserver(() => {
      try { resize(); } catch { onError(); }
    });
    observer.observe(host);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
