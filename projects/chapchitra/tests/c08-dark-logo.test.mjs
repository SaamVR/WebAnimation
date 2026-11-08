import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const SHA=contents=>createHash('sha256').update(contents).digest('hex');
const CREAM=[228,227,222],TERRACOTTA=[138,80,59];
const files=[
 {
  before:'scripts/c08-fallback-originals/chapchitra-full-on-dark-before.webp',
  originalSHA:'d4298171361cf355eeea2d92a4d93b713397afbba11db49323115ea94de4d0d9',
  active:'src/assets/chapchitra-full-on-dark-cream-terra.webp',
  legacy:'src/assets/chapchitra-full-on-dark.webp',
  outputSHA:'3acec051748757e05501e759f497c938e69097b6c0f88f19c5a6c3bb6f288f00',
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
test('dark-surface fallback assets match the audited lossless two-ink hashes without requiring native build-time packages',async()=>{
 for(const f of files){
  const original=await readFile(resolve(root,f.before));
  assert.equal(SHA(original),f.originalSHA,'Original source fallback backup changed: '+f.before);
  const output=await readFile(resolve(root,f.active));
  const alias=await readFile(resolve(root,f.legacy));
  assert.deepEqual(output,alias,'Old dark-surface URL must not retain an outdated green fallback');
  // These *exact* output SHA-256 values are independently pixel-audited with
  // sharp by scripts/c08-recolor-static.mjs in the local QA lane. Keeping a
  // dependency-free CI check avoids requiring native image codecs on Render.
  assert.equal(SHA(output),f.outputSHA,'Audited Cream/Terracotta WebP changed: '+f.active);
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
 assert.match(app,/src="\/assets\/chapchitra-full-on-dark-cream-terra\.webp"/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark-cream-terra\.webp"/);
 assert.match(html,/href="\/assets\/chapchitra-full-on-dark-cream-terra\.webp"/);
 assert.match(player,/const HERO = '\/assets\/c08\/wordmark-reprint-dark-inverted-v2\.json'/);
 assert.match(player,/const SOURCE = '\/assets\/c08\/wordmark-reprint-original\.json'/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark\.webp"/);
 assert.doesNotMatch(app,/src="\/assets\/chapchitra-wordmark-light\.webp"/);
 assert.doesNotMatch(player,/const HERO = '\/assets\/c08\/wordmark-reprint-hero-light\.json'/);
});
