import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {UPLOAD_ARTWORK_SVG} from '../src/worktable-upload-icon.mjs';
import {WORKTABLE_SOURCE_STACK,WORKTABLE_PREVIEW_STACK,WORKTABLE_UPLOAD_RASTER} from '../src/worktable-studio.mjs';
const root=resolve(import.meta.dirname,'..');
const load=async path=>readFile(resolve(root,path),'utf8');

test('user-supplied original SVG is preserved byte-for-byte in source, with real named groups and 512 viewBox',async()=>{
 const raw=await readFile(resolve(root,'src/assets/worktable-upload/UPLOAD.svg'));
 assert.equal(createHash('sha256').update(raw).digest('hex'),'3ea32afbf3a1ef9d6f7ff08b5e14ba871e8bd81d54846edd672beb30cbfba1ab');
 assert.equal(raw.length,5783);
 for(const id of ['MOUNTAINS_SUN','FRAME_LINES','CIRCLE_FOR_PLUS','PLUS']){
  assert.ok(UPLOAD_ARTWORK_SVG.includes('<g id="'+id+'">'),id);
 }
 for(const color of ['#283D2D','#F6F6F4'])assert.ok(UPLOAD_ARTWORK_SVG.includes(color));
 assert.match(UPLOAD_ARTWORK_SVG,/viewBox="0 0 512 512"/);
 assert.ok(!UPLOAD_ARTWORK_SVG.includes('<script')&&!UPLOAD_ARTWORK_SVG.includes('<foreignObject'));
});

test('only the old raster upload button is omitted from compiled scene, never notebook or original archive',async()=>{
 assert.equal(WORKTABLE_SOURCE_STACK.length,39);
 assert.equal(WORKTABLE_PREVIEW_STACK.length,38);
 assert.ok(WORKTABLE_SOURCE_STACK.includes(WORKTABLE_UPLOAD_RASTER));
 assert.ok(!WORKTABLE_PREVIEW_STACK.includes(WORKTABLE_UPLOAD_RASTER));
 assert.ok(WORKTABLE_PREVIEW_STACK.includes('Upload image notebook/Upload_image_notebook_1.png'));
 assert.ok(WORKTABLE_PREVIEW_STACK.includes('Upload image notebook/Upload_image_notebook_title_2.png'));
 const M=JSON.parse(await load('browser-assets/worktable/manifest.json'));
 assert.deepEqual(M.__initialScene.generatedFromLayers,WORKTABLE_PREVIEW_STACK);
 for(const scene of Object.values(M.__initialScene.garments)){
  assert.equal(scene.variants.length,3);
  for(const variant of scene.variants)assert.match(variant.path,/assembled-(?:regular|dropShoulder|fullSleeve|hoodie)-svg3ea32afb\.w(?:768|1536|2560)\.webp/);
 }
 assert.ok((await stat(resolve(root,'browser-assets/worktable/variants/preview/assembled-regular-svg3ea32afb.w1536.webp'))).size<300000);
 await assert.rejects(()=>stat(resolve(root,'browser-assets/worktable/variants/preview/assembled-regular.w1536.webp')));
});

test('inline vector replaces only the original upload image element while hit area and handling stay unchanged',async()=>{
 const js=await load('src/worktable-studio.mjs');
 assert.ok(js.includes("im.className='cc-worktable-layer cc-worktable-prop cc-worktable-upload-svg-layer'"));
 assert.ok(js.includes('positionLayer(im,path)'));
 assert.ok(js.includes('uploadVisual=im'));
 assert.ok(js.includes('interactionImages.set(keyFor(group,value),im)'));
 assert.ok(js.includes("if(group==='upload'){file.click();return}"));
 assert.ok(js.includes("uploadButton.addEventListener('click',()=>file.click())"));
 assert.ok(js.includes("vector.querySelector('#CIRCLE_FOR_PLUS ellipse')"));
 assert.ok(js.includes("vector.querySelector('#PLUS path')"));
 assert.ok(js.includes("const syncUploadMotion=()"));
 assert.ok(js.includes("document.addEventListener('visibilitychange',syncUploadMotion)"));
 assert.ok(js.includes("uploadObserver?.observe(uploadVisual)"));
 assert.ok(js.includes("if(b.dataset.group==='upload')acknowledgeUpload()"));
 assert.ok(!js.includes('setInterval('));
 assert.ok(!js.includes('gsap.'));
});

test('idle motion is slow, offscreen-aware, reduced-motion aware, circle-only inversion and no rectangular glow',async()=>{
 const css=await load('src/worktable-studio.css');
 assert.match(css,/@keyframes cc-upload-float\{/);
 assert.match(css,/animation:cc-upload-float 4\.2s ease-in-out infinite/);
 assert.match(css,/48%\{transform:translate3d\(0,-1\.6px,0\)\}/);
 assert.ok(css.includes('.is-idle-paused .cc-worktable-upload-float'));
 assert.ok(css.includes('.is-hovered .cc-worktable-upload-float'));
 assert.match(css,/\.cc-worktable-upload-svg #CIRCLE_FOR_PLUS ellipse/);
 assert.match(css,/\.cc-worktable-upload-svg #PLUS path/);
 assert.ok(css.includes('fill:#F6F7F5'));
 assert.ok(css.includes('fill:#293D2D'));
 assert.ok(css.includes('.cc-worktable-upload-float{animation:none!important}'));
 assert.ok(css.includes(':not(.cc-worktable-upload-svg-layer){opacity:0!important}'));
 assert.ok(css.includes('.cc-worktable-upload-svg-layer{z-index:5;pointer-events:none}'));
 assert.ok(!css.includes('filter:blur('));
 assert.ok(!css.includes('box-shadow:0 0 30px'));
});
