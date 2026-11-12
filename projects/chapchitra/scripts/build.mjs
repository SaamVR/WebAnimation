import { cp, mkdir, rm, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const src=resolve(root,'src');
const output=resolve(root,'dist');
// Validate owner-supplied back garments before publishing the two-sided editor.
// C05/C06 original button installation and the front garment pipeline remain unchanged.
const {validateBackViewAssets}=await import('./validate-worktable-back.mjs');
const backAssets=await validateBackViewAssets(root);
console.log('CHAPCHITRA four back garments verified:',backAssets);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(src,output,{recursive:true});
// C02: preserve the owner's Illustrator roller master byte-for-byte.
// The derived playback copy changes ONLY the second group's name.
const rollerBytes=await readFile(resolve(src,'assets/c02/roller-original.svg'));
const rollerSHA=createHash('sha256').update(rollerBytes).digest('hex');
if(rollerSHA!=='1c1226b902299ef7519236b582b5012f5ec918aa7571a2f8091a86db95992d73')
 throw Error('CHAPCHITRA C02 master roller checksum mismatch');
const originalSVG=rollerBytes.toString('utf8');
if(originalSVG.split('<g id="Layer_2">').length!==2||
 !originalSVG.includes('<g id="ROLLER_CYLINDER">')||
 !originalSVG.includes('#293D2D')||!originalSVG.includes('#232323'))
 throw Error('CHAPCHITRA C02 original roller layers are not as approved');
const rollerPrepared=originalSVG.replace('<g id="Layer_2">','<g id="ROLLER_FRAME">');
await writeFile(resolve(output,'assets/c02/roller-prepared.svg'),rollerPrepared,'utf8');
// C02 owner's exact original full-color transparent raster, never a
// regenerated/noise approximation. Fail closed when the source is absent;
// a successful deployment must never present a blank cover-phase PNG.
const inkAssetPath=resolve(src,'assets/c02/Ink_swipe_1.png');
const inkAssetBytes=await readFile(inkAssetPath);
const inkAssetSHA=createHash('sha256').update(inkAssetBytes).digest('hex');
if(inkAssetSHA!=='44ad9ce947981a02b161c0987bb49aad7ef29310f7e0205e1896f94a5d353336')
 throw Error('C02 owner original Ink_swipe_1.png is absent or modified: exact SHA256 required');
if(!inkAssetBytes.subarray(0,8).equals(
 Buffer.from([137,80,78,71,13,10,26,10]))||
 inkAssetBytes.readUInt32BE(16)!==2048||
 inkAssetBytes.readUInt32BE(20)!==1152)
 throw Error('C02 Ink_swipe_1.png is not the original 2048x1152 PNG');
console.log('C02 owner ink original checksum verified',inkAssetSHA);
// C02: derive a seamless loop from the checksum-pinned ORIGINAL PNG's
// densely printed interior. Alternating normal/reflected samples make each
// boundary pixel-exact, without repeating its distinctive distressed edge.
const {default:sharp}=await import('sharp');
const {C02_INK_ASSET}=await import('../src/motion/c02/ink-asset.mjs');
const interior=C02_INK_ASSET.interior;
if(interior.cropStart!==0||interior.cropWidth*2!==interior.loopWidth||
 interior.cropWidth>=1450)
 throw Error('C02 loop dimensions could repeat the unique right edge');
const interiorCrop=await sharp(inkAssetBytes).extract({
 left:interior.cropStart,top:0,width:interior.cropWidth,
 height:C02_INK_ASSET.height
}).png().toBuffer();
const reflectedCrop=await sharp(interiorCrop).flop().png().toBuffer();
const interiorLoop=await sharp({create:{
 width:interior.loopWidth,height:C02_INK_ASSET.height,channels:4,
 background:{r:0,g:0,b:0,alpha:0}
}}).composite([
 {input:interiorCrop,top:0,left:0},
 {input:reflectedCrop,top:0,left:interior.cropWidth}
]).webp({lossless:true,effort:4}).toBuffer();
await writeFile(resolve(output,'assets/c02/ink-interior-loop.webp'),interiorLoop);
console.log('C02 seamless original-PNG interior generated:',
 interiorLoop.length+' bytes',interior.loopWidth+'x'+C02_INK_ASSET.height);

// Only the cover rendering changes: roller, adaptive progress and reveal
// runtime modules remain exactly as approved.
// Prepaint cover must be installed in the HTML head, before deferred app.mjs.
// Keep all existing route controllers and cached Artist's Edit release paths intact.
const earlyC02=await readFile(resolve(src,'motion/c02/early-head.html'),'utf8');
let patchedC02Entries=0;
async function injectC02(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const full=resolve(dir,entry.name);
  if(entry.isDirectory()){await injectC02(full);continue;}
  if(!entry.isFile()||entry.name!=='index.html')continue;
  const html=await readFile(full,'utf8');
  if(!html.includes('<head>'))throw Error('C02 HTML head missing: '+full);
  if(html.includes('id="c02-early"'))throw Error('C02 prepaint duplicated: '+full);
  await writeFile(full,html.replace('<head>','<head>'+earlyC02));
  patchedC02Entries++;
 }
}
await injectC02(output);
if(patchedC02Entries<12)throw Error('C02 route entrypoint coverage incomplete: '+patchedC02Entries);
console.log('CHAPCHITRA C02 prepaint entries:',patchedC02Entries,'roller SHA:',rollerSHA);
// LONG self-hosted, source-hash-verified Illustrator long SVG variants.
const {installLongSvgAssets}=await import('./long-install-svg.mjs');
console.log('CHAPCHITRA Long SVG integrity:',await installLongSvgAssets(output));
const expected=['index.html','styles.css','app.mjs','components.mjs'];
for (const name of expected) await stat(resolve(output,name));
// Immutable 4000×2250 masters remain SHA-pinned in archive parts.
// Only checksum-verified, registered WebP delivery variants reach dist.
const { installWorktableAssets } = await import('./worktable-assets.mjs');
const artwork=await installWorktableAssets(root,output);
console.log('CHAPCHITRA exact original artwork verified:',artwork);
// Release-stamped Artist's Edit entry: every review path and its JavaScript
// dependency subtree is new on each commit. Even an iPad with an old HTML or
// manifest cache receives the correct scene at the unique direct review URL.
const release=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(!/^[0-9a-f]{40}$/.test(release))throw new Error('Invalid release commit SHA');
const releaseDir=resolve(output,'releases',release);
await mkdir(releaseDir,{recursive:true});
for(const filename of await readdir(output)){
 if(filename.endsWith('.mjs')||filename==='styles.css'||filename==='worktable-studio.css'){
  await cp(resolve(output,filename),resolve(releaseDir,filename));
 }
}
const sourceManifest=JSON.parse(await readFile(resolve(output,'assets/worktable/manifest.json'),'utf8'));
sourceManifest.__deliveryBuild=release;
const stagedManifest=JSON.stringify(sourceManifest,null,2)+'\n';
await writeFile(resolve(output,'assets/worktable/manifest.json'),stagedManifest);
await writeFile(resolve(releaseDir,'manifest.json'),stagedManifest);
const sourceHTML=await readFile(resolve(output,'artists-edit/index.html'),'utf8');
let reviewHTML=sourceHTML
 .replaceAll('../assets/worktable/','/assets/worktable/')
 .replaceAll('../worktable-studio.mjs','/releases/'+release+'/worktable-studio.mjs')
 .replaceAll('../worktable-studio.css','/releases/'+release+'/worktable-studio.css')
 .replaceAll('../styles.css','/releases/'+release+'/styles.css')
 .replaceAll('../app.mjs','/releases/'+release+'/app.mjs');
