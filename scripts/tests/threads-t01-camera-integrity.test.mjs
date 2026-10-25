import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const src=(f)=>readFileSync(new URL('../../site/threads/'+f,import.meta.url));
test('approved T01 remains byte-identical to checkpoint',()=>{
 const actual=createHash('sha256').update(src('t01-spotlight.mjs')).digest('hex');
 // This checksum was captured from Git tag checkpoint/threads-t01-approved-camera-pre-20261025.
 assert.equal(actual,process.env.T01_APPROVED_SHA256||'f4b5b6e2c269dcfdd9164c944420f696dc93e7c3eb6981967398e9b4914ac5e3');
});
test('camera is an independent rendering layer with no changes to authored GSAP timeline',()=>{
 const camera=src('t01-camera-follow.mjs').toString();
 const app=src('storefront-pages.mjs').toString();
 assert.match(app,/installT01CameraFollow\(\)/);
 assert.match(camera,/window\.scrollTo\(/);
 assert.match(camera,/wrapper\.style\.transform/);
 assert.match(camera,/hole\.setAttribute\('transform'/);
 assert.doesNotMatch(camera,/gsap\.timeline|\.timeScale\(|\.to\(/);
});
