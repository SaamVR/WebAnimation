const sharp=require('sharp'),fs=require('fs');
(async()=>{
 const src='dist/assets/worktable/variants/Artist-edit-backdrop-1.w1536.webp',out='src/assets';
 const w=270,h=330;
 // Same original tabletop, with a feathered rectangular edge around the plant.
 const mask=Buffer.from('<svg width="270" height="330" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="x"><stop offset="0" stop-color="white"/><stop offset=".91" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".94" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="m"><rect width="270" height="330" fill="url(#y)"/></mask></defs><rect width="270" height="330" fill="url(#x)" mask="url(#m)"/></svg>');
 // Convert luminance to alpha, preserving the entire plant and its original shadow.
 const alpha=await sharp(mask).flatten({background:'#000'}).greyscale().raw().toBuffer();
 const extract=async(left,top,file)=>{
  const rgb=await sharp(src).extract({left,top,width:w,height:h}).removeAlpha().raw().toBuffer();
  const rgba=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){rgba[i*4]=rgb[i*3];rgba[i*4+1]=rgb[i*3+1];rgba[i*4+2]=rgb[i*3+2];rgba[i*4+3]=alpha[i]}
  await sharp(rgba,{raw:{width:w,height:h,channels:4}}).webp({quality:95,alphaQuality:100}).toFile(out+'/'+file);
 };
 await extract(580,0,'worktable-desktop-plant-underlay.webp');
 await extract(0,0,'worktable-desktop-plant-cluster.webp');
})().catch(e=>{console.error(e);process.exitCode=1});