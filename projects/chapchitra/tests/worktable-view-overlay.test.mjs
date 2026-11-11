import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const studio=read('../src/worktable-studio.mjs');
const css=read('../src/worktable-studio.css');
test('Front/Back rotation button is a true worktable-stage overlay, never a cream footer',()=>{
 assert.match(studio,/stage\.append\(viewRow\)/);
 assert.doesNotMatch(studio,/stage\.after\(viewRow\)/);
 assert.match(css,/\.cc-worktable-view-row\{\s*position:absolute;left:50%;bottom:2\.3%;z-index:8;/);
 assert.match(css,/\.cc-worktable-view-row\{[\s\S]*?background:transparent;/);
 assert.match(css,/\.cc-worktable-view-button\{[\s\S]*?min-height:44px/);
 assert.match(css,/pointer-events:auto;/);
 assert.doesNotMatch(css,/padding:9px 14px;background:var\(--color-cream\)/);
});
