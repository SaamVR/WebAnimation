import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {
 C02_PAGES,C02_PATHS,C02_MOTION,isC02Eligible
} from '../src/motion/c02/ink-sweep.mjs';
import {
 inkPath,inkEdgePath,inkEdgeX,easeInk,INK_PALETTE
} from '../src/motion/c02/ink-shapes.mjs';
const origin='https://chapchitra-webanimation.onrender.com';
const current=origin+'/shop/';
const allow=to=>isC02Eligible({current,destination:origin+to});
test('C02 expands to all ordinary cross-page navigation without changing URLs',()=>{
 for(const path of [
  '/', '/artists-edit/', '/journal/', '/about/', '/product/?id=study-1',
  '/bag/', '/favorites/', '/account/', '/checkout/', '/order-confirmation/',
  '/journal/story/?slug=prints-and-people','/shop/?category=regular-tees'
 ])assert.ok(allow(path),path);
 assert.ok(C02_PAGES.includes('/product/'));
 assert.deepEqual(C02_PATHS,C02_PAGES);
});
test('never intercept same-document anchors, external links, assets or downloads',()=>{
 for(const link of [
  '/shop/','/shop/#collection','/shop/?','/assets/c02/roller-prepared.svg',
  '/asset.png','/downloads/artwork.zip'
 ]) assert.equal(isC02Eligible({current,destination:origin+link}),false,link);
 assert.equal(isC02Eligible({current,destination:'https://example.com/shop/'}),false);
 for(const option of [
  {modified:true},{download:true},{external:true},{target:'_blank'},
  {target:'_parent'},{disabled:true}
 ])assert.equal(isC02Eligible({current,destination:origin+'/about/',...option}),false,JSON.stringify(option));
});
test('procedural ink covers fully and clears fully; holes close at full takeover',()=>{
 assert.equal(inkPath(0,{mode:'cover'}),'');
 assert.match(inkPath(1,{mode:'cover'}),/^M -2 -2 H 1002 V 1002/);
 assert.match(inkPath(0,{mode:'reveal'}),/^M -2 -2 H 1002 V 1002/);
 assert.equal(inkPath(1,{mode:'reveal'}),'');
 assert.match(inkPath(.5,{mode:'cover'}),/ C /);
 assert.match(inkPath(.5,{mode:'reveal'}),/ C /);
 assert.match(inkEdgePath(.5),/^M /);
 assert.equal((inkPath(.5,{mode:'cover'}).match(/ M /g)||[]).length,0,'no misleading white opening');
 assert.ok(inkEdgeX(.5,500)>0 && inkEdgeX(.5,500)<1000);
 assert.equal(easeInk(0),0);assert.equal(easeInk(1),1);
 assert.equal(C02_MOTION.coverMs+C02_MOTION.revealMs,790);
 assert.equal(INK_PALETTE.press,'#293D2D');
 assert.equal(INK_PALETTE.forest,'#172419');
 assert.equal(INK_PALETTE.terra,'#8A503B');
});
test('owner SVG source stays exactly the supplied original master',async()=>{
 const original=await readFile(new URL('../src/assets/c02/roller-original.svg',import.meta.url));
 assert.equal(original.length,2162);
 assert.equal(createHash('sha256').update(original).digest('hex'),
  '1c1226b902299ef7519236b582b5012f5ec918aa7571a2f8091a86db95992d73');
 const src=original.toString('utf8');
 assert.equal((src.match(/<path\b/g)||[]).length,3);
 assert.match(src,/id="ROLLER_CYLINDER"/);
 assert.match(src,/id="ROLLER_HANDLE_x2B_ROD"/);
 assert.match(src,/id="Layer_2"/);
 assert.match(src,/#293D2D/);assert.match(src,/#232323/);
});
test('owner roller is exactly 300 percent of prior dimensions with the same contact geometry',async()=>{
 const src=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.equal(106*3,318);
 assert.equal(150*3,450);
 assert.equal(11*3,33);
 assert.match(src,/width:clamp\(318px,33vw,450px\)/);
 assert.match(src,/height:clamp\(318px,33vw,450px\)/);
 assert.match(src,/const size=Math\.min\(450,Math\.max\(318,win\.innerWidth\*\.33\)\)/);
 assert.match(src,/edgeX-cylinderLeft-ROLLER_CONTACT_OVERLAP_PX/);
 assert.match(src,/scaleX\(-1\) rotate\(90deg\)/);
 assert.doesNotMatch(src,/clamp\(106px,11vw,150px\)/);
});
test('early incoming cover, cross-document transition and failure escape are present',async()=>{
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 assert.doesNotMatch(early,/@view-transition\s*\{\s*navigation:\s*auto/);
 assert.match(early,/sessionStorage/);
 assert.match(early,/c02-pending/);
 assert.match(early,/prefers-reduced-motion/);
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.match(runtime,/pageshow/);
 assert.match(runtime,/pagehide/);
 assert.match(runtime,/MutationObserver/);
 assert.match(runtime,/roller-original\.svg/);
 assert.doesNotMatch(runtime,/lottie-web|gsap|sessionStorage\.clear/);
 assert.match(runtime,/scaleX\(-1\) rotate\(90deg\)/);
 assert.match(runtime,/img\.src='\/assets\/c02\/roller-original\.svg'/);
 assert.match(runtime,/ROLLER_CYLINDER_CONTACT_Y=48\.7199/);
 assert.match(runtime,/inkEdgeX\(p,470,27\)/);
 assert.doesNotMatch(runtime,/p>\.065|p<\.92|roller\.style\.opacity=String/);
});
