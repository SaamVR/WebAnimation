import { WORKTABLE_VIEWBOX, GARMENT_VARIANTS, createWorktableState, worktableReducer } from './worktable-stage.mjs';

// Immutable 4000×2250 artwork is registered on the same 2048×1152 stage.
// Cropped WebP browser variants retain original alpha coordinates and source SHA256.
const ASSET_ROOT = '/assets/worktable/';
const ALL = {
  backdrop: 'Artist-edit-backdrop-1.png',
  garment: {
    regular:'Tshirts/walnut_table_background_exact_tone_4K_1.png',
    dropShoulder:'Tshirts/walnut_table_background_exact_tone_4K_2.png',
    fullSleeve:'Tshirts/walnut_table_background_exact_tone_4K-3.png',
    hoodie:'Tshirts/walnut_table_background_exact_tone_4K-4.png',
  },
  workers: ['Worker/Mini_worker_1.png','Worker/Mini_worker_1.pn2.png','Worker/Mini_worker_1.pn3.png'],
};
export const WORKTABLE_GARMENT_ASSETS=Object.freeze({...ALL.garment});
const layers = [
  ['Garment style/Garment_style_backboard_5.png'],
  ['Garment style/Garment_style_title_1.png'],
  ['Garment style/Garment_style_title_2.png'],
  ['Garment style/Garment_style_title_3.png'],
  ['Garment style/Garment_style_1_regular.png','garment','regular'],
  ['Garment style/Garment_style_2_drop_shoulder.png','garment','dropShoulder'],
  ['Garment style/Garment_style_3_full_sleeve.png','garment','fullSleeve'],
  ['Garment style/Garment_style_4_hoodie.png','garment','hoodie'],
  ['Tshirt color/Tshirt_color_box_back_without_front_panel.png'],
  ['Tshirt color/Tshirt_color_title_1.png'],
  ['Tshirt color/Tshirt_color_title_2.png'],
  ['Tshirt color/Tshirt_color_title_3.png'],
  ...[1,2,3,4,5,6].map((n)=>[`Tshirt color/Tshirt_color_${n}.png`,'color',['black','white','red','yellow','blue','green'][n-1]]),
  ['Tshirt color/Tshirt_color_box_front_panel.png'],
  ['Size/Tshirt_size_title_1.png'],
  ...[['XXL',6,'S'],['XL',5,'M'],['L',4,'L'],['M',3,'XL'],['S',2,'XXL']].map(([sourceLabel,n,visibleLabel])=>[`Size/Tshirt_size_${sourceLabel}_${n}.png`,'size',visibleLabel]),
  ['Upload image notebook/Upload_image_notebook_1.png'],
  ['Upload image notebook/Upload_image_notebook_title_2.png'],
  ['Upload image notebook/Upload_image_notebook_title_3.png'],
  ['Upload image notebook/Upload_image_notebook_upload_button_4.png','upload','upload'],
  ['Print size/Print_size_backboard_3.png'],
  ['Print size/Print_size_title_1.png'],
  ['Print size/Print_size_title_2.png'],
  ['Print size/Print_size_A3_1.png','printSize','A3'],
  ['Print size/Print_size_A4_2.png','printSize','A4'],
];
export const WORKTABLE_SOURCE_STACK=Object.freeze([ALL.backdrop,...layers.map(layer=>layer[0]),ALL.garment.regular,...ALL.workers]);
const labels = {
  regular:'Regular Tee', dropShoulder:'Drop Shoulder',fullSleeve:'Full Sleeve',hoodie:'Hoodie',
  black:'Black',white:'White',red:'Red',yellow:'Yellow',blue:'Blue',green:'Green',
  S:'S',M:'M',L:'L',XL:'XL',XXL:'XXL',A3:'A3',A4:'A4',
};
const dyeRGB = {
  black:'#292b2a',white:'#ffffff',red:'#bf3846',yellow:'#e1bc33',blue:'#2a6ea9',green:'#317452',
};
const supportedAssets=new Set([ALL.backdrop,...Object.values(ALL.garment),...ALL.workers,...layers.map(x=>x[0])]);
const fmt = path=>ASSET_ROOT+path.split('/').map(encodeURIComponent).join('/');
const sizesFor = widthFraction => `(max-width: 1540px) ${(widthFraction*100).toFixed(5)}vw, ${(widthFraction*1540).toFixed(2)}px`;
const variantURL = variant => fmt(variant.path);
const sourceSet = variants => variants.map(v=>variantURL(v)+' '+v.width+'w').join(', ');

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const percent=(v,size)=>`${v/size*100}%`;

