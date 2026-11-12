import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {whiteInkBacking} from '../scripts/c02-white-backing.mjs';
import {C02_INK_ASSET} from '../src/motion/c02/ink-asset.mjs';

test('Gallery White remains strictly inside owner-painted silhouette',async()=>{
 const source=await readFile(new URL('../src/assets/c02/texture.svg',import.meta.url));
 const originalHash=createHash('sha256').update(source).digest('hex');
 assert.equal(originalHash,C02_INK_ASSET.sourceSHA256);
 const {path,stats}=await whiteInkBacking(source);
 assert.ok(stats.paintedMain>300000);
 assert.ok(stats.whiteHoles>2000,'transparent holes must receive white');
 assert.ok(path.length>4000&&path.length<500000);
 assert.match(path,/^M[\d ]+L/);
 assert.ok(!/NaN|Infinity|<script|<image/.test(path));
});

test('one built SVG contains original green paths above inset white vector',async()=>{
 const original=(await readFile(new URL('../src/assets/c02/texture.svg',import.meta.url))).toString('utf8');
 const {path}=await whiteInkBacking(Buffer.from(original));
 const built=original.replace('</style>','</style>\\n'+
  '<path id="c02-white-backing" fill="#F6F7F5" d="'+path+'"/>');
 assert.equal((original.match(/<path\b/g)||[]).length,727);
 assert.equal((built.match(/<path\b/g)||[]).length,728);
 const white=built.indexOf('id="c02-white-backing" fill="#F6F7F5"');
 assert.ok(white>0&&white<built.indexOf('<path',white+1));
 const originalGreenPaths=[...original.matchAll(/<path\b[^>]*>/g)].map(x=>x[0]);
 for(const p of originalGreenPaths)assert.ok(built.includes(p),'original path data changed');
 assert.equal((built.match(/id="c02-white-backing"/g)||[]).length,1);
 assert.doesNotMatch(built,/<image\b|<foreignObject\b|<script\b/);
});

test('actual delivered color is invariant over Gallery White/Terracotta/Press/Deep Forest pages',async()=>{
 const source=await readFile(new URL('../src/assets/c02/texture.svg',import.meta.url));
 const {path}=await whiteInkBacking(source);
 const composed=Buffer.from(source.toString('utf8').replace('</style>',
  '</style>\\n<path id="c02-white-backing" fill="#F6F7F5" d="'+path+'"/>'));
 const opts={width:2048,height:288,fit:'fill'};
 const a=(await sharp(source).resize(opts).ensureAlpha().raw().toBuffer({resolveWithObject:true})).data;
 const b=(await sharp(composed).resize(opts).ensureAlpha().raw().toBuffer({resolveWithObject:true})).data;
 let whiteHoles=0,greenUnchanged=0;
 for(let i=0;i<a.length;i+=4){
  const oldAlpha=a[i+3],newAlpha=b[i+3];
  if(oldAlpha<=3&&newAlpha>=250){
   whiteHoles++;
   assert.ok(Math.abs(b[i]-246)<=2&&Math.abs(b[i+1]-247)<=2&&
    Math.abs(b[i+2]-245)<=2,'hole must expose Gallery White');
  }
  if(oldAlpha===255){
   greenUnchanged++;
   assert.ok(Math.abs(b[i]-a[i])<=1&&Math.abs(b[i+1]-a[i+1])<=1&&
    Math.abs(b[i+2]-a[i+2])<=1,'green source pixels changed');
  }
 }
 assert.ok(whiteHoles>2000,'need numerous whitened holes');
 assert.ok(greenUnchanged>300000,'owner green must be preserved');
 const backgrounds=[[246,247,245],[138,80,59],[41,61,45],[23,36,25]];
 const representative=[];
 for(let i=0;i<a.length;i+=4)if(a[i+3]===0&&b[i+3]===255){
  representative.push([b[i],b[i+1],b[i+2]]);if(representative.length===20)break;
 }
 assert.equal(representative.length,20);
 for(const color of backgrounds)for(const pixel of representative){
  const over=color.map((channel,k)=>
   Math.round(pixel[k]*1+channel*0));
  assert.deepEqual(over,[246,247,245]);
 }
});
