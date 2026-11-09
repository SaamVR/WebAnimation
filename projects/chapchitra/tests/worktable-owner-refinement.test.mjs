import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const app=load('../src/app.mjs'),styles=load('../src/styles.css'),src=load('../src/worktable-studio.mjs');
test('Artist page keeps a compact semantic heading and no visible build metadata',()=>{
 const route=app.match(/function artistsEdit\(\)\{[\s\S]*?\n \}/)?.[0]||'';
 assert.match(route,/route-head--artist-edit/);
 assert.match(route,/<h1 id="artistEditTitle">Artist’s Edit<\/h1>/);
 assert.doesNotMatch(route,/pageTop|CUSTOM PRINTING|Plan a custom print concept/);
 assert.doesNotMatch(app,/visibleBuild|Review build: /);
 assert.match(styles,/\.route-head--artist-edit\{/);
});
test('simplified controls retain keyboard-compatible tools and Print tips',()=>{
 for(const id of ['worktableArtworkHeading','worktableUploadArt','worktableArtScale','worktableScaleOutput',
 'worktableResetArt','worktableRemoveArt','worktableArtworkQuality','worktableSizeGuidance'])
  assert.ok(src.includes(id),id);
 assert.match(src,/<h3 id="worktableArtworkHeading">Your artwork<\/h3>/);
 assert.match(src,/<details class="cc-worktable-print-tips">/);
 assert.match(src,/<summary>Print tips<\/summary>/);
 assert.match(src,/Image quality may be low at this print size/);
 assert.match(src,/quality\.hidden=!assessment\.low/);
 assert.match(src,/sizeGuidance\.hidden=!note/);
});
