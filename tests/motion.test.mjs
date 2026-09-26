import test from 'node:test';
import assert from 'node:assert/strict';
import { animationStep } from '../src/scenes/motion.ts';
test('后台恢复、首次帧与计时回退保持插值有界', () => {
  for (const [now, previous] of [[16, 0], [1, 100], [1000000, 0], [0, 0]]) {
    const { dt, ease } = animationStep(now, previous);
    assert.ok(dt >= 0 && dt <= .05); assert.ok(ease >= 0 && ease <= 1);
    for (const [from, to] of [[0, 2], [2, 0], [1.6, 0]]) { const value = from + (to - from) * ease; assert.ok(value >= 0 && value <= 2); }
  }
});
