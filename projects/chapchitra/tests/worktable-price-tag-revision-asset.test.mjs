import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path=new URL('../browser-assets/worktable/price-tag/price-tag.png',import.meta.url);
const png=readFileSync(path);
test('revised owner-supplied tag trim keeps the approved image registration',()=>{
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),312);
 assert.equal(png.readUInt32BE(20),142);
 assert.equal(png[25],6,'RGBA PNG preserves transparent edges');
 assert.equal(createHash('sha256').update(png).digest('hex'),'5d5439bfb6a4f77ed06a66273677e40ff9c938816f77590e0441cc232cd825e0');
});
