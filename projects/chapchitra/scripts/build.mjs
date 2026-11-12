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
// C02 — only the exact owner-authored vector may supply the visible ink.
// No rasterization, original-PNG extensions, tiling, mirroring or quilting.
const {C02_INK_ASSET}=await import('../src/motion/c02/ink-asset.mjs');
const inkSVGPath=resolve(src,'assets/c02/texture.svg');
const inkVectorBytes=await readFile(inkSVGPath);
const inkSVGHash=createHash('sha256').update(inkVectorBytes).digest('hex');
if(inkSVGHash!==C02_INK_ASSET.sourceSHA256)
 throw Error('C02 owner vector source changed or is absent');
const inkSource=inkVectorBytes.toString('utf8');
if(!inkSource.includes('viewBox="0 0 8192 1152"')||
 (inkSource.match(/<path\b/g)||[]).length!==727||
 !inkSource.includes('.st0{fill:#293D2D;}')||
 /<image\b|<foreignObject\b|<script\b/i.test(inkSource))
 throw Error('C02 original vector geometry/color or safety checks failed');
// Strip Adobe Illustrator's *unused namespace declaration* only.
// Preserve every d attribute, CSS class, group, fill and source path.
// Store original unchanged in src; serve a smaller metadata-free SVG.
const vectorDelivery=inkSource.replace(
 ' xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"','')
 .replace('<style type="text/css">','<style>');
if((vectorDelivery.match(/<path\b/g)||[]).length!==727||
 vectorDelivery.match(/\sd="/g)?.length!==inkSource.match(/\sd="/g)?.length)
 throw Error('C02 vector-delivery optimization altered paths');
await writeFile(resolve(output,'assets/c02/texture.svg'),vectorDelivery,'utf8');
console.log('C02 exact hand-illustrated SVG source verified',{
 sha256:inkSVGHash,paths:727,
 originalBytes:inkVectorBytes.length,deliveryBytes:Buffer.byteLength(vectorDelivery)
});
// Preserve the archived owner PNG as a nonreferenced historical asset because
// the preexisting C02 CI contract requires it; neither navigation nor any
// visible C02 layer uses it. Generated quilt/WebP is removed from delivery.
await rm(resolve(output,'assets/c02/ink-unified.webp'),{force:true});

// The original roller and adaptive progress/reveal timing remain immutable.
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
