// 行囊只保存商品资料，与三维对象无关。
export const CART_KEY = 'yiwu-silk-road-cart-v1';
export const quantity = value => Math.max(1, Math.min(99, Math.trunc(Number(value) || 1)));
export function restoreCart(raw) {
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.variant === 'string' && Number.isFinite(p.price) && p.price > 0).slice(0, 100).map(p => ({ id: p.id, name: p.name, variant: p.variant, price: p.price, count: quantity(p.count), selected: p.selected !== false }));
  } catch { return []; }
}
export function addItem(cart, item) {
  const found = cart.find(p => p.id === item.id && p.variant === item.variant && p.price === item.price);
  if (found) { found.count = quantity(found.count + quantity(item.count)); found.selected = true; }
  else cart.push({ ...item, count: quantity(item.count), selected: true });
  return cart;
}
export const total = cart => cart.reduce((sum, p) => sum + (p.selected ? p.price * p.count : 0), 0);
export const checkout = cart => cart.filter(p => !p.selected);
export function mountCart({ onToggle = () => {} } = {}) {
  let cart = [];
  try { cart = restoreCart(localStorage.getItem(CART_KEY)); } catch { /* 禁用存储仍可使用 */ }
  const trigger = document.createElement('button');
  trigger.className = 'bag-trigger';
  trigger.type = 'button';
  const layer = document.createElement('div');
  layer.className = 'bag-layer';
  layer.hidden = true;
  layer.innerHTML = `<section role="dialog" aria-modal="true" aria-label="远航行囊" class="bag-panel"><h2>远航行囊</h2><p>各港口共享 · 演示商品，无真实支付或发货</p><div class="bag-items"></div><footer><strong class="bag-total"></strong><button class="bag-checkout">模拟结账</button><button class="bag-confirm" hidden>确认生成模拟订单</button><button class="bag-cancel" hidden>取消结账</button><p class="bag-message" role="status"></p><button class="bag-close">继续逛逛</button></footer></section>`;
  document.body.append(trigger, layer);
  const list = layer.querySelector('.bag-items');
  const pay = layer.querySelector('.bag-checkout');
  const confirm = layer.querySelector('.bag-confirm');
  const cancel = layer.querySelector('.bag-cancel');
  const message = layer.querySelector('.bag-message');
  let previousFocus;
  function save() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { message.textContent = '浏览器未允许本地保存，本次行囊仍可使用。'; } render(); }
  function unconfirm() { confirm.hidden = cancel.hidden = true; pay.hidden = false; }
  function render() {
    trigger.textContent = `行囊 · ${cart.reduce((n, p) => n + p.count, 0)}`;
    list.replaceChildren();
    if (!cart.length) list.textContent = '行囊还空着，去港口挑一件远航纪念吧。';
    cart.forEach((p, i) => {
      const row = document.createElement('div'); row.className = 'bag-item';
      const selected = document.createElement('input'); selected.type = 'checkbox'; selected.checked = p.selected; selected.setAttribute('aria-label', `结算${p.name}`);
      selected.onchange = () => { p.selected = selected.checked; unconfirm(); save(); };
      const label = document.createElement('span'); label.textContent = `${p.name} · ${p.variant}　¥${p.price}`;
      const count = document.createElement('input'); count.type = 'number'; count.min = 1; count.max = 99; count.value = p.count; count.setAttribute('aria-label', `${p.name}数量`);
      count.onchange = () => { p.count = quantity(count.value); unconfirm(); save(); };
      const remove = document.createElement('button'); remove.textContent = '移除'; remove.onclick = () => { cart.splice(i, 1); unconfirm(); save(); };
      row.append(selected, label, count, remove); list.append(row);
    });
    layer.querySelector('.bag-total').textContent = `已选合计 ¥${total(cart)}`;
    pay.disabled = total(cart) === 0;
  }
  function close() { layer.hidden = true; unconfirm(); onToggle(false); previousFocus?.focus(); }
  trigger.onclick = () => { previousFocus = document.activeElement; message.textContent = ''; render(); layer.hidden = false; onToggle(true); layer.querySelector('.bag-close').focus(); };
  layer.querySelector('.bag-close').onclick = close;
  pay.onclick = () => { pay.hidden = true; confirm.hidden = cancel.hidden = false; message.textContent = `确认已选商品，合计 ¥${total(cart)}。仅生成本地演示订单。`; };
  cancel.onclick = () => { unconfirm(); message.textContent = '已取消结账，商品仍在行囊中。'; };
  confirm.onclick = () => { if (!total(cart)) return; cart = checkout(cart); unconfirm(); save(); message.textContent = '演示订单已生成，未产生支付或发货。'; };
  layer.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Tab') {
      const controls = [...layer.querySelectorAll('button,input')].filter(el => !el.hidden && !el.disabled);
      const first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  addEventListener('storage', e => { if (e.key === CART_KEY) { cart = restoreCart(e.newValue); unconfirm(); render(); } });
  render();
  return { add(item) { addItem(cart, item); save(); }, isOpen: () => !layer.hidden, close };
}
