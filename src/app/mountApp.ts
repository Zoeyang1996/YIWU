import { createOverview } from '../scenes/createOverview';
import { assets } from '../data/assets';

export function mountApp(root: HTMLElement) {
  root.innerHTML = `
    <header><span class="seal">义乌</span><div><p class="eyebrow">YIWU · 空间原型 / 01</p><h1>三时市集</h1></div><span class="badge">占位资产 · 待验收</span></header>
    <main>
      <section class="intro"><p class="eyebrow">从一座牌楼开始</p><h2>把人间烟火，<br>装进一方市集。</h2><p>先看空间，再添百物。这里用简单体块检查牌楼、道路与摊位的比例，为午市、夜市和早市准备共同的舞台。</p><p class="note">当前仅为总览空间样板；时段切换、街道漫游与购物将在后续阶段接入。</p></section>
      <section class="viewport" aria-label="三维市集预览">
        <div class="scene"></div>
        <div class="overlay-controls">
          <div class="time-switch" role="tablist" aria-label="时段切换">
            <button data-time="noon" class="active">午市</button>
            <button data-time="night">夜市</button>
            <button data-time="morning">早市</button>
          </div>
          <div class="asset-legend" aria-hidden="false">
            <h4>模型槽（用于后续替换）</h4>
            <ul class="legend-list">
              <!-- 自动由场景脚本填充：每个条目包含 id、建议路径与相对位置 -->
            </ul>
          </div>
        </div>
        <div class="error" role="alert" hidden><p>三维场景未能显示，请检查浏览器硬件加速后重试。</p><button type="button">重新加载场景</button></div>
        <span class="caption">正交视角 / 几何体占位 / 模型槽已标注（public/models/*.glb）</span>
      </section>
    </main>
    <footer><span>资产准备 <b>${assets.length}</b> 类</span><span>建筑 · 道路 · 摊位 · 角色 · 商品 · 道具</span></footer>`;
  // 开发面板：手动替换模型槽
  const devPanel = document.createElement('div');
  devPanel.className = 'dev-panel';
  devPanel.innerHTML = `<label>Slot ID <input class="slot-id" placeholder="gateway_main"/></label><label>GLB 路径 <input class="slot-url" placeholder="/public/models/gateway_main.glb"/></label><button class="slot-replace">替换模型</button>`;
  root.appendChild(devPanel);
  const host = root.querySelector<HTMLElement>('.scene')!;
  const error = root.querySelector<HTMLElement>('.error')!;
  const retry = root.querySelector<HTMLButtonElement>('button')!;
  let disposeScene: (() => void) | undefined;
  const showError = () => {
    disposeScene?.();
    disposeScene = undefined;
    error.hidden = false;
  };
  let sceneApi: any = null;
  const start = () => {
    if (sceneApi && sceneApi.dispose) sceneApi.dispose();
    disposeScene = undefined;
    error.hidden = true;
    try { sceneApi = createOverview(host, showError); disposeScene = () => sceneApi.dispose(); }
    catch (cause) { console.error('场景初始化失败', cause); showError(); }
  };
  retry.addEventListener('click', start);
  start();

  // 接入时段按钮交互
  const buttons = root.querySelectorAll<HTMLButtonElement>('.time-switch button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = (btn.dataset.time as 'noon' | 'night' | 'morning');
      if (sceneApi && sceneApi.setTime) sceneApi.setTime(t);
    });
  });
  // 监听 slot-loaded 事件以更新 legend 高亮
  const legend = root.querySelector<HTMLElement>('.legend-list');
  const loadedSet = new Set<string>();
  if (legend) {
    host.addEventListener('slot-loaded', (ev: Event) => {
      const d = (ev as CustomEvent).detail as { id: string; url: string; success: boolean };
      if (!d) return;
      const li = Array.from(legend.querySelectorAll('li')).find(x => x.dataset.slot === d.id);
      if (li) {
        if (d.success) { li.classList.add('loaded'); loadedSet.add(d.id); }
        else { li.classList.remove('loaded'); loadedSet.delete(d.id); }
      }
    });
  }
  // 读取 public/models/manifest.json 并在 legend 中显示可用文件
  fetch('/public/models/manifest.json').then(r => r.json()).then((list: string[]) => {
    const listRoot = root.querySelector('.asset-legend');
    if (!listRoot) return;
    const ul = document.createElement('ul'); ul.className = 'model-list';
    for (const p of list) {
      const li = document.createElement('li');
      li.innerHTML = `<button class="model-item" data-path="/public/models/${p}">${p}</button>`;
      ul.appendChild(li);
    }
    listRoot.appendChild(ul);
    listRoot.addEventListener('click', (ev) => {
      const btn = (ev.target as HTMLElement).closest('.model-item') as HTMLButtonElement | null;
      if (!btn) return;
      const path = btn.dataset.path!;
      // 如果当前选择了 legend 的某个 slot（高亮），使用第一个高亮的 slot 替换，否则提示用户选择 slot
      if (!legend) return alert('Legend 未就绪');
      const loadedEls = Array.from(legend.querySelectorAll('li.loaded')) as HTMLLIElement[];
      const firstSlot = loadedEls.length ? loadedEls[0] : undefined;
      if (!firstSlot) return alert('请先在左侧 legend 中点击目标 slot 来选择要替换的模型槽（会高亮）。');
      const slotId = firstSlot.dataset.slot!;
      if (sceneApi && sceneApi.replaceSlot) sceneApi.replaceSlot(slotId, path).then((obj: any) => {
        if (obj) alert('已替换 ' + slotId + ' → ' + path);
      });
    });
  }).catch(() => {});
  // 把 `assets.ts` 里的预填 URL 列表也渲染为一键替换按钮
  import('../data/assets').then(mod => {
    const listRoot = root.querySelector('.asset-legend');
    if (!listRoot) return;
    const section = document.createElement('div');
    section.className = 'assets-preload';
    section.innerHTML = '<h5>建议的 assets</h5>';
    const ul = document.createElement('ul'); ul.className = 'assets-preload-list';
    for (const a of mod.assets as any[]) {
      if (!a.url) continue;
      const li = document.createElement('li');
      li.innerHTML = `<button class="asset-item" data-url="${a.url}">${a.id} → ${a.url.replace('/public/models/','')}</button>`;
      ul.appendChild(li);
    }
    section.appendChild(ul);
    listRoot.appendChild(section);
    section.addEventListener('click', (ev) => {
      const btn = (ev.target as HTMLElement).closest('.asset-item') as HTMLButtonElement | null;
      if (!btn) return;
      const url = btn.dataset.url!;
      if (!legend) return alert('Legend 未就绪');
      const loadedEls = Array.from(legend.querySelectorAll('li.loaded')) as HTMLLIElement[];
      const firstSlot = loadedEls.length ? loadedEls[0] : undefined;
      if (!firstSlot) return alert('请先在左侧 legend 中点击目标 slot 来选择要替换的模型槽（会高亮）。');
      const slotId = firstSlot.dataset.slot!;
      if (sceneApi && sceneApi.replaceSlot) sceneApi.replaceSlot(slotId, url).then((obj: any) => {
        if (obj) alert('已替换 ' + slotId + ' → ' + url);
      });
    });
  }).catch(() => {});
  // 开发面板交互
  const replaceBtn = root.querySelector<HTMLButtonElement>('.slot-replace')!;
  replaceBtn.addEventListener('click', () => {
    const idInput = root.querySelector<HTMLInputElement>('.slot-id')!;
    const urlInput = root.querySelector<HTMLInputElement>('.slot-url')!;
    const id = idInput.value.trim();
    const url = urlInput.value.trim();
    if (!id || !url) return alert('请填写 slot id 和 glb 路径');
    if (sceneApi && sceneApi.replaceSlot) sceneApi.replaceSlot(id, url).then((obj: any) => {
      if (obj) alert('替换成功：' + id);
      else alert('替换失败，查看控制台');
    });
  });
  return () => {
    retry.removeEventListener('click', start);
    disposeScene?.();
    root.replaceChildren();
  };
}
