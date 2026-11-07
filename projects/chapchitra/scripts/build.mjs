import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const src=resolve(root,'src');
const output=resolve(root,'dist');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(src,output,{recursive:true});
const expected=['index.html','styles.css','app.mjs','components.mjs'];
for (const name of expected) await stat(resolve(output,name));
// The final, original 4000x2250 PNGs are held as checksummed archive parts.
// No resizing, cropping, substitution, or partial asset publication.
const { installWorktableAssets } = await import('./worktable-assets.mjs');
const artwork=await installWorktableAssets(root,output);
console.log('CHAPCHITRA exact original artwork verified:',artwork);
const files=await readdir(output);
console.log('CHAPCHITRA build complete:',files.join(', '));
