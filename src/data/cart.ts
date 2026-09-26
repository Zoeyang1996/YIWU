import { productById, type Market } from './catalog.ts';
export interface CartItem { id: string; spec: string; quantity: number; selected: boolean; source: Market }
export function validateCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  const result: CartItem[] = [];
  for (const row of input) {
    if (!row || typeof row !== 'object') continue;
    const p = productById(row.id);
    if (!p || !p.specs.includes(row.spec) || !Number.isInteger(row.quantity) || row.quantity < 1) continue;
    const existing = result.find(r => r.id === row.id && r.spec === row.spec);
    const quantity = Math.min(row.quantity, 99);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else result.push({ id: p.id, spec: row.spec, quantity, selected: row.selected !== false, source: ['noon', 'night', 'morning'].includes(row.source) ? row.source : 'noon' });
  }
  return result;
}
export function addItem(cart: CartItem[], item: Omit<CartItem, 'selected'>) {
  return validateCart([...cart, { ...item, selected: true }]);
}
export function total(cart: CartItem[]) { return cart.filter(r => r.selected).reduce((sum, r) => sum + (productById(r.id)?.price ?? 0) * r.quantity, 0); }
