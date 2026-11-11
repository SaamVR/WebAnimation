import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {readLongSource,installLongSvgAssets,variants} from '../scripts/long-install-svg.mjs';
import {sketchButton} from '../src/handdrawn-buttons.mjs';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFile(resolve(root,path),'utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');
const sourceSha='cd01ccbf86bf819fc65319abc685b39b5586e113200197a859e9b87333bdb3cf';
test('LONG approved RAR source survives exactly and four-class palettes are paint-only',async()=>{
 const files=await readLongSource();
 const master=files.get('Long Button.svg').toString('utf8');
 assert.equal(sha(files.get('Long Button.svg')),sourceSha);
 assert.match(master,/viewBox="0 0 320 54"/);
 assert.equal((master.match(/<path\b/g)||[]).length,426);
 assert.equal((master.match(/<polygon\b/g)||[]).length,32);
 assert.deepEqual(Object.keys(variants),['forest','terracotta','neutral']);
 for(const tone of Object.keys(variants)){
  const text=files.get('long-button-'+tone+'.svg').toString('utf8');
  assert.equal(sha(files.get('long-button-'+tone+'.svg')),variants[tone]);
  assert.match(text,/id="BUTTON_FACE"/);
  assert.match(text,/id="BUTTON_SHADOW"/);
  assert.equal((text.match(/<path\b/g)||[]).length,426);
  assert.equal((text.match(/<polygon\b/g)||[]).length,32);
 }
});
test('LONG generated SVGs self-host at exact byte-equal build destinations',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'chapchitra-long-'));
 try{
  const report=await installLongSvgAssets(directory);
  assert.equal(report.originalSHA256,sourceSha);
  for(const [name,expected] of Object.entries(variants)){
   assert.equal(sha(await readFile(join(directory,'assets/long/long-button-'+name+'.svg'))),expected);
  }
 }finally{await rm(directory,{recursive:true,force:true})}
});
test('Long markup uses original SVG with accessible HTML labels and native actions',()=>{
 for(const [tone,asset] of [['forest','forest'],['terracotta','terracotta'],['beige','neutral']]){
  const html=sketchButton({label:'ADD TO BAG',variant:'long',tone,className:'product-add-button',attrs:'data-add-to-bag="long-test"'});
  assert.match(html,/class="cc-sketch cc-sketch--long/);
  assert.match(html,/cc-long-artwork/);
  assert.ok(html.includes('long-button-'+asset+'.svg'));
  assert.match(html,/cc-sketch-label">ADD TO BAG<\/span>/);
  assert.match(html,/data-add-to-bag="long-test"/);
  assert.doesNotMatch(html,/cc-pill-art|cc-pill-face|cc-compact-artwork/);
 }
 const link=sketchButton({label:'Editorial',variant:'long',tone:'terracotta',href:'/journal/'});
 assert.match(link,/<a href="\/journal\/"/);
 const compact=sketchButton({label:'Discover',variant:'compact',tone:'beige'});
 assert.match(compact,/cc-compact-artwork/);
 assert.ok(!compact.includes('cc-long-artwork'));
});
test('LONG editorial variants are intentionally assigned; product add remains Press Green',async()=>{
 const app=await read('src/app.mjs');
 assert.match(app,/label:'Explore hand-dye studies',variant:'long',tone:'terracotta'/);
 assert.match(app,/label:"Visit Artist's Edit",variant:'long',tone:'beige'/);
 assert.match(app,/label:'ADD TO BAG',variant:'long',tone:'forest',className:'product-add-button'/);
 assert.match(app,/data-add-to-bag/);
 assert.match(app,/labels\.forEach\(label=>label\.textContent=count===previous\?'LIMIT REACHED':'ADDED'\)/);
 assert.match(app,/clickResetTimers\.set\(add,setTimeout\(\(\)=>/);
 assert.match(app,/\},950\)\)/,'Existing shopping confirmation reset timing must remain 950ms');
});
test('Long overlay clips exact source silhouette, two swipe colors and independent fixed shadow',async()=>{
 const js=await read('src/long-button-runtime.mjs');
 const css=await read('src/button-system.css');
 assert.match(js,/clipPathUnits:'userSpaceOnUse'/);
 assert.match(js,/getAttribute\('d'\)/);
 assert.match(js,/body\.after\(shell\)/,'Graphite must paint above full face but below original outline');
 assert.match(js,/clipId='long-face-ink-'/);
 assert.match(js,/long-confirm-pending/);
 assert.match(js,/long-returning/);
 assert.match(js,/wireConfirmation\(button\)/);
 assert.match(js,/MutationObserver/);
 assert.match(js,/pointercancel/);
 assert.match(js,/lostpointercapture/);
 assert.match(js,/pageshow/);
 assert.match(css,/\.cc-long-ink-graphite\{/);
 assert.match(css,/fill:#232323/);
 assert.match(css,/\.cc-long-ink-green\{/);
 assert.match(css,/fill:#293D2D/);
 assert.match(css,/cc-long-pressed/);
 assert.match(css,/--cc-long-press:4\.5px/);
 assert.match(css,/transition:transform 300ms cubic-bezier/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(js,/scaleY\(/,'Source artwork must never be squashed');
});
test('COMPACT source and runtime stay untouched by the dedicated LONG renderer',async()=>{
 const master=await read('src/assets/compact/compact-button-approved-original.svg');
 assert.equal(sha(master),'d3a84e9f49ff2355261914d91c7607f402e0d958305102ad9b7512d5d4d8384f');
 const compact=await read('src/compact-button-runtime.mjs');
 assert.match(compact,/window\.__chapchitraCompactButtons/);
 const long=await read('src/long-button-runtime.mjs');
 assert.doesNotMatch(long,/\.cc-compact-artwork|cc-compact-pressed/);
 const html=await read('src/buttons/long/index.html');
 assert.match(html,/src="\/long-button-preview\.mjs"/);
});
