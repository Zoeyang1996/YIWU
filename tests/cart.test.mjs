import test from 'node:test';
import assert from 'node:assert/strict';
import { addItem, total, validateCart } from '../src/data/cart.ts';
test('同款同规格跨市合并，异规格分开', () => {
  let cart = addItem([], { id: 'rattle-drum', spec: '朱砂红', quantity: 2, source: 'night' });
  cart = addItem(cart, { id: 'rattle-drum', spec: '朱砂红', quantity: 3, source: 'morning' });
  cart = addItem(cart, { id: 'rattle-drum', spec: '松石绿', quantity: 1, source: 'noon' });
  assert.equal(cart.length, 2); assert.equal(cart[0].quantity, 5); assert.equal(total(cart), 168);
});
test('只结算勾选商品，取消或结算后保留未选商品', () => {
  const cart = [{ id: 'rattle-drum', spec: '朱砂红', quantity: 2, source: 'night', selected: true }, { id: 'tea-bowl', spec: '青釉', quantity: 3, source: 'morning', selected: false }];
  assert.equal(total(cart), 56); assert.equal(cart.filter(r => !r.selected)[0].quantity, 3);
  assert.deepEqual(validateCart(JSON.parse(JSON.stringify(cart))), cart);
});
test('无效本地记录不会影响数量与价格', () => {
  assert.deepEqual(validateCart(null), []);
  assert.deepEqual(validateCart([{}, null, { id: 'unknown', quantity: 1 }, { id: 'rattle-drum', spec: '朱砂红', quantity: -1 }, { id: 'rattle-drum', spec: 'fake', quantity: 1 }]), []);
  const cart = validateCart([{ id: 'tea-bowl', spec: '青釉', quantity: 999, source: 'fake', price: 1 }]);
  assert.equal(cart[0].quantity, 99); assert.equal(cart[0].source, 'noon'); assert.equal(total(cart), 4455);
});
