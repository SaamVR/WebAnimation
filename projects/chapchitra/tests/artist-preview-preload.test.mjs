import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const here=new URL('../',import.meta.url);
const html=readFileSync(new URL('src/artists-edit/index.html',here),'utf8');
const manifest=JSON.parse(readFileSync(new URL('browser-assets/worktable/manifest.json',here),'utf8'));
test('Artist preloaded responsive scene image candidates all exist as approved built assets',()=>{
 const variants=manifest.__initialScene.variants;
 assert.equal(variants.length,3);
 for(const v of variants){
  assert.ok(html.includes('../assets/worktable/'+v.path+' '+v.width+'w'),v.path);
  assert.ok(existsSync(new URL('browser-assets/worktable/'+v.path,here)),v.path);
 }
 assert.doesNotMatch(html,/assembled-regular\.w(?:768|1536|2560)\.webp/);
});
