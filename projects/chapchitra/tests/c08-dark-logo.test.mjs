import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const SHA=contents=>createHash('sha256').update(contents).digest('hex');
const files=[
 {
  before:'scripts/c08-fallback-originals/chapchitra-full-on-dark-before.webp',
  originalSHA:'d4298171361cf355eeea2d92a4d93b713397afbba11db49323115ea94de4d0d9',
  active:'src/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp',
  legacy:'src/assets/chapchitra-full-on-dark.webp',
  outputSHA:'1f5fc3845bc0d6ccfb840cb174bba65eea180203fe33fcab965758db0e00cd9d',
  dims:[1250,1052]
 },
 {
  before:'scripts/c08-fallback-originals/chapchitra-wordmark-light-before.webp',
  originalSHA:'c3b8b7e26624e0f06d1853cd0fa42e23ab86b72b906eaa9d8492719da7c5b5aa',
  active:'src/assets/chapchitra-wordmark-cream-terra.webp',
  legacy:'src/assets/chapchitra-wordmark-light.webp',
  outputSHA:'e9b70e1af14dc71c2c065777415998c874c8af5517ac480297c127f1f6c489c5',
  dims:[1400,316]
 }
];
test('C08 original green patch plus two-color wordmark fallback retain audited bytes and dimensions without native CI codecs',async()=>{
 for(const f of files){
  const original=await readFile(resolve(root,f.before));
  assert.equal(SHA(original),f.originalSHA,'Original source fallback backup changed: '+f.before);
  const output=await readFile(resolve(root,f.active));
  const alias=await readFile(resolve(root,f.legacy));
  assert.deepEqual(output,alias,'Legacy fallback URL must match the approved composite');
  if(f.dims[1]===1052){
    assert.deepEqual(output,await readFile(resolve(root,'src/assets/chapchitra-full-on-dark-cream-terra.webp')),'Prior hero URL must also use restored green patch');
  }
  // Exact SHA pin is a reproducible product of the original source-pixel
  // composite. The *local* image QA checks every visible patch RGBA and every
  // approved lower-wordmark RGBA. CI uses only Node built-ins (Render-safe).
  assert.equal(SHA(output),f.outputSHA,'Audited original-patch/static-wordmark WebP changed: '+f.active);
  assert.equal(output.toString('ascii',0,4),'RIFF');
  assert.equal(output.toString('ascii',8,12),'WEBP');
  assert.equal(output.toString('ascii',12,16),'VP8L');
  assert.equal(output[20],0x2f,'Lossless WebP payload required for exact ink colors');
  const size=output.readUInt32LE(21);
  const dimensions=[1+(size&0x3fff),1+((size>>>14)&0x3fff)];
  assert.deepEqual(dimensions,f.dims,'Original artwork dimensions must stay unchanged');
 }
});
test('C08 dark-surface brand uses versioned asset URLs while light-background navbar retains original source',async()=>{
 const app=await readFile(resolve(root,'src/app.mjs'),'utf8');
 const html=await readFile(resolve(root,'src/index.html'),'utf8');
 const player=await readFile(resolve(root,'src/motion/c08/logo-player.mjs'),'utf8');
 assert.match(app,/src="\/assets\/chapchitra-full-on-dark-original-patch-cream-terra-wordmark\.webp"/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark-cream-terra\.webp"/);
 assert.match(html,/href="\/assets\/chapchitra-full-on-dark-original-patch-cream-terra-wordmark\.webp"/);
 assert.match(player,/const HERO = '\/assets\/c08\/wordmark-reprint-dark-inverted-v2\.json'/);
 assert.match(player,/const SOURCE = '\/assets\/c08\/wordmark-reprint-original\.json'/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark\.webp"/);
 assert.doesNotMatch(app,/src="\/assets\/chapchitra-wordmark-light\.webp"/);
 assert.doesNotMatch(player,/const HERO = '\/assets\/c08\/wordmark-reprint-hero-light\.json'/);
});


test('C08 build code cannot recolor the original patch or silently retime Lottie',async()=>{
 const script=await readFile(resolve(root,'scripts/c08-recolor-static.mjs'),'utf8');
 const approvedLower=await readFile(resolve(root,'scripts/c08-fallback-originals/chapchitra-full-terracotta-before-patch-restoration.webp'));
 assert.equal(SHA(approvedLower),'3acec051748757e05501e759f497c938e69097b6c0f88f19c5a6c3bb6f288f00');
 assert.match(script,/PATCH_END_Y=775/);
 assert.match(script,/patch\.data\.copy\(pixels,0,0,split\)/,'Original green source pixels must be copied verbatim');
 assert.match(script,/Buffer\.from\(wordmark\.data\)/,'The approved lower wordmark must be used verbatim');
 assert.match(script,/PATCH_FRINGE_LIMIT_X=840/,'Tiny approved textile antialias pixels must also be protected');
 assert.doesNotMatch(script,/greenExcess|isSymbol|isCream|luminance|\.tint\(|\.modulate\(/,'Future build must never remap patch colors');
 const css=await readFile(resolve(root,'src/motion/c08/logo-player.css'),'utf8');
 assert.match(css,/clip-path:inset\(0 0 26\.35% 0\)/,'The complete approved patch silhouette must remain visible');
});
