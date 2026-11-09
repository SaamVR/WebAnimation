import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
 WORKTABLE_VIEWBOX, BACKDROP, GARMENT_VARIANTS, COMMON_LAYERS,
 GARMENT_LAYER_Z, ARTWORK_LAYER_Z, resolveWorktableLayers,
 stageTransform, pointToStage, SIZE_VALUES, COLOR_VALUES, PRINT_VALUES,
 createWorktableState, worktableReducer
} from '../src/worktable-stage.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const inside=box=>box.x>=0&&box.y>=0&&box.width>0&&box.height>0&&box.x+box.width<=2048&&box.y+box.height<=1152;

test('2048x1152 stage exactly maps four 4000x2250 originals without cropping',()=>{
 assert.equal(WORKTABLE_VIEWBOX.width,2048);
 assert.equal(WORKTABLE_VIEWBOX.height,1152);
 assert.equal(WORKTABLE_VIEWBOX.originalWidth,4000);
 assert.equal(WORKTABLE_VIEWBOX.originalHeight,2250);
 assert.equal(WORKTABLE_VIEWBOX.sourceToStage,.512);
 assert.equal(WORKTABLE_VIEWBOX.aspectRatio,16/9);
 assert.equal(WORKTABLE_VIEWBOX.preserveAspectRatio,'xMidYMid meet');
 assert.deepEqual(BACKDROP.box,{x:0,y:0,width:2048,height:1152});
 assert.equal(BACKDROP.availableInRepository,false,'original PNG supplied but not yet in repository');
});

test('four garment positions and preliminary chest guides remain separate variants',()=>{
 assert.deepEqual(Object.keys(GARMENT_VARIANTS),['regular','dropShoulder','fullSleeve','hoodie']);
 for(const variant of Object.values(GARMENT_VARIANTS)){
  assert.ok(inside(variant.box)&&inside(variant.chestGuide));
  assert.match(variant.reference,/^Composition-[1-4]-.*\.png$/);
 }
 assert.deepEqual(GARMENT_VARIANTS.regular.box,{x:565,y:188,width:915,height:870});
 assert.deepEqual(GARMENT_VARIANTS.dropShoulder.box,{x:575,y:186,width:901,height:872});
 assert.deepEqual(GARMENT_VARIANTS.fullSleeve.box,{x:619,y:193,width:818,height:864});
 assert.deepEqual(GARMENT_VARIANTS.hoodie.box,{x:624,y:216,width:805,height:845});
});

test('every required worktable item has one independently addressable layer',()=>{
 const ids=COMMON_LAYERS.map(layer=>layer.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const [group,count,values] of [
  ['style',4,['regular','dropShoulder','fullSleeve','hoodie']],
  ['size',5,SIZE_VALUES],['color',6,COLOR_VALUES],['printSize',2,PRINT_VALUES]
 ]){
  const items=COMMON_LAYERS.filter(layer=>layer.group===group);
  assert.equal(items.length,count,group);
  assert.deepEqual(items.map(layer=>layer.value),values,group);
  assert.ok(items.every(item=>item.accessibleLabel));
 }
 assert.equal(COMMON_LAYERS.filter(layer=>layer.id.startsWith('worker-')).length,3);
 for(const id of ['size-rope','size-sign','color-tray','upload-sketchbook',
                   'garment-style-board','garment-style-sign','print-size-panel','print-size-sign']){
  assert.ok(ids.includes(id),id);
 }
 assert.ok(COMMON_LAYERS.every(layer=>inside(layer.box)&&layer.assetSlot&&Number.isInteger(layer.z)));
});

test('variant resolution keeps garment below three painters without activating missing artwork',()=>{
 assert.ok(GARMENT_LAYER_Z<ARTWORK_LAYER_Z);
 for(const variant of Object.keys(GARMENT_VARIANTS)){
  const layers=resolveWorktableLayers(variant);
  assert.equal(layers[0].id,'desk');
  assert.equal(layers.filter(item=>item.id==='garment').length,1);
  assert.deepEqual(layers.find(item=>item.id==='garment').box,GARMENT_VARIANTS[variant].box);
  assert.ok(layers.every((item,i)=>i===0||layers[i-1].z<=item.z));
  assert.ok(layers.filter(item=>item.id.startsWith('worker-')).every(item=>item.z>GARMENT_LAYER_Z));
  assert.equal(layers.filter(item=>item.id==='uploaded-artwork').length,0);
 }
 assert.throws(()=>resolveWorktableLayers('invented'),RangeError);
});

test('single letterbox geometry supports both desktop and portrait tablet/mobile',()=>{
 assert.deepEqual(stageTransform(2048,1152),{scale:1,offsetX:0,offsetY:0});
 assert.deepEqual(stageTransform(1280,720),{scale:.625,offsetX:0,offsetY:0});
 const transform=stageTransform(390,844);
 assert.ok(Math.abs(transform.scale-390/2048)<1e-10);
 assert.ok(transform.offsetY>300);
 const bounds={left:50,top:100,width:390,height:844};
 const point=pointToStage(50+transform.offsetX+transform.scale*1024,
                        100+transform.offsetY+transform.scale*576,bounds);
 assert.ok(Math.abs(point.x-1024)<1e-9&&Math.abs(point.y-576)<1e-9);
 assert.equal(point.inside,true);
 assert.equal(pointToStage(-100,100,bounds).inside,false);
 assert.throws(()=>stageTransform(0,300),RangeError);
});

test('local-only reducer validates four selection groups and forbids fake uploads',()=>{
 const original=createWorktableState();
 assert.deepEqual(original,{garment:'regular',size:'M',color:'white',printSize:'A4',artwork:null,artworkPlacement:null});
 let state=worktableReducer(original,{type:'select',group:'garment',value:'hoodie'});
 state=worktableReducer(state,{type:'select',group:'size',value:'XXL'});
 state=worktableReducer(state,{type:'select',group:'color',value:'blue'});
 state=worktableReducer(state,{type:'select',group:'printSize',value:'A3'});
 assert.equal(state.garment,'hoodie');
 assert.equal(state.size,'XXL');
 assert.equal(state.color,'blue');
 assert.equal(state.printSize,'A3');
 assert.equal(original.garment,'regular');
 assert.deepEqual(worktableReducer(state,{type:'clear-artwork'}),{...state,artwork:null,artworkPlacement:null});
 assert.throws(()=>worktableReducer(state,{type:'select',group:'garment',value:'tie-dye'}),RangeError);
 assert.throws(()=>worktableReducer(state,{type:'select',group:'price',value:40}),RangeError);
 assert.throws(()=>worktableReducer(state,{type:'upload-binary'}),RangeError);
});

test('Artist route opens directly on the approved worktable without stale planner controls',async()=>{
 const [app,css,doc]=await Promise.all([
  readFile(resolve(root,'src/app.mjs'),'utf8'),
  readFile(resolve(root,'src/styles.css'),'utf8'),
  readFile(resolve(root,'docs/ARTISTS_EDIT_WORKTABLE_ASSET_HANDOFF.md'),'utf8')
 ]);
 assert.match(app,/function artistsEdit\(\)/);
 assert.match(app,/id="artistEditTitle"/);
 assert.doesNotMatch(app,/id="customForm"/);
 assert.doesNotMatch(app,/worktable-stage\.mjs/);
 assert.doesNotMatch(css,/\.worktable-stage/);
 assert.match(doc,/PRE-ASSET ARCHITECTURE ONLY/);
 assert.match(doc,/THESE ORIGINALS HAVE NOT BEEN COMMITTED/i);
 assert.match(doc,/ZIP/);
});
