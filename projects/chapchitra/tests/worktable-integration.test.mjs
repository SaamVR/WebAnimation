import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=path=>readFile(resolve(root,path),'utf8');

test('actual owner asset ZIP maps to exactly four untrimmed 4000×2250 garments',async()=>{
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
 assert.match(source,/All artwork is used at full original 4000×2250 canvas coordinates, untrimmed/);
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

test('precisely layered artwork never intercepts click targets or crops individual sources',async()=>{
 const css=await load('src/worktable-studio.css');
 const source=await load('src/worktable-studio.mjs');
 assert.match(css,/\.cc-worktable-stage\{[^}]*aspect-ratio:16\/9/);
 assert.match(css,/\.cc-worktable-layer\{[^}]*inset:0[^}]*width:100%[^}]*height:100%[^}]*object-fit:fill[^}]*pointer-events:none/);
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
 assert.match(src,/hitFor\('Upload image notebook\/Upload_image_notebook_1\.png','upload','upload'\)/);
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

test('real PNGs are gated so existing Artist Edit route remains intact before binary transfer',async()=>{
 const app=await load('src/app.mjs');
 const assetManifestInRuntime=await import('../src/worktable-stage.mjs');
 assert.ok(assetManifestInRuntime.WORKTABLE_VIEWBOX.width===2048);
 assert.match(app,/assets\/worktable\/manifest\.json/);
 assert.match(app,/let artworkReady=false/);
 assert.match(app,/if\(artworkReady\)\{/);
 assert.match(app,/mountWorktable\(pending/);
 assert.match(app,/if\(!artworkReady\)\{/);
 assert.match(app,/id="customForm"/);
 assert.match(app,/Artist’s Edit layered worktable failed safely/);
 await assert.rejects(load('src/assets/worktable/manifest.json'),/ENOENT/,'asset manifest is intentionally not yet deployed');
});


test('worktable delays visual reveal until original full-size PNGs are decoded',async()=>{
 const app=await load('src/app.mjs');
 const stage=await load('src/worktable-studio.mjs');
 const css=await load('src/worktable-studio.css');
 assert.match(stage,/body\.className='cc-worktable is-loading'/);
 assert.match(stage,/aria-busy="true"/);
 assert.match(stage,/visualImages\.push\(img\)/);
 assert.match(stage,/await Promise\.all\(visualImages\.map\(async image=>/);
 assert.match(stage,/await image\.decode\(\)/);
 assert.match(stage,/body\.classList\.remove\('is-loading'\)/);
 assert.match(stage,/stage\.removeAttribute\('aria-busy'\)/);
 assert.match(css,/\.cc-worktable\.is-loading \.cc-worktable-layer:not\(\.cc-worktable-desk\)/);
 assert.match(css,/\.cc-worktable-loading\{/);
 assert.match(app,/originalLayout\.replaceWith\(pending\)/);
 assert.match(app,/pending\.replaceWith\(originalLayout\)/);
 assert.match(app,/sheet\?\.remove\(\)/);
});
