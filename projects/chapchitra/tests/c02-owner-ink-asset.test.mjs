import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {C02_INK_ASSET,c02InkAssetPlacement,c02InkVisualViewport,
 c02InkRevealClip} from '../src/motion/c02/ink-asset.mjs';
import {inkEdgeX} from '../src/motion/c02/ink-shapes.mjs';

test('C02 uses exactly the submitted 8192×1152 SVG, with all 727 paths intact',async()=>{
 const original=await readFile(new URL('../src/assets/c02/texture.svg',import.meta.url));
 assert.equal(original.length,1863170);
 assert.equal(createHash('sha256').update(original).digest('hex'),
  C02_INK_ASSET.sourceSHA256);
 const text=original.toString('utf8');
 assert.equal((text.match(/<path\b/g)||[]).length,727);
 assert.match(text,/viewBox="0 0 8192 1152"/);
 assert.match(text,/\.st0\{fill:#293D2D;\}/);
 assert.doesNotMatch(text,/<image\b|<script\b|<foreignObject\b/);
 assert.equal(C02_INK_ASSET.path,'/assets/c02/texture.svg');
 assert.equal(C02_INK_ASSET.composedPath,'/assets/c02/texture-composed.svg');
 assert.equal(C02_INK_ASSET.width,8192);
 assert.equal(C02_INK_ASSET.height,1152);
 assert.equal(C02_INK_ASSET.press,'#293D2D');
});

test('vertical bleed covers painted body even with naturally transparent original margins',async()=>{
 assert.equal(C02_INK_ASSET.verticalCover,1.5);
 const svg=await readFile(new URL('../src/assets/c02/texture.svg',import.meta.url));
 const {data,info}=await sharp(svg).resize({width:1024}).ensureAlpha()
  .raw().toBuffer({resolveWithObject:true});
 assert.equal(info.height,144);
 const opacity=(row,x0,x1)=>{
  let sum=0;
  for(let x=x0;x<x1;x++)sum+=data[(row*info.width+x)*4+3];
  return sum/(x1-x0);
 };
 // The user's illustration contains transparent outer bands. Verify the
 // scaled viewport boundary samples are within the dense painted interior.
 for(const y of [24,72,120]){
  assert.ok(opacity(y,8,850)>200,'painted body coverage at source row '+y);
 }
 assert.ok(opacity(0,8,850)<5,'unmodified art retains original transparent top');
 assert.ok(opacity(143,8,850)<20,'unmodified art retains original bottom');
});

test('roller remains aligned to the original SVG mid-row contact at every viewport',()=>{
 assert.equal(C02_INK_ASSET.paintedRight,8096);
 for(const [width,height] of [[390,844],[834,1112],[1280,800],
  [1920,1080],[3440,900]]){
  for(const p of [.01,.25,.5,.75,.95,1]){
   const edge=inkEdgeX(p,470,27)*width/1000;
   const place=c02InkAssetPlacement({edgeX:edge,
    viewportWidth:width,viewportHeight:height});
   assert.ok(Math.abs(place.contactX-edge)<1e-7);
   assert.ok(Math.abs(place.renderedWidth/place.renderHeight-8192/1152)<1e-9);
   assert.equal(place.renderHeight,height*1.5);
   assert.equal(place.top,-height*.25);
   assert.ok(Number.isFinite(place.left));
  }
 }
});

test('C02 has exactly one vector surface through cover/full/loading/reveal',async()=>{
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 const review=await readFile(new URL('../src/c02-review/asset-compare/index.html',import.meta.url),'utf8');
 assert.match(runtime,/inkAssetImg\.src=C02_INK_ASSET\.composedPath/);
 assert.match(runtime,/inkImg\.src=C02_INK_ASSET\.composedPath/);
 assert.match(runtime,/inkAssetLayer\.append\(inkAssetImg\)/);
 assert.match(runtime,/const surfaceP=mode==='reveal'\?1:p/);
 assert.match(runtime,/c02InkRevealClip\(p,viewport\.width,viewport\.height\)/);
 assert.match(runtime,/inkAssetImg\.style\.transform='translate3d\('/);
 assert.match(runtime,/placement\.left/);
 assert.match(runtime,/overlay\.dataset\.inkAsset='owner-vector-svg'/);
 assert.match(runtime,/roller\.style\.transform='translate3d\('/);
 assert.match(runtime,/Promise\.all\(\[awaitShell\(win,doc\),incomingPaintReady\]\)/);
 assert.match(runtime,/overlay\.render\(p,'cover'\)/);
 assert.match(runtime,/const incomingPaintReady=overlay\.assetsReady\.then/);
 assert.match(runtime,/doc\.documentElement\.dataset\.c02Handoff='matched-first-frame'/);
 assert.match(runtime,/doc\.documentElement\.dataset\.c02FirstPaintDelta=/);
 assert.match(runtime,/doc\.documentElement\.dataset\.c02RevealSurface=JSON\.stringify/);
 assert.match(runtime,/win\.setTimeout\(expose,150\)/);
 assert.match(early,/visualViewport\.addEventListener\('resize',positionPrepaint/);
 assert.match(early,/visualViewport\.addEventListener\('scroll',positionPrepaint/);
 assert.match(early,/z-index:2147483001/);
 assert.match(runtime,/win\.location\.assign\(target\.href\)/);
 assert.doesNotMatch(runtime,/inkAssetFill|background-repeat:repeat-x|ink-unified\.webp/);
 assert.match(early,/background-image:url\('\/assets\/c02\/texture-composed\.svg'\)/);
 assert.match(early,/href="\/assets\/c02\/texture-composed\.svg"/);
 assert.match(early,/rightContact-8096\*scale/);
 assert.match(early,/var scale=vh\*1\.5\/1152/);
 assert.doesNotMatch(early,/ink-interior-loop|ink-unified|Ink_swipe_1\.png/);
 assert.match(build,/C02 exact hand-illustrated SVG source verified/);
 assert.match(build,/inkSVGHash!==C02_INK_ASSET\.sourceSHA256/);
 assert.match(build,/whiteInkBacking\(inkVectorBytes\)/);
 assert.match(build,/C02 single-svg white ink underprint/);
 assert.match(runtime,/dataset\.inkBacking='gallery-white-source-envelope'/);
 assert.doesNotMatch(build,/generateUnifiedInk|\.webp\(\{lossless:true/);
 assert.match(review,/C02_INK_ASSET\.composedPath/);
 assert.doesNotMatch(review,/C02_INK_ASSET\.composite/);
});

test('iPad toolbar changes and reveal masks retain viewport geometry',()=>{
 const win={innerWidth:834,innerHeight:1112,
  visualViewport:{width:834,height:1020,offsetLeft:0,offsetTop:42}};
 assert.deepEqual(c02InkVisualViewport(win),{width:834,height:1020,left:0,top:42});
 win.visualViewport.height=925;win.visualViewport.offsetTop=70;
 assert.deepEqual(c02InkVisualViewport(win),{width:834,height:925,left:0,top:70});
 win.visualViewport=null;
 assert.deepEqual(c02InkVisualViewport(win),{width:834,height:1112,left:0,top:0});
 for(const [w,h] of [[390,844],[834,1112],[3440,900]]){
  assert.equal(c02InkRevealClip(0,w,h),'none');
  assert.equal(c02InkRevealClip(1,w,h),'inset(0 0 0 100%)');
  const clip=c02InkRevealClip(.5,w,h);
  assert.match(clip,/^polygon\(100% 0%,100% 100%,/);
  assert.equal((clip.match(/px/g)||[]).length,9);
 }
});
