import { cp, mkdir, rm, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const src=resolve(root,'src');
const output=resolve(root,'dist');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(src,output,{recursive:true});
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