const direct='/artists-edit/review/'+release+'/';
reviewHTML=reviewHTML.replace('<body data-page="artists-edit">',
 '<body data-page="artists-edit" data-review-build="'+release+
 '" data-review-manifest="/releases/'+release+'/manifest.json"'+
 ' data-review-url="'+direct+'"'+
 ' data-review-studio-css="/releases/'+release+'/worktable-studio.css">');
if(!reviewHTML.includes('data-review-build="'+release+'"')||
 !reviewHTML.includes('/releases/'+release+'/app.mjs'))
 throw Error('Artist review version pin missing');
await writeFile(resolve(output,'artists-edit/index.html'),reviewHTML);
const directFolder=resolve(output,'artists-edit/review',release);
await mkdir(directFolder,{recursive:true});
await writeFile(resolve(directFolder,'index.html'),reviewHTML);
const summary={
 sourceSHA:release,
 canonicalPath:'/artists-edit/',
 directReviewURL:direct,
 manifestSHA256:createHash('sha256').update(stagedManifest).digest('hex'),
 runtimeScript:'/releases/'+release+'/app.mjs',
 legacyFallbackEnabled:false
};
await writeFile(resolve(releaseDir,'release.json'),JSON.stringify(summary,null,2)+'\n');
console.log('CHAPCHITRA current Artist review release:',summary);

const files=await readdir(output);
console.log('CHAPCHITRA build complete:',files.join(', '));