export async function mountWorktable(root,{manifestURL='/assets/worktable/manifest.json',manifestData=null,embedded=false}={}){
 if(!root)throw new Error('Worktable mount element is required');
 let manifest=manifestData;
 if(!manifest){
  const response=await fetch(manifestURL,{cache:'force-cache'});
  if(!response.ok)throw new Error('The approved full-canvas artwork manifest has not been installed');
  manifest=await response.json();
 }
 const missing=[...supportedAssets].filter(x=>!manifest[x] || manifest[x].original.join('x')!=='4000x2250' || manifest[x].delivery?.variants?.length!==3);
 if(!manifest.__initialScene?.variants?.length)throw new Error('The assembled preview is unavailable');
 if(missing.length)throw new Error('Missing approved 4000×2250 layers: '+missing.join(', '));
 const state=createWorktableState();
 let current=state;
 let artURL=null;
 let artBitmap=null;
 const editor={x:0,y:0,scale:1};
 let dragging=null;
 const body=document.createElement('div');
 body.className='cc-worktable is-loading is-hydrating';
 body.innerHTML=`<div class="cc-worktable-header"><p class="cc-eyebrow">FROM THE STUDIO · CHAPCHITRA</p><h1>Artist’s Edit</h1><p>Bring a print idea to the worktable. Your design remains on this device.</p></div>
  <div class="cc-worktable-frame"><div class="cc-worktable-stage" id="artistWorktable" role="group" aria-busy="true" aria-label="Interactive print studio: select garment, size, color, artwork and paper size"><p class="cc-worktable-loading" role="status">Preparing your original studio artwork…</p></div></div>
  <section class="cc-worktable-palette" aria-label="Accessible design controls"><h2>Customize your print</h2><div class="cc-worktable-rail"></div>
  <div class="cc-worktable-upload-row"><button type="button" id="worktableUploadArt" aria-label="Upload your artwork">Upload artwork</button><label class="cc-worktable-scale">Artwork size <input type="range" id="worktableArtScale" min="50" max="100" step="5" value="100" disabled aria-label="Resize uploaded design"><output id="worktableScaleOutput">100%</output></label><button type="button" id="worktableResetArt" disabled>Reset placement</button><button type="button" id="worktableRemoveArt" disabled>Remove artwork</button></div>
  <p class="cc-worktable-hint">Drag your uploaded design on the fabric to position it. A3/A4 represent relative preview sizes; production print dimensions and fabric-color accuracy require manufacturer calibration.</p>
  <p class="cc-worktable-live" role="status" id="worktableMessage" aria-live="polite"></p></section>
  <input id="worktableFile" type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label="Choose local design image">`;
 if(embedded)body.querySelector('.cc-worktable-header')?.remove();
 root.replaceChildren(body);
 const stage=root.querySelector('.cc-worktable-stage');
 const rail=root.querySelector('.cc-worktable-rail');
 const file=root.querySelector('#worktableFile');
 const uploadButton=root.querySelector('#worktableUploadArt');
 const msg=root.querySelector('#worktableMessage');
 const scale=root.querySelector('#worktableArtScale');
 const scaleOut=root.querySelector('#worktableScaleOutput');
 const remove=root.querySelector('#worktableRemoveArt');
 const reset=root.querySelector('#worktableResetArt');
 let layerCounter=0;
 const visualImages=[];
 const sourceInfo=path=>{
  const meta=manifest[path]?.delivery;
  if(!meta)throw new Error('Missing optimized geometry for '+path);
  return meta;
 };
 const positionLayer=(img,path)=>{
  const info=sourceInfo(path),box=info.stageBox;
  img.style.left=percent(box[0],2048);img.style.top=percent(box[1],1152);
  img.style.width=percent(box[2],2048);img.style.height=percent(box[3],1152);
  img.dataset.source=path;
  return info;
 };
 const attachAsset=(img,path)=>{
  const info=positionLayer(img,path);
  img.sizes=sizesFor(info.crop[2]/4000);
  img.srcset=sourceSet(info.variants);
  img.src=variantURL(info.variants[1]);
 };
 const addImage=(path,extra='',data={})=>{
  const img=document.createElement('img');img.className='cc-worktable-layer '+extra;
  img.alt='';img.setAttribute('aria-hidden','true');
  img.draggable=false;img.loading='eager';img.decoding='async';
  positionLayer(img,path);
  img.dataset.visualOrder=String(layerCounter++);
  if(data.group)img.dataset.group=data.group;
  if(data.value)img.dataset.value=data.value;
  stage.append(img);visualImages.push(img);
  // No eager network request here. A complete preview arrives first;
  // independent trimmed layers hydrate with bounded decode concurrency.
  return img;
 };
 addImage(ALL.backdrop,'cc-worktable-desk');
 const clickTargets=[];
 const interactiveImgs=[];
 const hitFor=(path,group,value)=>{
  const b=manifest[path].bbox;
  // Actual source-alpha bounds, not independent visual positioning.
  const el=document.createElement('button');el.type='button';el.className='cc-worktable-hit';
  el.dataset.group=group;el.dataset.value=value;
  const x=Math.max(0,b[0]-7),y=Math.max(0,b[1]-7);
  const w=Math.min(2048-x,b[2]-b[0]+14),h=Math.min(1152-y,b[3]-b[1]+14);
  el.style.setProperty('--x',percent(x,2048));el.style.setProperty('--y',percent(y,1152));
  el.style.setProperty('--w',percent(w,2048));el.style.setProperty('--h',percent(h,1152));
  const label=group==='garment'?labels[value]+' garment':group==='size'?'Size '+labels[value]:group==='color'?labels[value]+' fabric color':group==='printSize'?'Print size '+value:'Upload your art';
  el.setAttribute('aria-label',label);el.title=label;
  if(group!=='upload')el.setAttribute('aria-pressed','false');
  stage.append(el);clickTargets.push(el);
  return el;
 };
 const interactiveFiles=[];
 for(const [path,group,value] of layers){
  const im=addImage(path,'cc-worktable-prop', {group,value});
  if(group){interactiveImgs.push(im);interactiveFiles.push({path,group,value});}
 }
 let garmentImg=addImage(ALL.garment.regular,'cc-worktable-garment');
 const tint=document.createElement('div'); tint.className='cc-worktable-tint'; stage.append(tint);
 const print=document.createElement('div');print.className='cc-worktable-print';
 const artImg=document.createElement('img');artImg.alt='Your uploaded artwork preview';artImg.draggable=false;
 print.append(artImg);stage.append(print);
 for(const path of ALL.workers)addImage(path,'cc-worktable-worker');
 for(const {path,group,value} of interactiveFiles)hitFor(path,group,value);
 // The notebook itself is one touchable hotspot, alongside the upload icon.
 hitFor('Upload image notebook/Upload_image_notebook_1.png','upload','upload');
 const sideControl=(group,value)=>{
  const b=document.createElement('button');b.type='button';b.dataset.group=group;b.dataset.value=value;
  b.className='cc-worktable-choice';b.textContent=labels[value]||value;
  b.setAttribute('aria-pressed','false');
  return b;
 };
 for(const [title,group,values] of [
  ['Garment style','garment',Object.keys(ALL.garment)],
  ['Size','size',['S','M','L','XL','XXL']],
  ['Fabric color','color',['black','white','red','yellow','blue','green']],
  ['Print size','printSize',['A3','A4']],
 ]){
  const field=document.createElement('fieldset'); field.className='cc-worktable-field';
  const legend=document.createElement('legend');legend.textContent=title;field.append(legend);
  const buttons=document.createElement('div');buttons.className='cc-worktable-choice-row';
  for(const val of values){const b=sideControl(group,val);if(group==='color')b.style.setProperty('--swatch',dyeRGB[val]);buttons.append(b)}
  field.append(buttons);rail.append(field);
 }
 const buttons=[...root.querySelectorAll('[data-group][data-value]')];
 const announce=t=>{msg.textContent=t};
 const maxArtBox=(variant=current.garment,kind=current.printSize)=>{
  const guide=GARMENT_VARIANTS[variant].chestGuide;
  // A-series relative scale only; actual print production measurements are not supplied.
  const multiplier=kind==='A4'?Math.SQRT1_2:1;
  const width=guide.width*.88*multiplier;
  const height=guide.height*.91*multiplier;
  return {x:guide.x+(guide.width-width)/2,y:guide.y+(guide.height-height)/2,width,height};
 };
 const printPosition=()=>{
  const box=maxArtBox();
  editor.scale=clamp(editor.scale,.5,1);
  const width=box.width*editor.scale;
  const height=box.height*editor.scale;
  const lim=GARMENT_VARIANTS[current.garment].chestGuide;
  editor.x=clamp(editor.x,lim.x-box.x,lim.x+lim.width-box.x-width);
  editor.y=clamp(editor.y,lim.y-box.y,lim.y+lim.height-box.y-height);
  const x=box.x+editor.x,y=box.y+editor.y;
  print.style.left=percent(x,2048);print.style.top=percent(y,1152);
  print.style.width=percent(width,2048);print.style.height=percent(height,1152);
 };
 let hydrated=false;
 let switchToken=0;
 let preview=null;
 const swapPreview=async(wanted,token)=>{
  const info=manifest.__initialScene.garments?.[wanted];
  if(!preview || !info?.variants)throw new Error('Missing complete worktable scene');
  if(preview.dataset.garment===wanted)return;
  const next=new Image();
  next.className='cc-worktable-layer cc-worktable-preview';
  next.alt='';next.setAttribute('aria-hidden','true');next.draggable=false;
  next.decoding='async';next.loading='eager';next.fetchPriority='high';
  next.sizes='(max-width: 1540px) 100vw, 1540px';
  next.srcset=sourceSet(info.variants);
  next.src=variantURL(info.variants[1]);
  next.dataset.garment=wanted;
  try{
   await next.decode();
   if(token!==switchToken||hydrated||wanted!==current.garment||!preview.isConnected)return;
   preview.replaceWith(next);preview=next;
  }catch{announce('This garment preview could not load. The worktable is still usable.')}
 };
 const updateTintMask=()=>{
  const info=sourceInfo(ALL.garment[current.garment]);
  const b=info.stageBox;
  tint.style.left=percent(b[0],2048);tint.style.top=percent(b[1],1152);
  tint.style.width=percent(b[2],2048);tint.style.height=percent(b[3],1152);
  const url=hydrated&&garmentImg.dataset.source===ALL.garment[current.garment] ? (garmentImg.currentSrc||variantURL(info.variants[1])) : variantURL(info.variants[1]);
  tint.style.webkitMaskImage=`url("${url}")`;
  tint.style.maskImage=`url("${url}")`;
 };
 const switchGarment=async (wanted)=>{
  const token=++switchToken;
  if(!hydrated)return swapPreview(wanted,token);
  const path=ALL.garment[wanted];
  if(garmentImg.dataset.source===path)return;
  const trial=new Image();
  trial.className=garmentImg.className;
  trial.alt='';trial.setAttribute('aria-hidden','true');
  trial.draggable=false;trial.loading='eager';trial.decoding='async';
  trial.dataset.visualOrder=garmentImg.dataset.visualOrder;
  attachAsset(trial,path);
  try{
   await trial.decode();
   if(token!==switchToken||wanted!==current.garment)return;
   // Swap the already decoded element, not just its URL: no blank/flickering
   // intermediate garment frame and no forced decode on the old image node.
   const old=garmentImg;
   old.replaceWith(trial);garmentImg=trial;
   const position=visualImages.indexOf(old);
   if(position>=0)visualImages[position]=trial;
   updateTintMask();
  }catch{
   announce('This garment image is temporarily unavailable. Try again.');
  }
 };
 const paintSelection=()=>{
  const color=dyeRGB[current.color];
  tint.style.backgroundColor=color;
  updateTintMask();
  tint.classList.toggle('is-colored',current.color!=='white');
  print.classList.toggle('has-art',!!artURL);
  for(const b of buttons){
   const checked=b.dataset.group!=='upload'&&current[b.dataset.group]===b.dataset.value;
   if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',String(checked));
  }
  printPosition();
 };
 const clearArtURL=()=>{if(artURL)URL.revokeObjectURL(artURL);artURL=null;artBitmap=null};
 const update=(group,value)=>{
  if(group==='upload'){file.click();return}
  current=worktableReducer(current,{type:'select',group,value});
  if(group==='garment'||group==='printSize')editor.x=editor.y=0;
  paintSelection();announce(`${labels[value]} selected`);
  if(group==='garment')void switchGarment(value);
 };
 for(const b of buttons){
  b.addEventListener('click',()=>update(b.dataset.group,b.dataset.value));
  if(b.classList.contains('cc-worktable-hit')){
   b.addEventListener('pointerenter',()=>stage.querySelectorAll('.cc-worktable-prop').forEach(im=>im.classList.toggle('is-hovered',im.dataset.group===b.dataset.group&&im.dataset.value===b.dataset.value)));
   b.addEventListener('pointerleave',()=>interactiveImgs.forEach(im=>im.classList.remove('is-hovered')));
   b.addEventListener('focus',()=>stage.querySelectorAll('.cc-worktable-prop').forEach(im=>im.classList.toggle('is-hovered',im.dataset.group===b.dataset.group&&im.dataset.value===b.dataset.value)));
   b.addEventListener('blur',()=>interactiveImgs.forEach(im=>im.classList.remove('is-hovered')));
  }
 }
 // Keep upload available as an accessible 44px touch target even when
 // the illustrated stage hotspots are too small on narrow screens.
 uploadButton.addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const fileObj=file.files?.[0];if(!fileObj)return;
  if(!['image/png','image/jpeg','image/webp'].includes(fileObj.type)){
   announce('Please choose a PNG, JPEG, or WebP design. SVG is not supported for security.');file.value='';return;
  }
  if(fileObj.size>10*1024*1024){announce('Artwork must be 10 MB or smaller.');file.value='';return}
  const next=URL.createObjectURL(fileObj);
  try{
   const img=new Image();img.src=next;await img.decode();
   if(img.naturalWidth<1||img.naturalHeight<1||img.naturalWidth>8192||img.naturalHeight>8192)throw Error('Unsupported image dimensions');
   clearArtURL();artURL=next;artBitmap=img;
   artImg.src=artURL;artImg.style.objectFit='contain';
   editor.x=editor.y=0;editor.scale=1;
   scale.value='100';scaleOut.textContent='100%';scale.disabled=false;remove.disabled=false;reset.disabled=false;
   paintSelection();announce('Artwork loaded locally. Drag its preview on the garment or use the resize slider.');
  }catch{URL.revokeObjectURL(next);announce('The selected image could not be decoded.');}
  file.value='';
 });
 scale.addEventListener('input',()=>{
  editor.scale=Number(scale.value)/100;scaleOut.textContent=scale.value+'%';
  printPosition();
 });
 reset.addEventListener('click',()=>{editor.x=editor.y=0;editor.scale=1;scale.value='100';scaleOut.textContent='100%';printPosition();announce('Artwork placement reset.')});
 remove.addEventListener('click',()=>{clearArtURL();artImg.removeAttribute('src');scale.disabled=true;remove.disabled=true;reset.disabled=true;paintSelection();announce('Artwork removed.')});
 const dragLayer=document.createElement('button');dragLayer.type='button';dragLayer.className='cc-worktable-drag';
 dragLayer.setAttribute('aria-label','Drag uploaded artwork to reposition');
 dragLayer.title='Move uploaded artwork';print.append(dragLayer);
 const dragStart=e=>{
  if(!artURL)return;
  const stageRect=stage.getBoundingClientRect();const factor=2048/stageRect.width;
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,startX:editor.x,startY:editor.y,factor};
  dragLayer.setPointerCapture(e.pointerId);dragLayer.classList.add('is-dragging');
 };
 dragLayer.addEventListener('pointerdown',dragStart);
 dragLayer.addEventListener('pointermove',e=>{
  if(!dragging||dragging.id!==e.pointerId)return;
  editor.x=dragging.startX+(e.clientX-dragging.x)*dragging.factor;
  editor.y=dragging.startY+(e.clientY-dragging.y)*dragging.factor;
  printPosition();
 });
 const dragEnd=()=>{dragging=null;dragLayer.classList.remove('is-dragging')};
 dragLayer.addEventListener('pointerup',dragEnd);
 dragLayer.addEventListener('pointercancel',dragEnd);
 dragLayer.addEventListener('keydown',e=>{
  if(!artURL)return;
  const delta=e.shiftKey?14:4;
  const dx={ArrowLeft:-delta,ArrowRight:delta}[e.key];
  const dy={ArrowUp:-delta,ArrowDown:delta}[e.key];
  if(dx===undefined&&dy===undefined)return;
  e.preventDefault();editor.x+=dx||0;editor.y+=dy||0;printPosition();
 });
 const unload=()=>clearArtURL();window.addEventListener('pagehide',unload,{once:true});
 paintSelection();
 announce('Preparing the illustrated worktable…');
 // A single real composition, assembled ONLY from the original layered files,
 // lets the complete worktable appear without waiting for 39 image decodes.
 preview=document.createElement('img');
 preview.className='cc-worktable-layer cc-worktable-preview';
 preview.alt='';preview.setAttribute('aria-hidden','true');
 preview.decoding='async';preview.loading='eager';preview.fetchPriority='high';
 preview.sizes='(max-width: 1540px) 100vw, 1540px';
 preview.srcset=sourceSet(manifest.__initialScene.variants);
 preview.src=variantURL(manifest.__initialScene.variants[1]);
 preview.dataset.garment='regular';
 stage.append(preview);
 let previewSucceeded=false;
 const loadOne=async img=>{
  const path=img===garmentImg?ALL.garment[current.garment]:img.dataset.source;
  attachAsset(img,path);
  await img.decode();
 };
 const hydrate=async()=>{
  const errors=[];
  let index=0;
  const worker=async()=>{
   while(index<visualImages.length){
    const item=visualImages[index++];
    try{await loadOne(item)}
    catch(error){errors.push(item.dataset.source)}
   }
  };
  await Promise.all([worker(),worker()]);
  if(errors.length){
   console.warn('Worktable deferred images failed:',errors);
   if(!previewSucceeded){
    // No preview exists: retain the successfully decoded individual assets.
    body.classList.remove('is-hydrating');
    stage.querySelector('.cc-worktable-loading')?.remove();
    announce('Part of the artwork could not load. Available layers and controls remain usable.');
   }else{
    announce('Some fine artwork layers could not load. The complete preview remains visible; the controls are still usable.');
   }
   return;
  }
  // The owner can select another garment while the background layers decode.
  if(garmentImg.dataset.source!==ALL.garment[current.garment]){
   try{await loadOne(garmentImg)}catch{
    announce('The requested garment is temporarily unavailable. The complete preview remains visible.');
    return;
   }
  }
  updateTintMask();
  // One atomic handoff: never expose a half-decoded stack or a blank frame.
  hydrated=true;
  body.classList.remove('is-hydrating');
  preview.remove();
  stage.querySelector('.cc-worktable-loading')?.remove();
  announce('Worktable ready. Every detail is registered to the original artwork.');
 };
 try{
  await preview.decode();
  previewSucceeded=true;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  body.classList.remove('is-loading');
  stage.removeAttribute('aria-busy');
  stage.querySelector('.cc-worktable-loading')?.remove();
  announce('Worktable ready. Optional individual layers are being prepared.');
 }catch(error){
  console.warn('Worktable first-frame image failed; recovering individual layers',error);
  preview.remove();
  const status=stage.querySelector('.cc-worktable-loading');
  if(status)status.textContent='Recovering original artwork layers…';
  // Retain the real loading message while fallback layers decode, not a blank stage.
  stage.removeAttribute('aria-busy');
  body.classList.remove('is-loading');
 }
 void hydrate();
 return {getState:()=>({...current}),getPlacement:()=>({...editor}),destroy:()=>{clearArtURL();window.removeEventListener('pagehide',unload);root.replaceChildren()}};
}