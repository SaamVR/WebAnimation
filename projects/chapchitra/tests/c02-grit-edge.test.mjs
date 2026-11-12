import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gritEdgePaths} from '../src/motion/c02/grit-edge.mjs';
import {inkPath,inkEdgeX,INK_PALETTE} from '../src/motion/c02/ink-shapes.mjs';

test('Grit Roller edge is deterministic and bounded to the moving contact',()=>{
 for(const p of [.08,.2,.38,.5,.72,.82]){
  const {dry,deposits}=gritEdgePaths(p);
  assert.equal(gritEdgePaths(p).dry,dry,'no animation shimmer');
  assert.equal(gritEdgePaths(p).deposits,deposits,'no random pigment noise');
  assert.match(dry,/^M /);
  assert.match(deposits,/^M /);
  assert.ok(dry.split(' M ').length>95,'many fine dry bristles');
  assert.ok(deposits.split(' M ').length>14,'sparse leading pigment');
  assert.ok(deposits.split(' M ').length<50,'no large splatter');
  assert.ok(Number.isFinite(inkEdgeX(p,470,27)));
 }
 assert.deepEqual(gritEdgePaths(0),{dry:'',deposits:''});
 assert.deepEqual(gritEdgePaths(1),{dry:'',deposits:''});
});

test('approved path geometry, roller alignment and reveal are shared by both edge variants',async()=>{
 const motion=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 const helper=await readFile(new URL('../src/motion/c02/grit-edge.mjs',import.meta.url),'utf8');
 const review=await readFile(new URL('../src/c02-review/edge-compare/index.html',import.meta.url),'utf8');
 assert.equal(INK_PALETTE.press,'#293D2D');
 assert.ok(inkPath(.5,{mode:'cover'}).length>100);
 assert.match(motion,/forest\.setAttribute\('d',inkPath\(p,\{mode,offset:27\}\)\)/);
 assert.match(motion,/ink\.setAttribute\('d',inkPath\(p,\{mode\}\)\)/);
 assert.match(motion,/gritEdgePaths\(p\)/);
 assert.match(motion,/edgeStyle==='grit'&&mode==='cover'/);
 assert.match(motion,/if\(gritty\)/);
 assert.match(motion,/paint\.removeAttribute\('mask'\)/);
 assert.match(motion,/maskUnits.*userSpaceOnUse/);
 assert.match(motion,/animate\('reveal',C02_MOTION\.revealMs,cleanup\)/);
 assert.match(motion,/scaleX\(-1\) rotate\(90deg\)/);
 assert.match(motion,/clamp\(318px,33vw,450px\)/);
 assert.match(motion,/roller-original\.svg/);
 assert.doesNotMatch(helper,/feTurbulence|<pattern|grid|Math\.random|filter:/i);
 assert.match(review,/Shared progress/);
 assert.match(review,/pendingInkProgress\(elapsed,\{knownMs:5000\}\)/);
});
