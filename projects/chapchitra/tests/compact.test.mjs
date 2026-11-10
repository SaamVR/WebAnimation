import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sketchArt,sketchButton} from '../src/handdrawn-buttons.mjs';
const root=resolve(import.meta.dirname,'..');
const read=name=>readFile(resolve(root,name),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const originalSHA='d3a84e9f49ff2355261914d91c7607f402e0d958305102ad9b7512d5d4d8384f';
const approved={
 forest:{st5:'#172419',st6:'#1F2216',st7:'#637565',st8:'#293D2D',st9:'#D8CEC2',st10:'#232323'},
 terracotta:{st5:'#1F2216',st6:'#1F2216',st7:'#6E523F',st8:'#8A503B',st9:'#D8CEC2',st10:'#232323'},
 neutral:{st5:'#8A503B',st6:'#1F2216',st7:'#637565',st8:'#A6A29B',st9:'#E4E3DE',st10:'#232323'}
};
const sourcePaint={st5:'#172419',st6:'#1F2216',st7:'#637565',st8:'#293D2D',st9:'#D8CEC2',st10:'#232323'};
test('COMPACT approved Illustrator SVG is byte exact and has independent face/shadow',async()=>{
 const original=await read('src/assets/compact/compact-button-approved-original.svg');
 assert.equal(sha(original),originalSHA);
 assert.match(original,/viewBox="0 0 164 64"/);
 for(const id of ['BUTTON_FACE','BUTTON_SHADOW','Button_Face_Inside_1_','Button_Face_Inside_4_','Button_Face_Warm_beige_border_2_','Button_Face_Outline_border_2_']){
  assert.ok(original.includes('id="'+id+'"'),id);
 }
 assert.equal((original.match(/<path\b/g)||[]).length,114);
 assert.equal((original.match(/<polygon\b/g)||[]).length,10);
});
test('COMPACT three approved variants change only original SVG paint declarations',async()=>{
 const master=await read('src/assets/compact/compact-button-approved-original.svg');
 for(const [tone,colors] of Object.entries(approved)){
  const svg=await read('src/assets/compact/compact-button-'+tone+'.svg');
  let expected=master;
  for(const [cls,old] of Object.entries(sourcePaint)){
   const before='.'+cls+'{fill:'+old+';}';
   assert.equal(expected.split(before).length-1,1);
   expected=expected.replace(before,'.'+cls+'{fill:'+colors[cls]+';}');
  }
  assert.equal(svg.split(String.fromCharCode(13)).join(''),expected.split(String.fromCharCode(13)).join(''),'Artwork geometry or paths were changed in '+tone);
  assert.ok(svg.length>=master.length,'SVG art has not been flattened');
 }
});
test('Compact uses original SVG source and semantic HTML labels',()=>{
 for(const [tone,filename] of [['forest','forest'],['terracotta','terracotta'],['beige','neutral']]){
  const text=sketchButton({label:'Shop Now',variant:'compact',tone,href:'/shop/'});
  assert.match(text,/class="cc-sketch cc-sketch--compact/);
  assert.match(text,/cc-compact-artwork/);
  assert.ok(text.includes('/assets/compact/compact-button-'+filename+'.svg'));
  assert.match(text,/<span class="cc-sketch-label">Shop Now<\/span>/);
  assert.match(text,/href="\/shop\/"/);
  assert.ok(!text.includes('cc-pill-shadow'));
 }
});
test('COMPACT long CSS pill and all inline form buttons remain byte-identical markup',()=>{
 assert.equal(sketchArt('long'),
  '<span class="cc-pill-art cc-pill-art--long" aria-hidden="true"><span class="cc-pill-shadow"></span><span class="cc-pill-face"><span class="cc-pill-wipe"></span></span></span>');
 const long=sketchButton({label:'ADD TO BAG',variant:'long',tone:'forest',className:'product-add-button',attrs:'data-add-to-bag="test"'});
 assert.ok(!long.includes('cc-compact-artwork'));
 assert.ok(long.includes('cc-pill-face'));
 assert.ok(long.includes('data-add-to-bag="test"'));
 const inline=sketchButton({label:'Search',variant:'compact',tone:'forest',className:'cc-sketch--inline',type:'submit'});
 assert.ok(!inline.includes('cc-compact-artwork'));
 assert.ok(inline.includes('cc-pill-face'));
 assert.ok(inline.includes('type="submit"'));
});
test('COMPACT CSS and runtime keep stationary shadow, exact organic ink clip, independent face and reduced motion',async()=>{
 const css=await read('src/button-system.css');
 const js=await read('src/compact-button-runtime.mjs');
 assert.match(css,/[id="BUTTON_FACE"]/);
 assert.match(css,/cc-compact-pressed/);
 assert.match(css,/cc-compact-ink/);
 assert.match(css,/clip-path/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(js,/base\.getAttribute\('d'\)/);
 assert.match(js,/clipPathUnits/);
 assert.match(js,/inside\.append\(shell\)/,'Ink must render above the 69 opaque body paths');
 assert.match(js,/shell\.setAttribute\('clip-path'/,'Ink must use a stationary silhouette clip');
 assert.match(js,/button\.blur\(\)/,'Pointer navigation clears restored focus');
 assert.match(js,/event\.persisted/,'BFCache restoration clears pointer-held state');
 assert.match(js,/event\.detail>0/,'Keyboard-triggered navigation must preserve keyboard focus');
 assert.match(js,/pointercancel/);
 assert.match(js,/lostpointercapture/);
 assert.match(js,/keydown/);
 assert.match(js,/window\.addEventListener\('blur'/);
 assert.match(js,/document\.importNode\(source,true\)/);
 assert.ok(!js.includes('scaleY('),'Face must not squash');
});
test('COMPACT website and isolated preview load one lightweight compact controller',async()=>{
 const site=await read('src/index.html');
 const preview=await read('src/buttons/compact/index.html');
 const renderer=await read('src/handdrawn-buttons.mjs');
 assert.match(renderer,/function ensureCompactRuntime\(\)/);
 assert.match(renderer,/import\('\/compact-button-runtime\.mjs'\)/);
 assert.doesNotMatch(site,/src="\/compact-button-runtime\.mjs"/,'No eager import on pages with no compact CTAs');
 assert.match(preview,/src="\/compact-button-preview\.mjs"/);
 assert.ok(!preview.includes('lottie.min.js'),'Physical press must use native CSS');
});
