import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const route=src('app.mjs'),worktable=src('worktable-studio.mjs'),css=src('styles.css'),desk=src('worktable-studio.css');

test('Artist route provides only existing hidden mount point, no visible hero',()=>{
 const fn=route.match(/function artistsEdit\(\)\{[\s\S]*?\n \}/)?.[0];
 assert.ok(fn,'Artist route function missing');
 assert.doesNotMatch(fn,/route-head|<h1|artistEditTitle|scrollTo\(/);
 assert.match(fn,/class="customize-layout" hidden aria-hidden="true"/);
 assert.match(route,/previous\.replaceWith\(pending\)/);
 assert.match(route,/pending\.className='cc-worktable-mount'/);
});
test('Single semantic screen-reader H1 and immediate original frame',()=>{
 assert.match(worktable,/body\.innerHTML=`<h1 class="cc-worktable-sr-only">Artist's Edit<\/h1>\s*<div class="cc-worktable-frame"/);
 assert.doesNotMatch(worktable,/cc-worktable-header|FROM THE STUDIO · CHAPCHITRA|Bring a print idea to the worktable/);
 assert.match(desk,/\.cc-worktable-sr-only\{[\s\S]*?position:absolute!important[\s\S]*?clip-path:inset\(50%\)/);
 assert.doesNotMatch(desk,/\.cc-worktable-header/);
 assert.match(desk,/\.cc-worktable-frame\{width:min\(100%,1540px\);margin-inline:auto/);
 assert.match(desk,/\.cc-worktable-stage\{width:100%;aspect-ratio:16\/9/);
 assert.match(desk,/\.cc-worktable-frame\.cc-mobile-frame-ready\{[\s\S]*?aspect-ratio:9\/16/);
});
test('Artist route mount is flush and does not modify global nav or animation-owned source',()=>{
 assert.doesNotMatch(css,/\.route-head--artist-edit/);
 assert.match(css,/body\[data-page="artists-edit"\] #main,\s*body\[data-page="artists-edit"\] #main > \.cc-worktable-mount\{\s*margin:0;\s*padding:0;/);
 assert.match(css,/body\[data-page="artists-edit"\] #app > \.site-header \{\s*position: static;/);
 assert.doesNotMatch(route.match(/function artistsEdit\(\)\{[\s\S]*?\n \}/)?.[0]||'',/scrollTo|transform|scale/);
});
