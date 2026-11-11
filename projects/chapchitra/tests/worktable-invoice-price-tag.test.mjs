import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORKTABLE_PRICE_TAG} from '../src/worktable-price-tag-config.mjs';
const source=readFileSync(new URL('../src/worktable-studio.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/worktable-studio.css',import.meta.url),'utf8');
test('tag always uses same calculator result and has independent stage registration',()=>{
 assert.equal(WORKTABLE_PRICE_TAG.original.width,312);
 assert.equal(WORKTABLE_PRICE_TAG.original.height,142);
 assert.ok(WORKTABLE_PRICE_TAG.assetPath.endsWith('/price-tag.png'));
 assert.match(source,/for\(const node of tagPrices\)node\.textContent=formatArtistBDT\(amount\.total\)/);
 assert.match(source,/stage\.append\(stagePriceTag\)/);
 assert.match(source,/stage\.after\(mobilePriceTag\)/);
 assert.match(css,/\.cc-worktable-price-tag-stage\{display:none\}/);
 assert.match(css,/pointer-events:none/);
});
test('itemized invoice is permanent with no collapsible pricing control',()=>{
 assert.match(source,/<section class="cc-worktable-price-breakdown cc-worktable-invoice"/);
 assert.doesNotMatch(source,/<details class="cc-worktable-price-breakdown"/);
 assert.match(source,/Front print · No Print/);
 assert.match(source,/Back print · No Print/);
 assert.match(source,/which\+' print · '\+\(side\.hasArtwork\?side\.preset:'No Print'\)/);
});
