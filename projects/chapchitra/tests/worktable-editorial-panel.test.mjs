import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const [source,css,brand,pigment]=await Promise.all([
 read('src/worktable-studio.mjs'),read('src/worktable-studio.css'),
 read('src/styles.css'),read('src/worktable-fabric-pigments.mjs'),
]);
test('uses authoritative CHAPCHITRA tokens and both approved typography families',()=>{
 for(const [name,hex] of [
  ['--color-gallery-white','#F6F7F5'],
  ['--color-press-green','#293D2D'],
  ['--color-terracotta','#8A503B'],
  ['--color-warm-beige','#D8CEC2'],
  ['--color-cream','#E4E3DE']
 ])assert.ok(brand.includes(name+':'+hex));
 assert.ok(brand.includes('--serif:"Noto Serif Bengali"'));
 assert.ok(brand.includes('--sans:"Hind Siliguri"'));
 assert.ok(css.includes('font:500 clamp(30px,3.5vw,43px)/1.16 var(--serif)'));
 assert.ok(css.includes('font:600 11.5px/1.32 var(--sans)'));
});
test('manual panel is editorial hierarchy, retains accessible native fieldsets and all 17 choices',()=>{
 for(const title of ['Customize your print','Your artwork','Garment style','Fabric color','Print size','Size']){
  assert.ok(source.includes(title),title);
 }
 for(const id of ['worktableCustomizeHeading','worktableArtworkHeading','worktableUploadArt','worktableArtScale',
  'worktableScaleOutput','worktableResetArt','worktableRemoveArt','worktableMessage']){
  assert.ok(source.includes(id),id);
 }
 assert.match(source,/document\.createElement\('fieldset'\)/);
 assert.match(source,/document\.createElement\('legend'\)/);
 assert.match(source,/b\.setAttribute\('aria-pressed','false'\)/);
 assert.match(source,/if\(group==='color'\)\{/);
 assert.match(source,/buttons\.dataset\.controlGroup=group/);
 assert.match(source,/field\.append\(legend,descriptionNode,buttons\)/);
 assert.match(css,/\.cc-worktable-field\{[\s\S]*?border:0;/);
 assert.ok(!css.includes('border:1px solid var(--cc-line);padding:12px;background:var(--cc-page)'));
});
test('six new visual swatches derive from calibrated FABRIC pigments without modifying illustrated pots',()=>{
 assert.match(source,/b\.style\.setProperty\('--cc-fabric-swatch',FABRIC_PIGMENTS\[value\]\.midtone\)/);
 assert.match(source,/dot\.setAttribute\('aria-hidden','true'\)/);
 for(const [c,hex] of Object.entries({
  black:'#222629',white:'#ffffff',red:'#DE1F30',yellow:'#F3C916',blue:'#145FCE',green:'#087B47'
 })){
  assert.ok(pigment.includes(c+":Object.freeze({midtone:'"+hex+"'"),c);
 }
 for(const hex of ['#292b2a','#bf3846','#e1bc33','#2a6ea9','#317452']){
  assert.ok(source.includes(hex),'Original illustrated paint pot unchanged '+hex);
 }
});
test('panel and worktable share reducer and update semantics, with no separate control state',()=>{
 assert.match(source,/const buttons=\[\.\.\.root\.querySelectorAll\('\[data-group\]\[data-value\]'\)\]/);
 assert.match(source,/current=worktableReducer\(current,\{type:'select',group,value\}\)/);
 assert.match(source,/paintSelection\(group==='garment'\);syncPricing\(\);announce/);
 assert.match(source,/if\(group==='garment'\|\|group==='color'\)void queueGarmentVisual\(\)/);
 assert.match(source,/for\(const b of buttons\)\{\s*b\.addEventListener\('click'/);
 assert.match(source,/img\.classList\.toggle\('is-selected'/);
 assert.match(source,/b\.setAttribute\('aria-pressed',String\(checked\)\)/);
 assert.ok(!source.includes('panelSelectedState'));
});
test('native artwork-management handlers and production disclaimer remain intact',()=>{
 for(const code of [
  "uploadButton.addEventListener('click',()=>file.click())",
  "file.addEventListener('change',async()=>{",
  "scale.addEventListener('input',()=>{",
  "reset.addEventListener('click',()=>{",
  "remove.addEventListener('click',()=>{",
  "announce('Artwork loaded locally at 0%",
  "Confirm production dimensions and image quality before printing."
 ])assert.ok(source.includes(code),code);
 assert.match(css,/\.cc-worktable-upload-row #worktableUploadArt\{\s*width:100%;background:var\(--color-press-green\)/);
 assert.match(css,/\.cc-worktable-upload-row button:disabled\{opacity:\.42;cursor:not-allowed\}/);
});
test('four/two/one responsive columns, >=44px controls and visible focus styles are defined',()=>{
 assert.match(css,/grid-template-columns:minmax\(0,1\.24fr\).*minmax\(0,\.68fr\)/);
 assert.match(css,/@media\(max-width:1100px\)\{/);
 assert.match(css,/\.cc-worktable-rail\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:600px\)\{/);
 assert.match(css,/\.cc-worktable-rail\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/min-height:47px/);
 assert.match(css,/\.cc-worktable-choice:focus-visible\{[\s\S]*?outline:2px solid var\(--color-terracotta\)/);
 assert.match(css,/\.cc-worktable-upload-row button:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('approved renderer, focus and upload SVG implementation references remain in place',()=>{
 assert.match(source,/applyFabricPigmentToRGBA\(imageData\.data,garment,color\)/);
 assert.match(source,/if\(garmentSurface\)garmentSurface\.replaceWith\(colored\)/);
 assert.match(source,/if\(token!==switchToken\)return false/);
 assert.match(source,/uploadVisual\.classList\.add\('is-upload-acknowledged'\)/);
 assert.match(css,/\.cc-worktable-prop\[data-group\]:not\(\[data-group="upload"\]\)\.is-selected\{/);
 assert.match(css,/\.cc-worktable-upload-float\{animation:none!important\}/);
});
