import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORKTABLE_PRICE_TAG as c} from '../src/worktable-price-tag-config.mjs';
const js=readFileSync(new URL('../src/worktable-studio.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/worktable-studio.css',import.meta.url),'utf8');

test('approved desk PNG, size, desktop/tablet/mobile placement, and outer rotation are unchanged',()=>{
 assert.equal(c.assetPath,'/assets/worktable/price-tag/price-tag.png');
 assert.deepEqual(c.original,{width:312,height:142});
 assert.deepEqual(c.desktop,{x:1485,y:28,width:308,maxWidth:330});
 assert.deepEqual(c.tablet,{x:1475,y:30,width:330});
 assert.deepEqual(c.mobile,{x:0,y:0,width:330,displayWidth:235});
 assert.equal(c.rotation,0);
 assert.match(js,/tag\.append\(art,text\)/);
 assert.match(css,/transform:rotate\(var\(--cc-tag-rotation\)\)/);
 assert.match(css,/pointer-events:none/);
});
test('TOTAL + live amount use one rotated Hind Siliguri typography group',()=>{
 assert.match(js,/label\.textContent='TOTAL'/);
 assert.match(js,/text\.append\(label,amount\)/);
 assert.match(js,/amount\.textContent='৳450'/);
 assert.match(js,/for\(const node of tagPrices\)node\.textContent=formatArtistBDT\(amount\.total\)/);
 assert.match(css,/font-family:"Hind Siliguri",var\(--sans\)/);
 assert.doesNotMatch(css,/\.cc-worktable-tag-total\{[^}]*Georgia/s);
 assert.match(css,/rotate\(var\(--cc-tag-type-angle\)\)/);
 assert.equal(c.text.rotationDeg,-2.5);
 assert.equal(c.text.labelFontWeight,600);
 assert.equal(c.text.amountFontWeight,700);
 assert.ok(c.text.amountFontSizeCqw>c.text.labelFontSizeCqw);
 assert.equal(c.text.align,'center');
});
test('all tag typography properties are centralized and bind to CSS',()=>{
 for(const p of ['xPercent','yPercent','rotationDeg','labelFontSizeCqw','amountFontSizeCqw',
  'lineGapCqw','labelLetterSpacingEm','amountLetterSpacingEm',
  'labelFontWeight','amountFontWeight','labelLineHeight','amountLineHeight','align']){
  assert.ok(Object.hasOwn(c.text,p),p);
 }
 for(const v of ['--cc-tag-type-angle','--cc-tag-label-size','--cc-tag-amount-size',
  '--cc-tag-line-gap','--cc-tag-label-spacing','--cc-tag-amount-spacing',
  '--cc-tag-label-weight','--cc-tag-amount-weight']){
  assert.ok(js.includes(v),v);
 }
 assert.match(css,/\.cc-worktable-tag-label\{/);
 assert.match(css,/\.cc-worktable-tag-total\{/);
 assert.match(css,/white-space:nowrap/);
 assert.match(css,/color:#293D2D/);
});
test('invoice is unchanged and permanent',()=>{
 assert.match(js,/<section class="cc-worktable-price-breakdown cc-worktable-invoice"/);
 assert.doesNotMatch(js,/<details class="cc-worktable-price-breakdown"/);
 assert.match(js,/priceBreakdownTotal\.textContent=formatArtistBDT\(amount\.total\)/);
});
