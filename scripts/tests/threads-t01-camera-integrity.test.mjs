import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const src=(f)=>readFileSync(new URL('../../site/threads/'+f,import.meta.url));
test('approved T01 remains byte-identical to checkpoint',()=>{
 const actual=createHash('sha256').update(src('t01-spotlight.mjs')).digest('hex');
 // Captured from checkpoint/threads-t01-approved-camera-pre-20261025 and the owner-approved 2026-10-19 checkpoint.
 assert.equal(actual,process.env.T01_APPROVED_SHA256||'f4b5b6e2c269dcfdd9164c944420f696dc93e7c3eb6981967398e9b4914ac5e3');
});
test('rejected automatic camera-follow remains absent',()=>{
 const app=src('storefront-pages.mjs').toString();
 assert.doesNotMatch(app,/t01-camera-follow/);
 assert.doesNotMatch(app,/installT01CameraFollow/);
 assert.equal(existsSync(new URL('../../site/threads/t01-camera-follow.mjs',import.meta.url)),false);
});
