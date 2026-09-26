import { createOverview } from '../scenes/createOverview';
import { assets } from '../data/assets';

export function mountApp(root: HTMLElement) {
  root.innerHTML = `
    <header><span class="seal">义乌</span><div><p class="eyebrow">YIWU · 空间原型 / 01</p><h1>三时市集</h1></div><span class="badge">占位资产 · 待验收</span></header>
    <main>
      <section class="intro"><p class="eyebrow">从一座牌楼开始</p><h2>把人间烟火，<br>装进一方市集。</h2><p>先看空间，再添百物。这里用简单体块检查牌楼、道路与摊位的比例，为午市、夜市和早市准备共同的舞台。</p><p class="note">当前仅为总览空间样板；时段切换、街道漫游与购物将在后续阶段接入。</p></section>
      <section class="viewport" aria-label="三维市集预览"><div class="scene"></div><div class="error" role="alert" hidden><p>三维场景未能显示，请检查浏览器硬件加速后重试。</p><button type="button">重新加载场景</button></div><span class="caption">正交视角 / 几何体占位 / 无正式模型</span></section>
    </main>
    <footer><span>资产准备 <b>${assets.length}</b> 类</span><span>建筑 · 道路 · 摊位 · 角色 · 商品 · 道具</span></footer>`;
  const host = root.querySelector<HTMLElement>('.scene')!;
  const error = root.querySelector<HTMLElement>('.error')!;
  const retry = root.querySelector<HTMLButtonElement>('button')!;
  let disposeScene: (() => void) | undefined;
  const showError = () => {
    disposeScene?.();
    disposeScene = undefined;
    error.hidden = false;
  };
  const start = () => {
    disposeScene?.();
    disposeScene = undefined;
    error.hidden = true;
    try { disposeScene = createOverview(host, showError); }
    catch (cause) { console.error('场景初始化失败', cause); showError(); }
  };
  retry.addEventListener('click', start);
  start();
  return () => {
    retry.removeEventListener('click', start);
    disposeScene?.();
    root.replaceChildren();
  };
}
