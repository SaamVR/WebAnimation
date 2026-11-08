import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=path=>readFile(resolve(root,path),'utf8');

test('original owner artwork remains immutable while trimmed browser variants are independently traceable',async()=>{
 const meta=JSON.parse(await load('docs/ARTISTS_EDIT_ASSET_ALPHA_MANIFEST.json'));
 const source=await load('src/worktable-studio.mjs');
 const garments=[
  'Tshirts/walnut_table_background_exact_tone_4K_1.png',
  'Tshirts/walnut_table_background_exact_tone_4K_2.png',
  'Tshirts/walnut_table_background_exact_tone_4K-3.png',
  'Tshirts/walnut_table_background_exact_tone_4K-4.png'
 ];
 assert.equal(Object.keys(meta).length,47);
 for(const path of garments){
  assert.deepEqual(meta[path].original,[4000,2250]);
  assert.match(meta[path].sha256,/^[a-f0-9]{64}$/);
  assert.ok(source.includes(path));
 }
 assert.ok(source.includes('Artist-edit-backdrop-1.png'));
 assert.match(source,/Immutable 4000×2250 artwork is registered on the same 2048×1152 stage/);
 assert.match(source,/img\.className='cc-worktable-layer '/);
 assert.match(source,/img\.dataset\.source=path/);
});

