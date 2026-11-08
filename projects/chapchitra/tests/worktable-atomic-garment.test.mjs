import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const get=async p=>readFile(resolve(root,p),'utf8');
const css=await get('src/worktable-studio.css');
const studio=await get('src/worktable-studio.mjs');

test('all six colors use one in-memory canvas surface for any garment without 24 on-disk variants',async()=>{
 const manifest=JSON.parse(await get('browser-assets/worktable/manifest.json'));
 assert.deepEqual(Object.keys(manifest.__initialScene.garments),['regular','dropShoulder','fullSleeve','hoodie']);
 assert.deepEqual(manifest.__initialScene.backplateVariants.map(v=>v.width),[768,1536,2560]);
 assert.equal(manifest.__initialScene.atomicBackplateFromLayers.length,34);
 assert.equal(manifest.__initialScene.backplateVariants.length,3);
 assert.ok(manifest.__initialScene.atomicBackplateFromLayers.every(x=>!x.includes('Tshirts/')&&!x.includes('Worker/')));
 assert.match(studio,/const colorized=async\(garment,color,index\)=>/);
 assert.match(studio,/const composeAtomicPreview=async\(colored,index\)=>/);
 assert.match(studio,/const queueGarmentVisual=\(\)=>/);
 assert.match(studio,/const finishHydration=async\(\)=>/);
 assert.match(studio,/if\(token!==switchToken\)return false/);
 assert.match(studio,/context\.getImageData\(0,0,canvas\.width,canvas\.height\)/);
 assert.match(studio,/\.26\+\.74\*value\/255/);
 assert.match(studio,/garmentSurface\.replaceWith\(colored\)/);
 assert.match(studio,/preview\.replaceWith\(scene\);preview=scene/);
 assert.ok(!studio.includes('data:image/png;base64'));
 assert.ok(!studio.includes('data:image/webp;base64'));
 assert.ok(!studio.includes('gsap.'));
 assert.ok(!studio.includes('Promise.all(garmentColors.map'));
 for(const entry of manifest.__initialScene.backplateVariants){
  const file=resolve(root,'browser-assets/worktable',entry.path);
  assert.equal((await stat(file)).size,entry.bytes);
 }
});
test('never expose white garment when another color is selected',()=>{
 assert.match(studio,/if\(token!==switchToken\)return false/);
 assert.match(studio,/const source=await loadVariant\(info,index\)/);
 assert.match(studio,/if\(garmentSurface\)garmentSurface\.replaceWith\(colored\)/);
 assert.match(studio,/visualGarment=wantedGarment;visualColor=wantedColor/);
 assert.match(studio,/await finishHydration\(\)/);
 assert.match(css,/\.cc-worktable-tint\{display:none!important/);
 assert.match(css,/\.cc-worktable-garment-surface\{position:absolute;display:block;pointer-events:none;object-fit:fill\}/);
 assert.match(studio,/printPosition\(\); \/\/ Upload placement changes together with the new garment/);
});
test('selected glow after pointer exit is exactly the hover-style glow with original lift',()=>{
 const section=s=>{
  const at=css.indexOf(s);assert.ok(at>=0,s);
  const open=css.indexOf('{',at);return css.slice(open+1,css.indexOf('}',open));
 };
 const normal=section('.cc-worktable-prop[data-group]:not([data-group="upload"]).is-selected{');
 const hovered=section('.cc-worktable-prop[data-group]:not([data-group="upload"]).is-selected.is-hovered{');
 const filter=x=>x.match(/filter:[\s\S]*?;/)?.[0].replace(/\s+/g,' ').trim();
 assert.equal(filter(normal),filter(hovered));
 for(const [group,lift] of [['garment',4.5],['size',3.5],['color',5.5],['printSize',4]]){
  assert.match(css,new RegExp('\\.cc-worktable-prop\\[data-group="'+group+'"\\]\\{--cc-selected-lift:-'+lift+'px'));
 }
 assert.ok(normal.includes('transform:translate3d(0,var(--cc-selected-lift),0)'));
 assert.match(normal,/drop-shadow\(0 0 2\.4px rgb\(248 235 204 \/ \.52\)\)/);
 assert.ok(!css.includes('box-shadow:0 0 20px'));
 assert.match(css,/\.cc-worktable-layer\[data-source="Tshirt color\/Tshirt_color_box_front_panel\.png"\]\{z-index:auto\}/);
});
test('approved Upload Artwork vector implementation and motion CSS are unchanged',async()=>{
 const original=await get('src/worktable-upload-icon.mjs');
 assert.match(original,/MOUNTAINS_SUN/);
 assert.match(original,/CIRCLE_FOR_PLUS/);
 assert.match(studio,/uploadVisible=items\.some/);
 assert.match(studio,/file\.click\(\)/);
 assert.match(css,/animation:cc-upload-float 4\.2s ease-in-out infinite/);
 assert.match(css,/\.cc-worktable-upload-svg-layer\.is-hovered \.cc-worktable-upload-float/);
});
