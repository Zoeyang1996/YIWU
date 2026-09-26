import { createOverview } from '../scenes/createOverview';
import { productViewer } from '../scenes/productViewer';
import { markets, marketInfo, stalls, stallById, productById, productArt, type Market } from '../data/catalog';
import { addItem, total, validateCart, type CartItem } from '../data/cart';

const bag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>';
const icons = ['☀', '☾', '◒'];
export function mountApp(root: HTMLElement) {
  root.innerHTML = `<div class="app-shell"><header class="topbar"><a class="brand" href="/" data-action="home"><span class="seal">义<br>乌</span><span><strong>三时市集</strong><small>YIWU · A DAY IN THE MARKET</small></span></a><nav class="top-nav" aria-label="主导航"><button data-action="home" class="nav-home">市集总览</button><button data-action="guide">逛集小笺 <span>↗</span></button></nav><button class="cart-button" data-action="cart" aria-label="打开我的行囊">${bag}<span>我的行囊</span><b class="cart-count">0</b></button></header>
  <main class="experience"><div class="watermark" aria-hidden="true">市</div><section class="hero"><p class="eyebrow">浙江 · 义乌 <span> / </span> 一日三时，人间百味</p><p class="chapter">壹 <span>—</span> <span class="chapter-label"></span></p><h1></h1><p class="hero-description"></p><button class="enter-button" data-action="enter"><span></span><b>↗</b></button><p class="hero-footnote">不赶路，不通关。只管自在逛一逛。</p></section>
  <div class="scene-host"></div><div class="scene-error" hidden role="alert"><span>山水稍候</span><h2>市集暂时没能展开</h2><p>请开启浏览器硬件加速，然后重试。行囊中的好物仍然保留。</p><button data-action="retry">重新加载场景</button></div>
  <div class="street-heading" hidden><button data-action="home">← 返回总览</button><span class="street-title"></span><small>沿街慢行 · 点摊相逢</small></div><aside class="stall-panel" hidden></aside>
  <div class="scene-stamp"><span class="stamp-symbol">逛</span><span>一方小天地<br>万般烟火气</span></div><div class="scene-note"><span class="live-dot"></span><span class="scene-phrase"></span><small>可自由切换的三时市集</small></div>
  <div class="street-tools" hidden><div class="street-help"><kbd>W A S D</kbd> / 方向键行走 <span>·</span> 点击地面或摊位</div><div class="stall-shortcuts" aria-label="前往摊位"></div><div class="dpad" aria-label="触屏行走"><button data-move="w" aria-label="向前走">↑</button><button data-move="a" aria-label="向左走">←</button><button data-move="s" aria-label="向后走">↓</button><button data-move="d" aria-label="向右走">→</button></div></div>
  </main><footer class="bottom-bar"><div class="time-intro"><span>随时光，入市集</span><small>在场景中滚动鼠标，观三时流转</small></div><div class="time-switch" aria-label="选择市集时段">${markets.map((m, i) => `<button data-time="${m}" aria-pressed="false"><span class="time-icon">${icons[i]}</span><span><strong>${marketInfo[m].name}</strong><small>${['日正人间', '灯火志怪', '晨起烟火'][i]}</small></span><em>0${i + 1}</em></button>`).join('')}</div><span class="edition">三时百物 · 自在相逢<br><small>交互体验版 / 模拟选购</small></span></footer></div><div class="modal-root"></div><div class="toast" role="status" aria-live="polite"></div>`;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const shell = $('.app-shell'), host = $('.scene-host'), panel = $('.stall-panel'), modal = $('.modal-root');
  let scene: ReturnType<typeof createOverview> | undefined, viewer: ReturnType<typeof productViewer> | undefined;
  let market: Market = 'noon', street = false, currentStall = '', currentMode = '', cart: CartItem[] = [], selectedSpec = '', quantity = 1, detailId = '', toastTimer = 0, disposed = false;
  const scrollPositions = new Map<string, number>(); let lastFocus: HTMLElement | null = null;
  try { cart = validateCart(JSON.parse(localStorage.getItem('yiwu-cart-v1') ?? '[]')); } catch { cart = []; }
  function toast(message: string) { $('.toast').textContent = message; $('.toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => $('.toast').classList.remove('show'), 3300); }
  function save() { try { localStorage.setItem('yiwu-cart-v1', JSON.stringify(cart)); } catch { toast('浏览器暂不允许保存，行囊在本次浏览中仍可使用。'); } $('.cart-count').textContent = String(cart.reduce((sum, r) => sum + r.quantity, 0)); }
  function pathFor(m = market) { return `/market/${m}`; }
  function navigate(path: string, replace = false) { if (path === location.pathname + location.search) return; const state = { yiwu: true, parent: location.pathname + location.search }; if (replace) history.replaceState(state, '', path); else history.pushState(state, '', path); render(); }
  function parentPath() { const url = new URL(location.href); const p = url.searchParams; if (p.has('panel')) p.delete('panel'); else if (p.has('product')) p.delete('product'); else if (p.has('stall')) p.delete('stall'); else return '/'; return url.pathname + url.search; }
  function close() { const parent = parentPath(); if (history.state?.yiwu && history.state.parent === parent) history.back(); else navigate(parent, true); }
  function overlay(name: string) { const url = new URL(location.href); url.searchParams.set('panel', name); lastFocus = document.activeElement as HTMLElement; navigate(url.pathname + url.search); }
  function start() {
    scene?.dispose(); scene = undefined; $('.scene-error').hidden = true;
    try { scene = createOverview(host, { onError: () => { scene?.dispose(); scene = undefined; $('.scene-error').hidden = false; }, onTime: m => { market = m; updateTimeUI(); }, onProduct: id => { if (currentStall) navigate(`${pathFor()}?stall=${currentStall}&product=${id}`); }, onApproach: name => toast(`正走向「${name}」……`), onStall: id => { if (!disposed) navigate(`${pathFor()}?stall=${id}`); } }); currentMode = ''; currentStall = ''; render(); }
    catch (err) { console.error('市集初始化失败', err); $('.scene-error').hidden = false; }
  }
  function updateTimeUI() {
    root.dataset.market = market; const info = marketInfo[market]; $('.hero h1').innerHTML = info.title.replace('\n', '<br>'); $('.hero-description').innerHTML = info.description.replace('\n', '<br>'); $('.chapter-label').textContent = info.time; $('.enter-button span').textContent = `进入${info.name}`; $('.scene-phrase').textContent = info.phrase; $('.street-title').textContent = `义乌 · ${info.name}`; $('.time-intro small').textContent = street ? '任意时刻，都能出发去另一时段' : '在场景中滚动鼠标，观三时流转';
    root.querySelectorAll<HTMLElement>('[data-time]').forEach(b => { const active = b.dataset.time === market; b.setAttribute('aria-pressed', String(active)); b.classList.toggle('active', active); });
    $('.stall-shortcuts').innerHTML = stalls.map((s, i) => `<button data-visit="${s.id}"><small>0${i + 1}</small>${s.names[market]}<span>↗</span></button>`).join('');
  }
  function render() {
    viewer?.dispose(); viewer = undefined;
    const url = new URL(location.href), route = url.pathname.match(/^\/market\/(noon|night|morning)\/?$/); street = !!route; if (route) market = route[1] as Market;
    let stall = street ? stallById(url.searchParams.get('stall') ?? '') : undefined;
    let product = stall ? productById(url.searchParams.get('product') ?? '') : undefined; if (product && !stall?.products.includes(product.id)) product = undefined;
    const overlayName = url.searchParams.get('panel'); const hasOverlay = !!product || ['cart', 'checkout', 'success', 'guide'].includes(overlayName ?? '');
    const mode = `${street}:${market}`; if (mode !== currentMode) { scene?.setMode(street, market); currentMode = mode; currentStall = ''; }
    if ((stall?.id ?? '') !== currentStall) { scene?.focusStall(stall?.id); currentStall = stall?.id ?? ''; }
    scene?.setBlocked(hasOverlay); root.classList.toggle('in-street', street); root.classList.toggle('at-stall', !!stall); shell.inert = hasOverlay;
    $('.hero').hidden = street; $('.street-heading').hidden = !street; $('.street-tools').hidden = !street || !!stall; $('.scene-stamp').hidden = street; $('.scene-note').hidden = street; updateTimeUI(); save();
    if (panel.dataset.stall && !panel.hidden) scrollPositions.set(panel.dataset.stall, panel.scrollTop); panel.hidden = !stall || hasOverlay;
    if (stall) { panel.dataset.stall = stall.id; panel.innerHTML = `<div class="panel-heading"><span class="eyebrow">沿街好物 / ${marketInfo[market].name}</span><button class="icon-button" data-action="close" aria-label="离开摊位">×</button></div><h2>${stall.names[market]}</h2><p class="host-name">${stall.hosts[market]}</p><div class="dialogue"><span>“</span>${stall.lines[market]}<button data-action="greet">和掌柜打个招呼 ↗</button></div><div class="section-label">摊上好物 <span>${stall.products.length} 件</span></div><div class="product-list">${stall.products.map(id => { const p = productById(id)!; return `<button class="product-card" data-product="${id}"><span class="product-art">${productArt(p)}</span><span><strong>${p.name}</strong><small>可环绕欣赏 · 展示样品</small><b>¥ ${p.price}<em>查看 →</em></b></span></button>`; }).join('')}</div><p class="fine-print">商品与价格为体验示例，结账不会产生真实支付。</p><button class="secondary wide" data-action="close">← 回到街道，继续逛逛</button>`; panel.scrollTop = scrollPositions.get(stall.id) ?? 0; }
    modal.replaceChildren();
    if (!hasOverlay) { if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true }); lastFocus = null; return; }
    const closeButton = '<button class="icon-button modal-close" data-action="close" aria-label="关闭面板">×</button>';
    if (overlayName === 'guide') {
      modal.innerHTML = `<div class="backdrop"><section class="modal guide-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${closeButton}<p class="eyebrow">写给第一次来这里的你</p><h2 id="modal-title">一张逛集小笺</h2><div class="guide-row"><b>壹</b><div><h3>在同一条街，看见三个时辰</h3><p>总览中滚动鼠标或点击底部时段，随时进入午市、夜市或早市。</p></div></div><div class="guide-row"><b>贰</b><div><h3>慢慢走，与掌柜打个照面</h3><p>用 WASD、方向键或触屏箭头行走。点击摊位，角色会先走过去，再带你近看好物。下方店名也能带路。</p></div></div><div class="guide-row"><b>叁</b><div><h3>把喜欢的，收进行囊</h3><p>拖动商品可以环绕欣赏，选好款式加入行囊。切换市集、回总览和刷新都会保留选择。</p></div></div><div class="demo-note">这是一个可自由探索的互动原型。所有商品、价格和订单均为展示示例，不收集地址、不产生支付。</div><button class="primary wide" data-action="close">记住了，出发吧 ↗</button></section></div>`;
    } else if (overlayName === 'success') {
      modal.innerHTML = `<div class="backdrop"><section class="modal success-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="success-seal">好物<br>入囊</div><p class="eyebrow">留住一份市集烟火</p><h2 id="modal-title">演示订单已生成</h2><p>未产生支付，也不会发货。<br>本次勾选的商品已从行囊移出，其他商品仍然保留。</p><button class="primary wide" data-action="continue">继续逛${marketInfo[market].name} ↗</button><button class="text-button" data-action="home">回到市集总览</button></section></div>`;
    } else if (overlayName === 'cart' || overlayName === 'checkout') {
      const checkout = overlayName === 'checkout', rows = checkout ? cart.filter(r => r.selected) : cart;
      modal.innerHTML = `<div class="backdrop align-right"><section class="modal cart-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${closeButton}<p class="eyebrow">把沿途的喜欢，带回家</p><h2 id="modal-title">${checkout ? '确认模拟订单' : '我的行囊'}<small>${rows.reduce((sum, r) => sum + r.quantity, 0)} 件好物</small></h2><p class="cart-subtitle">${checkout ? '仅演示订单流程 · 无需填写个人信息' : '午市、夜市、早市共用一份行囊'}</p><div class="cart-list">${rows.length ? rows.map(row => { const index = cart.indexOf(row), p = productById(row.id)!; return `<div class="cart-row">${checkout ? '' : `<input type="checkbox" data-select="${index}" ${row.selected ? 'checked' : ''} aria-label="选择${p.name} ${row.spec}"/>`}<div class="cart-art">${productArt(p)}</div><div class="cart-item-copy"><strong>${p.name}</strong><small>${row.spec} · 来自${marketInfo[row.source].name}</small><span>¥ ${p.price} ${checkout ? `× ${row.quantity}` : ''}</span>${checkout ? '' : `<div class="quantity-control"><button data-cart-step="${index}" data-delta="-1" aria-label="减少${p.name}数量">−</button><span>${row.quantity}</span><button data-cart-step="${index}" data-delta="1" aria-label="增加${p.name}数量">＋</button></div>`}</div><div class="cart-row-end"><b>¥ ${p.price * row.quantity}</b>${checkout ? '' : `<button class="text-button" data-remove="${index}">移除</button>`}</div></div>`; }).join('') : '<div class="empty-cart"><span>囊</span><h3>行囊空空，心情刚好</h3><p>去街上走走，把喜欢的好物带回来。</p><button class="primary" data-action="continue">去逛市集 ↗</button></div>'}</div>${rows.length ? `<div class="cart-summary">${checkout ? '<div class="demo-note">模拟结账，不产生真实支付，不成立真实订单。商品均为展示样品。</div>' : '<p class="fine-print">仅结算勾选商品 · 演示无运费</p>'}<div class="total"><span>${checkout ? '模拟订单合计' : '已选商品合计'}</span><strong>¥ ${total(cart)}<small>.00</small></strong></div><button class="primary wide" data-action="${checkout ? 'confirm-order' : 'checkout'}" ${total(cart) === 0 ? 'disabled' : ''}>${checkout ? '确认生成演示订单' : '前往模拟结账'} <span>→</span></button>${checkout ? '<button class="text-button wide" data-action="cancel-checkout">取消，返回行囊</button>' : ''}</div>` : ''}</section></div>`;
    } else if (product) {
      if (detailId !== product.id) { selectedSpec = product.specs[0]; quantity = 1; detailId = product.id; }
      modal.innerHTML = `<div class="backdrop"><section class="modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${closeButton}<div class="detail-visual"><span class="eyebrow">百物细赏 / ${String(productsIndex(product.id)).padStart(2, '0')}</span><div class="product-viewer"><div class="viewer-fallback">${productArt(product)}</div></div><div class="viewer-toolbar"><span>拖动旋转 · 滚轮缩放</span><button data-action="reset-view">↺ 复位视角</button></div></div><div class="detail-copy"><p class="eyebrow">${stall!.names[market]} · 展示样品</p><h2 id="modal-title">${product.name}</h2><p class="product-story">${product.story}</p><p class="product-material">${product.detail}</p><div class="detail-price">¥ ${product.price}<small>.00</small><span>演示价格</span></div><div class="field-label">选择款式</div><div class="specs">${product.specs.map(s => `<button data-spec="${s}" class="${s === selectedSpec ? 'selected' : ''}" aria-pressed="${s === selectedSpec}">${s}</button>`).join('')}</div><div class="quantity-line"><span>数量</span><div class="quantity-control"><button data-quantity="-1" aria-label="减少数量">−</button><input aria-label="商品数量" type="number" min="1" max="99" value="${quantity}"/><button data-quantity="1" aria-label="增加数量">＋</button></div></div><button class="primary wide add-button" data-action="add">${bag} 加入行囊 <span>¥ ${product.price * quantity}</span></button><p class="fine-print">随心挑选，自由换市。此版本仅提供模拟选购。</p><div class="detail-actions"><button class="text-button" data-action="close">← 回到摊位</button><button class="text-button" data-action="cart">查看行囊 →</button></div></div></section></div>`;
      const holder = $('.product-viewer');
      const fallback = () => { viewer?.dispose(); viewer = undefined; holder.innerHTML = `<div class="viewer-fallback">${productArt(product)}<p>三维暂不可用，仍可继续挑选</p></div>`; };
      try { viewer = productViewer(holder, product, fallback); viewer.setVariant(selectedSpec === product.specs[1]); $('.viewer-fallback').hidden = true; } catch { fallback(); }
    }
    modal.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }
  function productsIndex(id: string) { return ['rattle-drum', 'clockwork-frog', 'rabbit-lamp', 'round-lamp', 'market-notebook', 'tea-bowl'].indexOf(id) + 1; }
  function updateQuantity() { const p = productById(detailId); if (!p) return; const input = root.querySelector<HTMLInputElement>('.quantity-control input'); if (input) input.value = String(quantity); const value = root.querySelector('.add-button > span'); if (value) value.textContent = `¥ ${p.price * quantity}`; }
  const click = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>('button, a[data-action]'); if (!el || !root.contains(el)) return;
    if (el.dataset.action) event.preventDefault();
    const data = el.dataset;
    if (data.time) { market = data.time as Market; if (street) navigate(pathFor()); else { scene?.setTime(market); updateTimeUI(); } }
    if (data.visit) scene?.visit(data.visit);
    if (data.product) { const url = new URL(location.href); url.searchParams.set('product', data.product); lastFocus = el; navigate(url.pathname + url.search); }
    if (data.spec) { selectedSpec = data.spec; viewer?.setVariant(selectedSpec === productById(detailId)?.specs[1]); root.querySelectorAll<HTMLElement>('[data-spec]').forEach(b => { b.classList.toggle('selected', b.dataset.spec === selectedSpec); b.setAttribute('aria-pressed', String(b.dataset.spec === selectedSpec)); }); }
    if (data.quantity) { quantity = Math.max(1, Math.min(99, quantity + Number(data.quantity))); updateQuantity(); }
    if (data.cartStep !== undefined) { const item = cart[Number(data.cartStep)]; if (item) item.quantity = Math.max(1, Math.min(99, item.quantity + Number(data.delta))); save(); render(); }
    if (data.remove !== undefined) { cart.splice(Number(data.remove), 1); save(); render(); }
    switch (data.action) {
      case 'home': navigate('/'); break;
      case 'enter': navigate(pathFor()); break;
      case 'cart': overlay('cart'); break;
      case 'guide': overlay('guide'); break;
      case 'close': close(); break;
      case 'retry': start(); break;
      case 'continue': navigate(pathFor()); break;
      case 'reset-view': viewer?.reset(); break;
      case 'greet': { scene?.play(); const s = stallById(currentStall)!; toast(market === 'night' ? `${s.hosts.night.split(' · ')[0]}向你挥挥手：「好物有灵，喜欢就多看一会儿！」` : '掌柜笑着招呼你：「慢慢挑，好物不着急。」'); break; }
      case 'add': { const p = productById(detailId); if (p) { cart = addItem(cart, { id: p.id, spec: selectedSpec, quantity, source: market }); save(); toast(`${p.name} · ${selectedSpec} 已放入行囊`); } break; }
      case 'checkout': if (total(cart) > 0) overlay('checkout'); break;
      case 'cancel-checkout': overlay('cart'); break;
      case 'confirm-order': if (total(cart) > 0) { cart = cart.filter(r => !r.selected); save(); const url = new URL(location.href); url.searchParams.set('panel', 'success'); navigate(url.pathname + url.search, true); } break;
    }
  };
  const change = (event: Event) => { const el = event.target as HTMLInputElement; if (el.dataset.select !== undefined) { const item = cart[Number(el.dataset.select)]; if (item) item.selected = el.checked; save(); render(); } if (el.matches('.quantity-control input')) { quantity = Math.max(1, Math.min(99, Math.floor(Number(el.value) || 1))); updateQuantity(); } };
  const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape' && (modal.childElementCount || currentStall)) close(); if (e.key !== 'Tab' || !modal.childElementCount) return; const items = [...modal.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href]')]; const first = items[0], last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } };
  const pointerDown = (e: PointerEvent) => { const button = (e.target as HTMLElement).closest<HTMLElement>('[data-move]'); if (button) { e.preventDefault(); button.setPointerCapture(e.pointerId); scene?.move(button.dataset.move!, true); } };
  const pointerUp = (e: PointerEvent) => { const button = (e.target as HTMLElement).closest<HTMLElement>('[data-move]'); if (button) scene?.move(button.dataset.move!, false); };
  const storage = (e: StorageEvent) => { if (e.key === 'yiwu-cart-v1') { try { cart = validateCart(JSON.parse(e.newValue ?? '[]')); render(); } catch {} } };
  root.addEventListener('click', click); root.addEventListener('change', change); root.addEventListener('pointerdown', pointerDown); root.addEventListener('pointerup', pointerUp); root.addEventListener('pointercancel', pointerUp); window.addEventListener('popstate', render); window.addEventListener('keydown', keydown); window.addEventListener('storage', storage);
  start();
  return () => { disposed = true; clearTimeout(toastTimer); viewer?.dispose(); scene?.dispose(); root.removeEventListener('click', click); root.removeEventListener('change', change); root.removeEventListener('pointerdown', pointerDown); root.removeEventListener('pointerup', pointerUp); root.removeEventListener('pointercancel', pointerUp); window.removeEventListener('popstate', render); window.removeEventListener('keydown', keydown); window.removeEventListener('storage', storage); root.replaceChildren(); };
}
