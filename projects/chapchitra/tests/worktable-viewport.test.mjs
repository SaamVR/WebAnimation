import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/worktable-studio.css',import.meta.url),'utf8'),src=readFileSync(new URL('../src/worktable-studio.mjs',import.meta.url),'utf8');
test('desktop frame is bounded by actual available height without changing stage registration',()=>{assert.ok(css.includes('calc(var(--cc-worktable-opening) * 16 / 9)'));assert.ok(css.includes('100svh - var(--cc-worktable-navbar-height)'));assert.ok(css.includes('@media(min-width:701px) and (min-height:480px)'));assert.ok(css.includes('.cc-worktable-stage{width:100%;aspect-ratio:16/9'));assert.ok(src.includes('viewportHeader?.offsetHeight'));assert.ok(src.includes('viewportObserver.observe(stage)'));assert.ok(src.includes('viewportObserver.disconnect()'));assert.ok(src.includes('factor=2048/stageRect.width'));assert.ok(src.includes('if(lastInfo&&!mobileUI?.isMobile())syncTransformTools(lastInfo)'))});

test('desktop side gutters use only a matching wood texture and leave the registered stage and phone layout unchanged',()=>{
 assert.match(css,/@media\(min-width:701px\) and \(min-height:480px\)\{\s*\.cc-worktable\{\s*background-image:url\('\/assets\/worktable-gutter-wood\.webp'\);\s*background-repeat:repeat-x;\s*background-position:center top;\s*background-size:auto min\(calc\(100vw \* 9 \/ 16\),866\.25px,var\(--cc-worktable-opening\)\)/);
 const texture=readFileSync(new URL('../src/assets/worktable-gutter-wood.webp',import.meta.url));assert.equal(texture.toString('ascii',0,4),'RIFF');assert.equal(texture.toString('ascii',8,12),'WEBP');
});

test('desktop repositioning excludes all approved iPad and touch layouts and translates matching artwork and hits',()=>{
 assert.match(css,/@media\(min-width:1367px\) and \(min-height:480px\) and \(hover:hover\) and \(pointer:fine\)/);
 for(const [prefix,group] of [['Garment style/','garment'],['Tshirt color/','color'],['Upload image notebook/','upload'],['Print size/','printSize']]){
  assert.ok(css.includes('[data-source^="'+prefix+'"],.cc-worktable-hit[data-group="'+group+'"]'));
 }
 assert.ok(css.includes('.cc-worktable:not(.is-hydrating) .cc-worktable-price-tag-stage{translate:'));
 assert.ok(src.includes("stage.append(plantUnderlay,plantCluster)"));
 for(const f of ['worktable-desktop-plant-underlay.webp','worktable-desktop-plant-cluster.webp']){
  const b=readFileSync(new URL('../src/assets/'+f,import.meta.url));assert.equal(b.toString('ascii',8,12),'WEBP');
 }
});
