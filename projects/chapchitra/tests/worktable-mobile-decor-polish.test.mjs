import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/worktable-mobile.mjs',import.meta.url),'utf8');

const decor=id=>{
 const lines=source.split('\n');
 const row=lines.find(line=>line.trim().startsWith("{id:'"+id+"',"));
 assert.ok(row, 'Missing original independent decoration '+id);
 return row;
};

test('phone-only lamp mirrors its original crop without redrawing source',()=>{
 const lamp=decor('lamp');
 assert.match(lamp,/source:\[366,66,183,208\]/);
 assert.match(lamp,/left:71\.5,top:18,width:24,flipX:true/);
 assert.match(source,/if\(item\.flipX\)el\.style\.transform='scaleX\(-1\)'/);
 for(const id of ['plant','brushes','pencil','swatch','ink']){
  assert.doesNotMatch(decor(id),/flipX:true/,'Unexpected mirrored '+id);
 }
});

test('only owner-marked independent mobile decorative placements change',()=>{
 assert.match(decor('brushes'),/source:\[1020,69,145,194\],left:40\.5,top:12,width:15/);
 assert.match(decor('pencil'),/source:\[348,623,152,72\],left:5,top:27,width:23/);
 assert.match(decor('swatch'),/source:\[328,686,177,166\],left:5,top:62,width:25/);
 assert.match(decor('plant'),/source:\[8,8,292,360\],left:3,top:3,width:34/);
 assert.match(decor('ink'),/source:\[1013,728,159,124\],left:80,top:53,width:18/);
 assert.match(source,/frame\.classList\.add\('cc-mobile-frame-ready'\)/);
 assert.match(source,/frame\.prepend\(decors\)/);
 assert.match(source,/const GROUPS=\['garment','color','size','printSize','upload'\]/);
 assert.doesNotMatch(source,/calculateArtistPrice|placementGeometry|storeSide\(/);
});
