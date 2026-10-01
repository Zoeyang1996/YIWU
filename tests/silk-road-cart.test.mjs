import test from 'node:test';
import assert from 'node:assert/strict';
import { addItem, restoreCart, total, checkout } from '../demos/silk-road-cart.js';
const sample = { id:'mug', name:'脸谱马克杯', variant:'海丝纪念款', price:45, count:2 };
test('海丝行囊跨港同款合并，规格区分，刷新恢复', () => {
  let cart=addItem([],sample); addItem(cart,{...sample,count:1});
  addItem(cart,{...sample,variant:'远航礼盒款',count:1});
  cart=restoreCart(JSON.stringify(cart));
  assert.equal(cart.length,2); assert.equal(cart[0].count,3); assert.equal(total(cart),180);
});
test('模拟结账只清除勾选商品，未勾选项保留', () => {
  const cart=addItem([],sample); addItem(cart,{...sample,id:'jade',price:68,count:1});
  cart[1].selected=false; assert.equal(total(cart),90);
  const rest=checkout(cart); assert.equal(rest.length,1); assert.equal(rest[0].id,'jade'); assert.equal(total(rest),0);
});
test('海丝行囊损坏数据、异常数量和价格可恢复', () => {
  assert.deepEqual(restoreCart('broken'),[]); assert.deepEqual(restoreCart('{}'),[]);
  const cart=restoreCart(JSON.stringify([{...sample,count:1000},{...sample,price:-2},null]));
  assert.equal(cart.length,1); assert.equal(cart[0].count,99);
  addItem(cart,{...sample,count:5}); assert.equal(cart[0].count,99);
});