test('every required interactive control uses original full-canvas overlay and exact alpha box',async()=>{
 const m=JSON.parse(await load('docs/ARTISTS_EDIT_ASSET_ALPHA_MANIFEST.json'));
 const source=await load('src/worktable-studio.mjs');
 const groups=[
  [/^Size\/Tshirt_size_(?:S|M|L|XL|XXL)_[2-6]\.png$/,5],
  [/^Garment style\/Garment_style_[1-4]_(?:regular|drop_shoulder|full_sleeve|hoodie)\.png$/,4],
  [/^Tshirt color\/Tshirt_color_[1-6]\.png$/,6],
  [/^Print size\/Print_size_A[34]_[12]\.png$/,2],
  [/^Worker\/Mini_worker_1(?:\.pn[23])?\.png$/,3]
 ];
 for(const [re,count] of groups)assert.equal(Object.keys(m).filter(name=>re.test(name)).length,count,String(re));
 assert.match(source,/const b=manifest\[path\]\.bbox/);
 assert.match(source,/const x=Math\.max\(0,b\[0\]-7\)/);
 assert.match(source,/percent\(x,2048\)/);
 assert.match(source,/aria-pressed/);
 assert.match(source,/aria-label/);
 assert.match(source,/data-group/);
 assert.match(source,/addEventListener\('pointerenter'/);
});

test('alpha-trimmed layers use shared stage coordinates and never intercept click targets',async()=>{
 const css=await load('src/worktable-studio.css');
 const source=await load('src/worktable-studio.mjs');
 assert.match(css,/\.cc-worktable-stage\{[^}]*aspect-ratio:16\/9/);
 assert.match(css,/\.cc-worktable-layer\{[^}]*object-fit:fill[^}]*pointer-events:none/);
 assert.match(source,/img\.style\.left=percent\(box\[0\],2048\)/);
 assert.match(source,/img\.style\.top=percent\(box\[1\],1152\)/);
 assert.match(css,/\.cc-worktable-hit\{[^}]*left:var\(--x\)[^}]*top:var\(--y\)[^}]*width:var\(--w\)/);
 assert.doesNotMatch(source,/\b(?:crop|resizeBitmap|createImageBitmap)\(/);
 assert.match(source,/for\(const path of ALL\.workers\)addImage\(path,'cc-worktable-worker'\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('local upload stays local, restricts MIME and size, revokes object URLs, supports pointer and keyboard',async()=>{
 const src=await load('src/worktable-studio.mjs');
 assert.match(src,/accept="image\/png,image\/jpeg,image\/webp"/);
 assert.match(src,/fileObj\.size>10\*1024\*1024/);
 assert.match(src,/URL\.createObjectURL\(fileObj\)/);
 assert.match(src,/URL\.revokeObjectURL\(artURL\)/);
 assert.match(src,/img\.naturalWidth>8192\|\|img\.naturalHeight>8192/);
 assert.match(src,/dragLayer\.addEventListener\('pointermove'/);
 assert.match(src,/dragLayer\.addEventListener\('keydown'/);
 assert.match(src,/aria-label','Drag uploaded artwork to reposition'/);
 assert.match(src,/scale\.addEventListener\('input'/);
 assert.doesNotMatch(src,/\bfetch\('https?:\/\/|\.send\(|navigator\.sendBeacon|localStorage\.setItem/);
});

test('upload notebook and accessible mobile upload action remain available',async()=>{
 const [src,css]=await Promise.all([load('src/worktable-studio.mjs'),load('src/worktable-studio.css')]);
 assert.match(src,/id="worktableUploadArt" aria-label="Upload your artwork"/);
 assert.match(src,/uploadButton\.addEventListener\('click',\(\)=>file\.click\(\)\)/);
 assert.ok(!src.includes("hitFor('Upload image notebook/Upload_image_notebook_1.png','upload','upload')"));
 assert.ok(src.includes('Only the illustrated plus/upload image is a hotspot'));
 assert.ok(src.includes('hitFor(path,group,value)'));
 assert.match(css,/\.cc-worktable-upload-row #worktableUploadArt\{background:var\(--cc-press\)/);
 assert.match(css,/\.cc-worktable-hit:not\(\[data-group="upload"\]\)\{display:none\}/);
 assert.doesNotMatch(css,/\.cc-worktable-hit\{display:none\}/);
});

test('print size preview is conservatively limited until production masks/specs arrive',async()=>{
 const src=await load('src/worktable-studio.mjs');
 assert.match(src,/Math\.SQRT1_2/);
 assert.match(src,/chestGuide/);
 assert.match(src,/editor\.scale=clamp\(editor\.scale,\.5,1\)/);
 assert.match(src,/maxArtBox/);
 assert.match(src,/maskImage=/);
 assert.match(src,/fabric-color accuracy require manufacturer calibration/);
});

test('manifest is validated without stale-cache reuse and never silently falls back to old configurator',async()=>{
 const app=await load('src/app.mjs');
 const assetManifestInRuntime=await import('../src/worktable-stage.mjs');
 assert.ok(assetManifestInRuntime.WORKTABLE_VIEWBOX.width===2048);
 assert.match(app,/assets\/worktable\/manifest\.json/);
 assert.match(app,/let artworkReady=false/);
 assert.match(app,/if\(artworkReady\)\{/);
 assert.match(app,/mountWorktable\(pending/);
 assert.doesNotMatch(app,/if\(!artworkReady\)\{/);
 assert.match(app,/cache:'no-store'/);
 assert.match(app,/MANIFEST_VALIDATION_FAILED/);
 assert.match(app,/WORKTABLE_RENDER_FAILED/);
 assert.match(app,/previous\.style\.display='none'/);
 assert.match(app,/id="customForm"/);
 assert.match(app,/Illustrated worktable unavailable/);
 await assert.rejects(load('src/assets/worktable/manifest.json'),/ENOENT/,'asset manifest is intentionally not yet deployed');
});


test('complete compiled first frame reveals before independent bounded decoded layers',async()=>{
 const app=await load('src/app.mjs');
 const stage=await load('src/worktable-studio.mjs');
 const css=await load('src/worktable-studio.css');
 assert.match(stage,/body\.className='cc-worktable is-loading is-hydrating'/);
 assert.match(stage,/aria-busy="true"/);
 assert.match(stage,/visualImages\.push\(img\)/);
 assert.doesNotMatch(stage,/await Promise\.all\(visualImages\.map/);
 assert.match(stage,/await preview\.decode\(\)/);
 assert.match(stage,/await Promise\.all\(\[worker\(\),worker\(\)\]\)/);
 assert.match(stage,/void hydrate\(\)/);
 assert.match(stage,/body\.classList\.remove\('is-hydrating'\)/);
 assert.match(stage,/body\.classList\.remove\('is-loading'\)/);
 assert.match(stage,/stage\.removeAttribute\('aria-busy'\)/);
 assert.match(css,/\.cc-worktable\.is-hydrating \.cc-worktable-layer:not\(\.cc-worktable-preview\)/);
 assert.match(css,/\.cc-worktable-loading\{/);
 assert.match(app,/previous\.replaceWith\(pending\)/);
 assert.doesNotMatch(app,/pending\.replaceWith\(originalLayout\)/);
 assert.match(app,/diagnostic\('WORKTABLE_RENDER_FAILED',error\)/);
 assert.doesNotMatch(app,/method:'HEAD'/);
});


test('all 43 optimized runtime assets preserve source SHA, original position and three transparent WebP sizes',async()=>{
 const {stat,readFile}=await import('node:fs/promises');
 const {createHash}=await import('node:crypto');
 const src=JSON.parse(await load('docs/ARTISTS_EDIT_ASSET_ALPHA_MANIFEST.json'));
 const delivery=JSON.parse(await load('browser-assets/worktable/manifest.json'));
 const names=Object.keys(delivery).filter(x=>x!=='__initialScene');
 assert.equal(names.length,43);
 const s=2048/4000;
 let aggregateBytes=0;
 for(const name of names){
  const original=src[name], next=delivery[name];
  assert.equal(original.sha256,next.sha256);
  assert.deepEqual(original.bbox,next.bbox);
  assert.deepEqual(original.original,[4000,2250]);
  const [x,y,w,h]=next.delivery.crop;
  assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=4000&&y+h<=2250);
  const b=next.delivery.stageBox;
  assert.ok(Math.abs(b[0]-x*s)<1e-4);
  assert.ok(Math.abs(b[1]-y*s)<1e-4);
  assert.ok(Math.abs(b[2]-w*s)<1e-4);
  assert.ok(Math.abs(b[3]-h*s)<1e-4);
  assert.equal(next.delivery.variants.length,3);
  for(const v of next.delivery.variants){
   const buffer=await readFile(resolve(root,'browser-assets/worktable',v.path));
   assert.equal(buffer.toString('ascii',0,4),'RIFF');
   assert.equal(buffer.toString('ascii',8,12),'WEBP');
   assert.equal(buffer.length,v.bytes);
   assert.equal(createHash('sha256').update(buffer).digest('hex'),v.sha256);
   aggregateBytes+=buffer.length;
  }
 }
 assert.ok(aggregateBytes<3*1024*1024,'all 129 variants should be under 3MiB total');
 assert.ok(!names.some(x=>x.startsWith('Full composition/')),'QA composites must never ship to runtime');
});

test('assembled initial scene is made only from source runtime layers, not reference compositions',async()=>{
 const delivery=JSON.parse(await load('browser-assets/worktable/manifest.json'));
 const {WORKTABLE_SOURCE_STACK,WORKTABLE_PREVIEW_STACK,WORKTABLE_UPLOAD_RASTER}=await import('../src/worktable-studio.mjs');
 assert.deepEqual(delivery.__initialScene.generatedFromLayers,WORKTABLE_PREVIEW_STACK);
 assert.equal(WORKTABLE_SOURCE_STACK.length,39,'owner master SHA archive unchanged');
 assert.equal(WORKTABLE_PREVIEW_STACK.length,38,'only raster upload icon removed from assembled scene');
 assert.equal(WORKTABLE_SOURCE_STACK.includes(WORKTABLE_UPLOAD_RASTER),true);
 assert.equal(WORKTABLE_PREVIEW_STACK.includes(WORKTABLE_UPLOAD_RASTER),false);
 assert.equal(delivery.__initialScene.variants.length,3);
 const bytes=delivery.__initialScene.variants.reduce((s,v)=>s+v.bytes,0);
 assert.ok(bytes<1200000,'all three assembled previews should total below 1.2 MB');
 for(const garment of ['regular','dropShoulder','fullSleeve','hoodie']){
  const scene=delivery.__initialScene.garments[garment];
  assert.equal(scene.variants.length,3,'the '+garment+' complete scene must have all responsive variants');
  assert.ok(scene.variants.every(v=>v.path.includes('assembled-'+garment)),'each variant belongs to the correct garment');
 }

});

test('master archive is verified but never shipped as original 4K PNGs',async()=>{
 const builder=await load('scripts/worktable-assets.mjs');
 assert.match(builder,/createHash\('sha256'\)\.update\(buf\)/);
 assert.match(builder,/optimizedRoot/);
 assert.match(builder,/originalPNGsPublished:0/);
 assert.match(builder,/if\(originalsOnly\)\{/);
 assert.match(builder,/await cp\(optimizedRoot,resolve\(output,'assets\/worktable'\)/);
});

test('new renderer keeps UI live while images hydrate and reuses cropped garment mask',async()=>{
 const source=await load('src/worktable-studio.mjs');
 assert.match(source,/const loadOne=async img=>/);
 assert.match(source,/const errors=\[\]/);
 assert.match(source,/trial\.decode\(\)/);
 assert.match(source,/updateTintMask\(\)/);
 assert.match(source,/sourceSet\(info\.variants\)/);
 assert.match(source,/img\.sizes=sizesFor/);
 assert.match(source,/announce\('This garment image is temporarily unavailable/);
 assert.match(source,/const swapPreview=async/);
 assert.match(source,/if\(!hydrated\)return swapPreview/);
});


test('four complete previews offer all responsive widths and safe deferred switching',async()=>{
 const assets=JSON.parse(await load('browser-assets/worktable/manifest.json'));
 const src=await load('src/worktable-studio.mjs');
 assert.deepEqual(Object.keys(assets.__initialScene.garments),['regular','dropShoulder','fullSleeve','hoodie']);
 for(const [garment,info] of Object.entries(assets.__initialScene.garments)){
  assert.equal(info.variants.length,3);
  assert.deepEqual(info.variants.map(v=>v.width),[768,1536,2560]);
  for(const v of info.variants){
   const bytes=await readFile(resolve(root,'browser-assets/worktable',v.path));
   assert.equal(bytes.length,v.bytes);
  }
 }
 assert.match(src,/const swapPreview=async\(wanted,token\)=>/);
 assert.match(src,/if\(!hydrated\)return swapPreview\(wanted,token\)/);
 assert.match(src,/preview\.replaceWith\(next\);preview=next/);
 const css=await load('src/worktable-studio.css');
 assert.match(css,/\.cc-worktable\.is-hydrating \.cc-worktable-print\{z-index:6\}/);
 assert.match(css,/\.cc-worktable\.is-hydrating \.cc-worktable-tint\{z-index:5\}/);
});
test('worktable critical image is preloaded and manifest is reused once',async()=>{
 const [html,app,studio]=await Promise.all([load('src/artists-edit/index.html'),load('src/app.mjs'),load('src/worktable-studio.mjs')]);
 assert.match(html,/rel="preload" as="image".*assembled-regular/);
 assert.match(html,/rel="modulepreload" href="\.\.\/worktable-studio.mjs"/);
 assert.match(app,/artworkManifest=entries/);
 assert.match(app,/manifestData:artworkManifest/);
 assert.match(studio,/if\(!manifest\)/);
});


test('release build stages immutable versioned JavaScript manifest and review URL',async()=>{
 const src=await load('scripts/build.mjs');
 for(const requirement of [
  /execFileSync\('git',\['rev-parse','HEAD'\]/,
  /const releaseDir=resolve\(output,'releases',release\)/,
  /sourceManifest\.__deliveryBuild=release/,
  /data-review-manifest/,
  /artists-edit\/review/,
  /manifestSHA256/,
 ])assert.match(src,requirement);
 const app=await load('src/app.mjs');
 assert.match(app,/entries\.__deliveryBuild!==build/);
 assert.match(app,/const response=await fetch\(manifestURL,\{cache:'no-store'\}\)/);
 assert.doesNotMatch(app,/cache:'force-cache'/);
 assert.match(app,/previous\.hidden=true/);
 assert.match(app,/data.*review/i);
 const html=await load('src/artists-edit/index.html');
 assert.match(html,/body\[data-page="artists-edit"\] \.customize-layout\[hidden\]/);
});



test('physical stage buttons render silhouette shadows without rectangular hitbox outlines',async()=>{
 const css=await load('src/worktable-studio.css');
 const src=await load('src/worktable-studio.mjs');
 assert.ok(css.includes('.cc-worktable-prop[data-group]{'));
 assert.ok(css.includes('filter:drop-shadow(1.25px 2.5px 1.2px'));
 assert.ok(css.includes('.cc-worktable-hit::after{content:none}'));
 assert.ok(!css.includes('.cc-worktable-hit[aria-pressed=true]::after'));
 assert.ok(!css.includes('border-style:dashed'));
 assert.ok(!css.includes('border:1px dashed'));
 assert.ok(src.includes('interactionImages=new Map()'));
 assert.ok(src.includes("window.matchMedia('(hover:hover) and (pointer:fine)')"));
 assert.ok(src.includes("img.classList.toggle('is-selected'"));
 assert.ok(src.includes("event.pointerType==='touch'"));
 assert.ok(src.includes('is-keyboard-focus'));
 assert.ok(!src.includes("hitFor('Upload image notebook/Upload_image_notebook_1.png'"));
});

test('paint pot front panel remains in front and reduced motion disables transforms',async()=>{
 const src=await load('src/worktable-studio.mjs');
 const css=await load('src/worktable-studio.css');
 const pots=src.indexOf("['Tshirt color/Tshirt_color_");
 const front=src.indexOf("['Tshirt color/Tshirt_color_box_front_panel.png']");
 assert.ok(pots>=0&&front>pots,'front panel remains later in source layer ordering');
 assert.ok(css.includes('Keep the tray-front illustration ABOVE the pot edges'));
 assert.ok(css.includes('Tshirt_color_box_front_panel.png"]{z-index:auto}'));
 assert.ok(!css.includes('cc-worktable-prop[data-group="color"]{z-index:'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('.cc-worktable-prop[data-group]{transform:none!important}'));
});
