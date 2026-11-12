import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const app=load('../src/app.mjs'),styles=load('../src/styles.css'),src=load('../src/worktable-studio.mjs');
test('Artist page has one hidden semantic title, no route heading or build metadata',()=>{
 const route=app.match(/function artistsEdit\(\)\{[\s\S]*?\n \}/)?.[0]||'';
 assert.doesNotMatch(route,/route-head--artist-edit|<h1|pageTop|CUSTOM PRINTING|Plan a custom print concept/);
 assert.match(route,/class="customize-layout" hidden aria-hidden="true"/);
 assert.doesNotMatch(app,/visibleBuild|Review build: /);
 assert.doesNotMatch(styles,/\.route-head--artist-edit\{/);
 assert.match(src,/class="cc-worktable-sr-only">Artist's Edit<\/h1>/);
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
