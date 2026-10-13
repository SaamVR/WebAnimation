import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPreview } from '../../site/assets/gallery-previews.mjs';

const cards = [
  { id: 0, top: 120, bottom: 420, visible: true },
  { id: 1, top: 480, bottom: 820, visible: true },
  { id: 2, top: 900, bottom: 1200, visible: true }
];
test('only a visible card is eligible', () => {
  assert.equal(selectPreview(cards, 850), 0);
  assert.equal(selectPreview(cards, 850, 1), 1);
  assert.equal(selectPreview(cards, 850, 2), 0);
});
test('respects hidden filters and viewport bounds', () => {
  assert.equal(selectPreview(cards.map((c, i) => ({ ...c, hidden: i === 0 })), 850), 1);
  assert.equal(selectPreview(cards.map(c => ({ ...c, top: c.top + 1300, bottom: c.bottom + 1300 })), 850), null);
  assert.equal(selectPreview(cards, 0), null);
});
test('ignores unmeasurable or non-rendered candidates', () => {
  assert.equal(selectPreview([
    { id: 'broken', top: NaN, bottom: 300, visible: true },
    { id: 'invisible', top: 20, bottom: 200, visible: false },
    { id: 'only', top: 40, bottom: 200, visible: true }
  ], 500), 'only');
});
test('selection does not depend on incoming card order', () => {
  assert.equal(selectPreview(cards, 850), selectPreview([...cards].reverse(), 850));
});
