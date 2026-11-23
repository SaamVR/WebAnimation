import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=rel=>readFileSync(new URL(rel,root));
const text=rel=>read(rel).toString('utf8');
const sha=buf=>createHash('sha256').update(buf).digest('hex');
const assets='src/assets/illustrator/';
const manifest=JSON.parse(text(assets+'owner-navbar-integrity.json'));

test('immutable uploaded Illustrator navbar master is preserved byte-for-byte',()=>{
 const master=read(assets+'masters/Navbar Icons.svg');
 assert.equal(master.length,301473);
 assert.equal(sha(master),'e10a2632b2357c47347736e3ce8e02ffa396061e0b7772b57f5288053d1fe199');
 assert.equal(manifest.master.sha256,sha(master));
 assert.equal(manifest.master.pathCount,590);
});
test('four icon extractions retain original color rules, paths and framing',()=>{
 const expected={search:[191,6],favorites:[140,2],account:[185,8],bag:[73,2]};
 for(const [name,[npaths,npolys]] of Object.entries(expected)){
  const spec=manifest.assets[name];
  const asset=text(assets+spec.filename);
  assert.equal(sha(read(assets+spec.filename)),spec.sha256);
  assert.equal((asset.match(/<path\b/g)||[]).length,npaths,name+' paths');
  assert.equal((asset.match(/<polygon\b/g)||[]).length,npolys,name+' polygons');
  assert.match(asset,/\.st0\{fill:#293D2D;\}/);
  assert.match(asset,/\.st1\{fill:#8A503B;\}/);
  assert.equal(asset.match(/viewBox="([^"]+)"/)?.[1],spec.viewBox);
  assert.doesNotMatch(asset,/filter=|<image\b|<foreignObject\b|transform=/);
 }
});
test('both navbar Favorites routes preserve combined Terracotta hatching beneath original green contour',()=>{
 const light=text(assets+'nav-owner-favorites-outline.svg');
 const selected=text(assets+'nav-owner-favorites-selected.svg');
 assert.equal(light,selected);
 for(const svg of [light,selected]){
  assert.match(svg,/<g id="Favourite_x5F_Icon_x5F_Fill">/);
  assert.match(svg,/<g id="Favourite_x5F_Icon_x5F_Outline">/);
  assert.ok(svg.indexOf('Favourite_x5F_Icon_x5F_Fill')<svg.indexOf('Favourite_x5F_Icon_x5F_Outline'));
  assert.equal((svg.match(/class="st1"/g)||[]).length,15);
 }
});
test('only the header icons use new SVGs, without modifying product Favorites and navigation',()=>{
 const app=text('src/app.mjs');
 for(const name of ['search','account','bag'])assert.match(app,new RegExp(`navArt\\('owner-${name}'\\)`));
 assert.match(app,/owner-favorites-selected/);
 assert.match(app,/owner-favorites-outline/);
 assert.match(app,/const favoriteArt=liked=>/);
 assert.match(app,/heartArt\.src=artRoot\+'nav-favorites-'/);
 assert.match(app,/id="searchButton"/);
 assert.match(app,/href="\/favorites\/"/);
 assert.match(app,/href="\/account\/"/);
 assert.match(app,/href="\/bag\/"/);
 assert.match(app,/stampedBagCount\(demoBagCount\(\)\)/);
});
test('dark Press Green circle is CSS-only and other palettes/illustrations stay untouched',()=>{
 const css=text('src/theme.css');
 assert.match(css,/:root\[data-theme="dark"\] #app > \.site-header \.nav-actions \.nav-icon:not\(\.cc-theme-toggle\)\{[^}]*background:var\(--color-press-green\);/);
 assert.match(css,/--theme-gallery:var\(--color-warm-beige\)/);
 assert.doesNotMatch(css,/filter:\s*(?:invert|brightness|contrast|sepia)/);
 assert.match(css,/#app > \.site-header \.nav-actions \.nav-icon:not\(\.cc-theme-toggle\)\{\s*min-width:44px;min-height:44px;/);
});
