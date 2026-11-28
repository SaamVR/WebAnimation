const sharp=require('sharp'),path=require('node:path'),assert=require('node:assert/strict');
const src=process.argv[2]||'dist/assets/worktable/variants/Artist-edit-backdrop-1.w1536.webp',out='src/assets';
// Native backdrop coordinates. Generous masks include the complete painted
// object, contact shadows and lamp glow, not just its bounding box.
const props=[
 {name:'lamp',box:[345,45,235,229],shape:'<rect x="362" y="60" width="204" height="205" rx="18"/>',blur:6,donor:630},
 {name:'brushes',box:[1014,63,130,180],shape:'<path d="M1028 77 Q1070 63 1119 75 L1128 106 1113 146 Q1131 192 1111 222 Q1076 244 1040 224 Q1024 203 1030 165 L1028 121Z"/>',blur:3,donor:790},
 {name:'tape',box:[1330,0,142,112],shape:'<path d="M1345 54 L1376 46 Q1380 12 1411 12 Q1448 8 1455 44 Q1460 76 1436 92 Q1402 102 1380 76 L1348 85Z"/>',blur:3,donor:750},
 {name:'ruler',box:[1016,501,304,176],shape:'<path d="M1024 630 L1291 509 L1310 547 L1040 669Z"/>',blur:2,donor:685},
 {name:'ink',box:[1002,721,164,140],shape:'<path d="M1012 780 Q1034 768 1069 777 L1069 755 Q1075 729 1104 729 Q1142 724 1150 759 L1154 813 Q1147 842 1110 844 L1070 837 Q1031 848 1011 825Z"/>',blur:3,donor:650}
];
(async()=>{
 const meta=await sharp(src).metadata();assert.equal(meta.width,1536);assert.equal(meta.height,864);
 const patches=[];
 for(const {name,box:[left,top,width,height],shape,blur,donor} of props){
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="'+left+' '+top+' '+width+' '+height+'"><rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" fill="black"/><g fill="white">'+shape+'</g></svg>');
  const {data:mask,info}=await sharp(svg).removeAlpha().greyscale().blur(blur).raw().toBuffer({resolveWithObject:true});assert.equal(info.channels,1);assert.equal(mask.length,width*height);
  const raw=await sharp(src).extract({left,top,width,height}).removeAlpha().raw().toBuffer();
  const rgba=(rgb,alpha)=>{const b=Buffer.alloc(width*height*4);for(let i=0;i<width*height;i++){b[i*4]=rgb[i*3];b[i*4+1]=rgb[i*3+1];b[i*4+2]=rgb[i*3+2];b[i*4+3]=alpha[i]}return b};
  await sharp(rgba(raw,mask),{raw:{width,height,channels:4}}).webp({lossless:true}).toFile(path.join(out,'worktable-desktop-'+name+'.webp'));
  // The original object must be fully covered. Dilate the relocation mask
  // before feathering the replacement wood, so no old outline survives.
  const expanded=Buffer.alloc(mask.length);const radius=name==='lamp'?10:5;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){let m=0;for(let yy=Math.max(0,y-radius);yy<=Math.min(height-1,y+radius);yy++)for(let xx=Math.max(0,x-radius);xx<=Math.min(width-1,x+radius);xx++)m=Math.max(m,mask[yy*width+xx]);expanded[y*width+x]=m;}
  const alpha=await sharp(expanded,{raw:{width,height,channels:1}}).blur(2).extractChannel(0).raw().toBuffer();assert.equal(alpha.length,width*height);
  const wood=await sharp(src).extract({left:donor,top,width,height}).removeAlpha().raw().toBuffer();
  patches.push({input:await sharp(rgba(wood,alpha),{raw:{width,height,channels:4}}).png().toBuffer(),left,top});
 }
 await sharp({create:{width:1536,height:864,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(patches).webp({lossless:true}).toFile(path.join(out,'worktable-desktop-decor-underlay.webp'));
 console.log('Five complete original props extracted, native resolution retained');
})().catch(e=>{console.error(e);process.exit(1)});
