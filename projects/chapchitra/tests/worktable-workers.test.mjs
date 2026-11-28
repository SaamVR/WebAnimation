import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {WORKER_ANIMATIONS,workerPlacement} from '../src/worktable-workers.mjs';
import {WORKTABLE_PREVIEW_STACK,WORKTABLE_ATOMIC_BACKPLATE_STACK,WORKTABLE_SOURCE_STACK} from '../src/worktable-studio.mjs';
const get=p=>readFile(new URL('../'+p,import.meta.url));
test('exact owner worker JSONs have native vectors and unchanged timing',async()=>{
 for(const spec of WORKER_ANIMATIONS){const bytes=await get('src/assets/worktable-workers/'+spec.name),j=JSON.parse(bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256);assert.deepEqual([j.w,j.h,j.fr,j.ip,j.op],[512,512,30,0,spec.frames]);assert.equal(j.assets.length,0);assert.ok(j.layers.every(l=>l.ty!==2))}
});
test('worker raster geometry is provenance only; all precomposed scenes are worker-free',async()=>{
 const m=JSON.parse(await get('browser-assets/worktable/manifest.json'));const old=WORKTABLE_SOURCE_STACK.filter(p=>p.startsWith('Worker/'));assert.equal(old.length,3);assert.ok(WORKTABLE_PREVIEW_STACK.every(p=>!p.startsWith('Worker/')));assert.ok(WORKTABLE_ATOMIC_BACKPLATE_STACK.every(p=>!p.startsWith('Worker/')));assert.deepEqual(m.__initialScene.generatedFromLayers,WORKTABLE_PREVIEW_STACK);
 for(const [i,p] of old.entries()){const target=m[p].bbox,box=workerPlacement(target,WORKER_ANIMATIONS[i]);assert.equal(box.visible[1],target[1]);assert.equal(box.visible[3],target[3]);assert.ok(box.size>0);assert.equal(box.size,512*box.scale);assert.ok(Math.abs((box.visible[2]-box.visible[0])/(box.visible[3]-box.visible[1])-(WORKER_ANIMATIONS[i].bounds[2]-WORKER_ANIMATIONS[i].bounds[0])/(WORKER_ANIMATIONS[i].bounds[3]-WORKER_ANIMATIONS[i].bounds[1]))<1e-9)}
 const studio=String(await get('src/worktable-studio.mjs'));assert.doesNotMatch(studio,/ALL\.workers\.forEach|workerImgs|addImage\(path,'cc-worktable-worker'/);assert.equal((studio.match(/workers\.playOnce\(\)/g)||[]).length,1);
});
