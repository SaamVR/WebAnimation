import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {C02_INK_ASSET,c02InkAssetPlacement} from '../src/motion/c02/ink-asset.mjs';
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
 assert.match(runtime,/const pngCover=edgeStyle==='asset'&&mode==='cover'/);
 assert.match(runtime,/inkAssetImg\.style\.width=placement\.renderedWidth/);
 assert.match(runtime,/inkAssetImg\.style\.height=placement\.renderHeight/);
 assert.match(runtime,/inkAssetFill\.style\.width=placement\.interiorFillWidth/);
 assert.match(runtime,/background-repeat:repeat-x;background-position:right top/);
 assert.match(runtime,/inkAssetFill\.style\.backgroundSize=placement\.interiorLoopWidth/);
 assert.doesNotMatch(runtime,/background:#293D2D;width:0/);
 assert.match(runtime,/svg\.style\.visibility=pngCover\?'hidden':'visible'/);
 assert.match(runtime,/overlay\.animate\('reveal',C02_MOTION\.revealMs,cleanup\)/);
 assert.match(runtime,/inkEdgeX\(p,470,27\)\*win\.innerWidth\/1000/);
 assert.match(runtime,/scaleX\(-1\) rotate\(90deg\)/);
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
