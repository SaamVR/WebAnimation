import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {C02_INK_ASSET,c02InkAssetPlacement,c02InkVisualViewport,
 c02InkInteriorCoverage,c02InkRevealClip} from '../src/motion/c02/ink-asset.mjs';
import {inkEdgeX} from '../src/motion/c02/ink-shapes.mjs';
test('owner PNG is placed by its visible alpha extent at constant intrinsic aspect ratio',()=>{
 assert.equal(C02_INK_ASSET.path,'/assets/c02/Ink_swipe_1.png');
 assert.equal(C02_INK_ASSET.width,2048);
 assert.equal(C02_INK_ASSET.height,1152);
 assert.equal(C02_INK_ASSET.paintedRight,1689);
 assert.equal(C02_INK_ASSET.press,'#293D2D');
 assert.equal(C02_INK_ASSET.interior.path,'/assets/c02/ink-interior-loop.webp');
 assert.equal(C02_INK_ASSET.interior.cropStart,0);
 assert.equal(C02_INK_ASSET.interior.cropWidth,1160);
 assert.equal(C02_INK_ASSET.interior.loopWidth,2320);
 for(const [width,height] of [[1920,1080],[1280,800],[834,1112],[390,844]]){
  for(const p of [.1,.25,.38,.57,.76,.92]){
   const x=inkEdgeX(p,470,27)*width/1000;
   const geometry=c02InkAssetPlacement({edgeX:x,
    viewportWidth:width,viewportHeight:height});
   assert.ok(Math.abs(geometry.contactX-x)<1e-7,'contact stays at roller edge');
   assert.ok(Math.abs(geometry.renderedWidth/geometry.renderHeight-2048/1152)<1e-9,
    'aspect ratio stays exactly 2048:1152');
   assert.equal(geometry.renderHeight,height*1.06);
   assert.ok(geometry.interiorFillWidth<=width);
   assert.ok(geometry.interiorFillWidth<=Math.max(0,geometry.left)+1e-7,
    'mirrored pigment ends at exact original PNG left boundary');
   assert.ok(Math.abs(geometry.interiorLoopWidth-2320*geometry.scale)<1e-7);
  }
 }
});
test('C02 cover may use original full transparent image while its reveal is unchanged',async()=>{
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.match(runtime,/inkAssetImg\.src=C02_INK_ASSET\.path/);
 assert.match(runtime,/overlay\.append\(svg,inkAssetLayer,roller\)/);
 assert.match(runtime,/const rasterSurface=edgeStyle==='asset'/);
 assert.match(runtime,/surfaceP=mode==='reveal'\?1:p/);
 assert.match(runtime,/c02InkRevealClip\(p,viewport.width,viewport.height\)/);
 assert.doesNotMatch(runtime,/svg\.style\.visibility=pngCover/);
 assert.match(runtime,/inkAssetImg\.style\.width=placement\.renderedWidth/);
 assert.match(runtime,/inkAssetImg\.style\.height=placement\.renderHeight/);
 assert.match(runtime,/inkAssetFill\.style\.width=fillWidth/);
 assert.match(runtime,/background-repeat:repeat-x;background-position:right top/);
 assert.match(runtime,/inkAssetFill\.style\.backgroundSize=placement\.interiorLoopWidth/);
 assert.doesNotMatch(runtime,/background:#293D2D;width:0/);
 assert.match(runtime,/svg\.style\.visibility=rasterSurface\?'hidden':'visible'/);
 assert.match(runtime,/overlay\.animate\('reveal',C02_MOTION\.revealMs,cleanup\)/);
 assert.match(runtime,/inkEdgeX\(surfaceP,470,27\)\*viewport\.width\/1000/);
 assert.match(runtime,/scaleX\(-1\) rotate\(90deg\)/);
 assert.match(runtime,/Promise\.all\(\[awaitShell\(win,doc\),overlay\.assetsReady\]\)/);
 assert.match(runtime,/overlay\.style\.height=viewport\.height/);
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 assert.match(early,/c02-asset-arrival::after/);
 assert.match(early,/background-image:url\('\/assets\/c02\/Ink_swipe_1\.png'\)/);
 assert.match(early,/ticket\.edgeStyle==='asset'/);
 assert.match(early,/rightContact-1689\*scale/);
 assert.match(early,/ink-interior-loop\.webp/);
 assert.match(early,/--c02-asset-loop-width/);
 const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.match(build,/\.flop\(\)/);
 assert.match(build,/webp\(\{lossless:true/);
 assert.match(build,/C02 seamless original-PNG interior generated/);
});

test('original pigment remains one bitmap through partial/full cover and reveal',()=>{
 for(const [width,height] of [[390,844],[834,1112],[1280,800],[3440,900]]){
  const a=c02InkAssetPlacement({edgeX:width*1.29,viewportWidth:width,
   viewportHeight:height});
  assert.equal(c02InkInteriorCoverage(a,width,1),width,
   'full original-pigment coverage at p=1');
  let prev=0;
  for(let p=.78;p<=1.0001;p+=.02){
   const value=c02InkInteriorCoverage(a,width,p);
   assert.ok(value>=prev,'pigment only expands');
   assert.ok(value<=width);
   prev=value;
  }
  assert.equal(c02InkRevealClip(0,width,height),'none');
  assert.equal(c02InkRevealClip(1,width,height),'inset(0 0 0 100%)');
  const mid=c02InkRevealClip(.5,width,height);
  assert.match(mid,/^polygon\(100% 0%,100% 100%,/);
  assert.equal((mid.match(/px/g)||[]).length,9);
 }
});
test('iPad visual viewport offset and toolbar changes are reflected in coordinates',()=>{
 const win={innerWidth:834,innerHeight:1112,
  visualViewport:{width:834,height:1020,offsetLeft:0,offsetTop:42}};
 assert.deepEqual(c02InkVisualViewport(win),{
  width:834,height:1020,left:0,top:42
 });
 win.visualViewport.height=925;win.visualViewport.offsetTop=70;
 assert.deepEqual(c02InkVisualViewport(win),{
  width:834,height:925,left:0,top:70
 });
 win.visualViewport=null;
 assert.deepEqual(c02InkVisualViewport(win),{
  width:834,height:1112,left:0,top:0
 });
});
