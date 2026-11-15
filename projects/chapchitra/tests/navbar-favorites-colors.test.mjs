import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const folder='src/assets/illustrator/';
const paths=svg=>[...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(m=>m[1]);
const viewBox=svg=>svg.match(/viewBox="([^"]+)"/)?.[1];
const hash=s=>{
 let value=2166136261;
 for(let i=0;i<s.length;i++)value=Math.imul(value^s.charCodeAt(i),16777619);
 return (value>>>0).toString(16).padStart(8,'0');
};
const originals=[
 ['nav-search.svg','34 40 444 431',2,'902bb864'],
 ['nav-account.svg','2329 52 388 445',5,'967ea086'],
 ['nav-bag.svg','3433 21 396 471',2,'bfb10f0f'],
 ['nav-favorites-outline.svg','1148 39 482 435',2,'5c8cd11a']
];

test('original Illustrator navigation paths, dimensions and framing stay exact',()=>{
 for(const [file,frame,count,digest] of originals){
  const svg=read(folder+file);
  assert.equal(viewBox(svg),frame,file+' viewBox unchanged');
  assert.equal(paths(svg).length,count,file+' path count unchanged');
  assert.equal(hash(paths(svg).join('|')),digest,file+' original path commands unchanged');
  assert.match(svg,/\.st0\{fill:#1C241D;\}/,file+' dark forest outline');
  assert.doesNotMatch(svg,/\.st0\{fill:#293D2D;\}/,file+' must not retain old olive outline');
 }
});

test('filled heart retains the exact original 2 outline paths with terracotta underneath',()=>{
 const outline=read(folder+'nav-favorites-outline.svg');
 const selected=read(folder+'nav-favorites-selected.svg');
 const edge=paths(outline),s=paths(selected);
 assert.equal(viewBox(selected),viewBox(outline));
 assert.equal(s.length,edge.length+1);
 assert.deepEqual(s.slice(1),edge,'same visible Illustrator outline, unchanged in both states');
 const preserved=read(folder+'nav-favorites-filled.svg');
 assert.equal(paths(preserved).length,15,'approved original filled artwork remains archived intact');
 assert.equal(s[0],edge[0].slice(0,edge[0].search(/[zZ]/)+1),'interior is derived from original closed outer contour');
 assert.match(selected,/<path class="cc-favorite-interior"[^>]*fill="#8A503B"/);
 assert.ok(selected.indexOf('cc-favorite-interior')<selected.indexOf('Favourite_x5F_Icon_x5F_Outline'),'terracotta sits behind the dark outline');
 assert.doesNotMatch(outline,/cc-favorite-interior|fill="#8A503B"/,'unselected heart has transparent interior');
});

test('product favorite storage, state and accessible labels remain wired without swapping solid heart geometry',()=>{
 const app=read('src/app.mjs');
 assert.match(app,/favoritesState=new Set/);
 assert.match(app,/localStorage\.setItem\('chapchitra-v3-sample-favorites'/);
 assert.match(app,/btn\.setAttribute\('aria-pressed',String\(liked\)\)/);
 assert.match(app,/btn\.setAttribute\('aria-label',\(liked\?'Remove '/);
 assert.match(app,/heartArt\.src=artRoot\+'nav-favorites-'\+\(liked\?'selected':'outline'\)\+'\.svg'/);
 assert.match(app,/document\.addEventListener\('click',e=>\{const btn=e\.target\.closest\('\[data-favorite\]'\)/);
 assert.match(read('src/styles.css'),/#app \.favorite-toggle\.liked svg\{fill:var\(--color-terracotta\)\}/);
 assert.match(read('src/styles.css'),/#app \.nav-icon\{color:#1C241D\}/);
});

test('dedicated UI QA exercises desktop/mobile initial, selected, deselected, persistence and keyboard',()=>{
 const qa=read('scripts/navbar-favorites-qa.mjs');
 for(const code of ['desktop-chromium','mobile-chromium','ipad-webkit','mobile-webkit','aria-pressed','localStorage','press(\'Space\')','nav-favorites-selected.svg','screenshot','color','#1C241D','#8A503B'])
  assert.ok(qa.includes(code),'QA coverage: '+code);
 const wf=read('../../.github/workflows/chapchitra-shared-staging.yml');
 assert.match(wf,/Navbar and favorites exact-state browser QA/);
 assert.match(wf,/node scripts\/navbar-favorites-qa\.mjs/);
 assert.match(wf,/perf-results\/shared-stage-navbar-favorites/);
});

test('dedicated isolated GitHub Actions QA builds localhost and never deploys',()=>{
 const wf=read('../../.github/workflows/chapchitra-navbar-favorites-qa.yml');
 assert.match(wf,/workflow_dispatch:/);
 assert.match(wf,/npm run check/);
 assert.match(wf,/node scripts\/navbar-favorites-qa\.mjs/);
 assert.match(wf,/playwright install --with-deps chromium webkit/);
 assert.match(wf,/127\.0\.0\.1:4272/);
 assert.doesNotMatch(wf,/\bdeploy\b|\bpublish\b|\bmerge\b/i);
});
