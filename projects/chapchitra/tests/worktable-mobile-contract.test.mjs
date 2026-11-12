import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(name)=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const mobile=src('worktable-mobile.mjs'),studio=src('worktable-studio.mjs');
const css=src('worktable-studio.css'),geometry=src('worktable-print-placement.mjs');

test('Portrait mobile has five category controls and one illustrated popup, no second reducer',()=>{
 assert.match(mobile,/const MOBILE_QUERY='\(max-width: 600px\)'/);
 assert.match(mobile,/GROUPS=\['garment','color','size','printSize','upload'\]/);
 for(const group of ['garment','color','size','printSize','upload'])
  assert.ok(mobile.includes(group),"missing "+group);
 assert.match(mobile,/role','dialog'/);
 assert.match(mobile,/aria-expanded/);
 assert.match(mobile,/if\(active===group\)\{closePopup/);
 assert.match(mobile,/file\.click\(\)/);
 assert.doesNotMatch(mobile,/worktableReducer|calculateArtistPrice|new WeakMap/);
});

test('Mobile 9:16 uses uniform source stage, not mutable print coordinates',()=>{
 assert.match(css,/\.cc-worktable-frame\.cc-mobile-frame-ready\{[\s\S]*?aspect-ratio:9\/16/);
 assert.match(css,/\.cc-worktable-stage\{[\s\S]*?width:128%;height:auto;aspect-ratio:16\/9/);
 assert.match(css,/\.cc-worktable\.cc-mobile-editing \.cc-worktable-stage\{[\s\S]*?transform:scale\(1\.65\)/);
 assert.match(mobile,/sourceInfo/);
 assert.match(studio,/const factor=2048\/stageRect\.width/);
 assert.match(geometry,/export function placementGeometry/);
 assert.doesNotMatch(mobile,/editor\.frameX|editor\.frameY|editor\.rotation|editor\.adjustment/);
});

test('Only phone UI receives mobile controls; existing desktop and iPad remain hidden',()=>{
 assert.match(css,/@media\(max-width:600px\)\{/);
 assert.match(css,/@media\(min-width:601px\)\{[\s\S]*?\.cc-mobile-decorations/);
 assert.match(mobile,/media\.matches/);
 assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
 assert.match(css,/min-width:44px;min-height:44px/);
 assert.match(css,/\.cc-mobile-category-button:is\(:hover,:active,:focus-visible,\.is-active\)/);
 assert.match(mobile,/Escape/);
});

test('Zoom retains actual editor controls, without creating another print transform pipeline',()=>{
 assert.match(studio,/mobileUI\.enterZoom\(\)/);
 assert.match(mobile,/selectArtwork\(\)/);
 assert.match(mobile,/refreshPlacement\(\)/);
 assert.match(mobile,/done\.addEventListener\('click',exitZoom\)/);
 assert.match(css,/\.cc-worktable\.cc-mobile-editing \.cc-worktable-stage \.cc-worktable-art-tools\{/);
 assert.match(studio,/if\(mobileUI\?\.isZoomed\(\)&&t\.closest\?\.\('\.cc-mobile-zoom-done'\)\)return/);
 assert.doesNotMatch(mobile,/setPointerCapture|pointermove|calculateArtistPrice/);
});
