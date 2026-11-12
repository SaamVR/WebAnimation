import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {C02_INK_ASSET,UNIFIED_INK,c02InkAssetPlacement,
 c02InkVisualViewport,c02InkRevealClip} from '../src/motion/c02/ink-asset.mjs';
import {inkEdgeX} from '../src/motion/c02/ink-shapes.mjs';
import {generateUnifiedInk} from '../scripts/c02-unified-ink.mjs';
test('owner original PNG SHA, contact point and composite geometry are immutable',async()=>{
 const original=await readFile(new URL('../src/assets/c02/Ink_swipe_1.png',import.meta.url));
 assert.equal(createHash('sha256').update(original).digest('hex'),
  '44ad9ce947981a02b161c0987bb49aad7ef29310f7e0205e1896f94a5d353336');
 assert.equal(C02_INK_ASSET.path,'/assets/c02/Ink_swipe_1.png');
 assert.equal(C02_INK_ASSET.paintedRight,1689);
 assert.equal(C02_INK_ASSET.press,'#293D2D');
 assert.equal(C02_INK_ASSET.composite.path,'/assets/c02/ink-unified.webp');
 assert.equal(C02_INK_ASSET.composite.width,8192);
 assert.equal(C02_INK_ASSET.composite.tail,6144);
 assert.equal(UNIFIED_INK.seed,0xC0222026);
 assert.equal(UNIFIED_INK.tail+2048,UNIFIED_INK.width);
 for(const [width,height] of [[390,844],[834,1112],[1280,800],
  [1920,1080],[3440,900]]){
  for(const p of [.01,.25,.5,.75,.95,1]){
   const edge=inkEdgeX(p,470,27)*width/1000;
   const place=c02InkAssetPlacement({edgeX:edge,
    viewportWidth:width,viewportHeight:height});
   assert.ok(Math.abs(place.contactX-edge)<1e-7);
   assert.ok(Math.abs(place.compositeLeft+
    UNIFIED_INK.tail*place.scale-place.left)<1e-7);
   assert.ok(Math.abs(place.renderedWidth/place.renderHeight-8192/1152)<1e-9);
   assert.equal(place.renderHeight,height*1.06);
  }
 }
});
test('original brush edge is byte-exact and old mirrored band never repeats',async()=>{
 const original=await readFile(new URL('../src/assets/c02/Ink_swipe_1.png',import.meta.url));
 const {rgba,source,webp,provenance}=await generateUnifiedInk(original);
 assert.ok(webp.length>250000 && webp.length<2500000);
 assert.ok(provenance.length>75);
 assert.ok(new Set(provenance.map(v=>v.source.join(','))).size>65);
 for(let y=0;y<1152;y++){
  const sourceOffset=y*2048*4+UNIFIED_INK.blendToOriginal*4;
  const destOffset=y*8192*4+(UNIFIED_INK.tail+UNIFIED_INK.blendToOriginal)*4;
  assert.ok(rgba.subarray(destOffset,destOffset+4*(2048-UNIFIED_INK.blendToOriginal))
   .equals(source.subarray(sourceOffset,sourceOffset+4*(2048-UNIFIED_INK.blendToOriginal))));
 }
 let mismatched=0,sampled=0;
 for(let y=7;y<1152;y+=7)for(let x=10;x<3450;x+=7){
  if(Math.abs(rgba[(y*8192+x)*4+3]-rgba[(y*8192+x+2320)*4+3])>=2)
   mismatched++;
  sampled++;
 }
 assert.ok(mismatched/sampled>.045,'reject legacy mirrored 2320px texture period');
});
test('runtime has one bitmap and no left-fill or CSS repeat, including reveal',async()=>{
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.match(runtime,/inkAssetImg\.src=C02_INK_ASSET\.composite\.path/);
 assert.match(runtime,/inkAssetLayer\.append\(inkAssetImg\)/);
 assert.match(runtime,/const surfaceP=mode==='reveal'\?1:p/);
 assert.match(runtime,/c02InkRevealClip\(p,viewport\.width,viewport\.height\)/);
 assert.match(runtime,/inkAssetImg\.style\.transform='translate3d\('/);
 assert.match(runtime,/placement\.compositeLeft/);
 assert.match(runtime,/roller\.style\.transform='translate3d\('/);
 assert.match(runtime,/if\(!rasterSurface\)/);
 assert.match(runtime,/svg\.style\.visibility=rasterSurface\?'hidden':'visible'/);
 assert.match(runtime,/overlay\.animate\('reveal',C02_MOTION\.revealMs,cleanup\)/);
 assert.match(runtime,/Promise\.all\(\[awaitShell\(win,doc\),overlay\.assetsReady\]\)/);
 assert.doesNotMatch(runtime,/inkAssetFill|inkAssetLayer\.append\(inkAssetFill/);
 assert.doesNotMatch(runtime,/background-repeat:repeat-x|\.interior\.path|pngCover/);
 assert.match(early,/background-image:url\('\/assets\/c02\/ink-unified\.webp'\)/);
 assert.match(early,/content:none/);
 assert.match(early,/rightContact-\(1689\+6144\)\*scale/);
 assert.doesNotMatch(early,/ink-interior-loop\.webp|--c02-asset-fill|repeat-x/);
 assert.match(build,/generateUnifiedInk/);
 assert.match(build,/anti-repeat nonmatching pigment fraction/);
 assert.doesNotMatch(build,/\.flop\(\)/);
});
test('iPad visual viewport and clip remain relative to visible browser rectangle',()=>{
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
