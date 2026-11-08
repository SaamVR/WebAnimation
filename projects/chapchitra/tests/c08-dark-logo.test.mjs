import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
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
  dims:[1250,1052]
 },
 {
  before:'scripts/c08-fallback-originals/chapchitra-wordmark-light-before.webp',
  originalSHA:'c3b8b7e26624e0f06d1853cd0fa42e23ab86b72b906eaa9d8492719da7c5b5aa',
  active:'src/assets/chapchitra-wordmark-cream-terra.webp',
  legacy:'src/assets/chapchitra-wordmark-light.webp',
  dims:[1400,316]
 }
];
test('the exact approved dark-surface fallback images contain only Cream and Terracotta with original silhouette geometry',async()=>{
 for(const f of files){
  const before=await readFile(resolve(root,f.before));
  assert.equal(SHA(before),f.originalSHA,'source fallback backup changed: '+f.before);
  const output=await readFile(resolve(root,f.active));
  const alias=await readFile(resolve(root,f.legacy));
  assert.deepEqual(output,alias,'Old dark-surface URL must not retain the old light green fallback');
  const prev=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const now=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([prev.info.width,prev.info.height],f.dims);
  assert.deepEqual([now.info.width,now.info.height],f.dims);
  let cream=0,terra=0,changedOpacity=0;
  for(let i=0;i<now.data.length;i+=4){
   const a=now.data[i+3],old=prev.data[i+3];
   assert.equal(a>0,old>0,'Must preserve original nontransparent silhouette coverage');
   if(a===0)continue;
   const color=[now.data[i],now.data[i+1],now.data[i+2]];
   if(color.every((v,j)=>v===CREAM[j]))cream++;
   else if(color.every((v,j)=>v===TERRACOTTA[j]))terra++;
   else assert.fail('Unapproved color found in '+f.active+': '+color.join(','));
   if(a!==old)changedOpacity++;
  }
  assert.ok(cream>1000&&terra>1000,'Both approved inks must appear');
  if(f.dims[1]>500)assert.ok(changedOpacity>1000,'Fabric texture must be preserved through varying ink coverage');
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
