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
test('Owner inverted static SVG replaces retired dark C08 renderer',async()=>{
 const app=await readFile(resolve(root,'src/app.mjs'),'utf8');
 const html=await readFile(resolve(root,'src/index.html'),'utf8');
 assert.match(app,/chapchitra-dark-full\.svg/);
 assert.match(app,/chapchitra-dark-wordmark\.svg/);
 assert.doesNotMatch(app,/\/motion\/c08\/logo-player|c08-navbar-playing/);
 assert.doesNotMatch(html,/motion\/c08\//);
});
