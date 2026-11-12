import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const studio=source('worktable-studio.mjs');
const css=source('worktable-studio.css');
const geometry=source('worktable-print-placement.mjs');
const compact=source('handdrawn-buttons.mjs');

test('A4 handle uses a true four-way inline SVG, not a platform emoji',()=>{
 assert.match(studio,/frameHandle\.innerHTML='<svg class="cc-worktable-frame-move-icon"/);
 assert.match(studio,/viewBox="0 0 24 24"/);
 assert.match(studio,/M12 3v18M3 12h18/);
 assert.match(studio,/aria-hidden="true" focusable="false"/);
 assert.doesNotMatch(studio,/frameHandle\.textContent='↕'/);
 assert.match(css,/\.cc-worktable-frame-handle\{[\s\S]*?width:44px;height:44px/);
 assert.match(css,/color:var\(--color-gallery-white,#f6f7f5\)/);
 assert.match(css,/background:var\(--color-press-green,#293d2d\)/);
 assert.match(css,/\.cc-worktable-frame-move-icon\{[\s\S]*?pointer-events:none/);
});

test('Existing frame handle pointer drag/keyboard logic stays connected',()=>{
 for(const event of ['pointerdown','pointermove','pointerup','pointercancel','keydown']){
  assert.ok(studio.includes("frameHandle.addEventListener('"+event+"'"),event);
 }
 assert.match(studio,/frameHandle\.setPointerCapture\(e\.pointerId\)/);
 assert.match(studio,/printPosition\(\);indicatePlacement\(\)/);
 assert.match(geometry,/const a3=printableRegion\(garment\)/);
 assert.match(geometry,/if\(preset==='A3'\)return/);
 assert.match(geometry,/frameX:x-homeX,frameY:y-homeY/);
});

test('Front/back reuses exact approved compact renderer, never a new faux pill',()=>{
 assert.match(studio,/import \{ sketchButton \} from '\.\/handdrawn-buttons\.mjs'/);
 assert.match(studio,/sketchButton\(\{label:'View back',variant:'compact',[\s\S]*?tone:'beige',className:'cc-worktable-view-button'/);
 assert.match(compact,/compact-button-\+'\+color\+'\.svg/);
 assert.match(studio,/stage\.append\(viewRow\)/);
 assert.match(studio,/viewButton\.querySelectorAll\('\.cc-sketch-label,\.cc-sketch-label-ink'\)/);
 assert.match(studio,/viewButton\.querySelectorAll\('\.cc-worktable-view-label'\)/);
 assert.match(studio,/viewButton\.setAttribute\('aria-label',view==='front'\?'View back':'View front'\)/);
 assert.match(css,/font-family:'Hind Siliguri'/);
 assert.match(css,/font-size:16\.5px/);
 assert.match(css,/\.cc-worktable-view-button\.cc-sketch\.cc-compact-artwork\{/);
 assert.doesNotMatch(css,/\.cc-worktable-view-button::before/);
 assert.doesNotMatch(css,/clip:rect\(0 0 0 0\)/);
});

test('Compact view control retains fully native target, responsive text and reduced motion',()=>{
 assert.match(css,/\.cc-worktable-view-button\{[\s\S]*?min-height:44px;pointer-events:auto/);
 assert.match(css,/\.cc-worktable-view-row\{\s*position:absolute;left:50%;bottom:2\.3%;z-index:8/);
 assert.match(css,/@media\(min-width:601px\) and \(max-width:1050px\)/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.cc-worktable-view-label\{white-space:nowrap\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(studio,/viewButton\.addEventListener\('click',async\(\)=>/);
});
