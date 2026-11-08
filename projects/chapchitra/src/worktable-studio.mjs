import { WORKTABLE_VIEWBOX, GARMENT_VARIANTS, createWorktableState, worktableReducer } from './worktable-stage.mjs';
import { UPLOAD_ARTWORK_SVG } from './worktable-upload-icon.mjs';
import { FABRIC_PIGMENTS, applyFabricPigmentToRGBA } from './worktable-fabric-pigments.mjs';
import { placementGeometry, printGuideGeometry, printScaleLabel, resolutionGuidance } from './worktable-print-placement.mjs';

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
// Keep the immutable 39-file original source stack for provenance/QA.
export const WORKTABLE_SOURCE_STACK=Object.freeze([ALL.backdrop,...layers.map(layer=>layer[0]),ALL.garment.regular,...ALL.workers]);
// The interactive upload icon is now the owner's vector. Omit ONLY that old
// raster layer when creating the 12 assembled previews: no double drawing.
export const WORKTABLE_UPLOAD_RASTER='Upload image notebook/Upload_image_notebook_upload_button_4.png';
export const WORKTABLE_PREVIEW_STACK=Object.freeze(WORKTABLE_SOURCE_STACK.filter(path=>path!==WORKTABLE_UPLOAD_RASTER));
// The on-demand atomic preview uses the same checksum-pinned original layers,
// but has no baked garment: no previous white shirt can show through a new one.
export const WORKTABLE_ATOMIC_BACKPLATE_STACK=Object.freeze(
 WORKTABLE_PREVIEW_STACK.filter(path=>!Object.values(ALL.garment).includes(path)&&!ALL.workers.includes(path))
);
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
 const editor={x:0,y:0,adjustment:0,rotation:0,selected:false,mode:'move'};
 let dragging=null;
 const body=document.createElement('div');
 body.className='cc-worktable is-loading is-hydrating';
 body.innerHTML=`<div class="cc-worktable-header"><p class="cc-eyebrow">FROM THE STUDIO · CHAPCHITRA</p><h1>Artist’s Edit</h1><p>Bring a print idea to the worktable. Your design remains on this device.</p></div>
  <div class="cc-worktable-frame"><div class="cc-worktable-stage" id="artistWorktable" role="group" aria-busy="true" aria-label="Interactive print studio: select garment, size, color, artwork and paper size"><p class="cc-worktable-loading" role="status">Preparing your original studio artwork…</p></div></div>
  <section class="cc-worktable-palette" aria-labelledby="worktableCustomizeHeading">
    <header class="cc-worktable-panel-intro">
      <p class="cc-worktable-panel-kicker">THE PRINT STUDIO <span aria-hidden="true">/</span> MAKE IT YOURS</p>
      <div class="cc-worktable-panel-intro-row">
        <h2 id="worktableCustomizeHeading">Customize your print</h2>
        <p class="cc-worktable-panel-subtitle">Thoughtful details, made your way. Each selection is reflected on the worktable above.</p>
      </div>
    </header>
    <div class="cc-worktable-rail" aria-label="Garment, size, fabric color and print size"></div>
    <section class="cc-worktable-artwork-zone" aria-labelledby="worktableArtworkHeading">
      <div class="cc-worktable-artwork-intro">
        <p class="cc-worktable-artwork-kicker">YOUR OWN MARK <span aria-hidden="true">/</span> FINISHING TOUCHES</p>
        <h3 id="worktableArtworkHeading">Artwork tools</h3>
        <p>Add a design from your device, then adjust its size and placement directly on the garment.</p>
      </div>
      <div class="cc-worktable-upload-row">
        <div class="cc-worktable-upload-group">
          <button type="button" id="worktableUploadArt" aria-label="Upload your artwork">Upload artwork</button>
          <aside class="cc-worktable-resolution-note" aria-label="Artwork resolution recommendations">
            <p class="cc-worktable-resolution-heading">Recommended artwork resolution (300 PPI)</p>
            <p><strong>A4</strong> <span>2480 × 3508 px (8.27 × 11.69 in)</span></p>
            <p><strong>A3</strong> <span>3508 × 4961 px (11.69 × 16.54 in)</span></p>
            <p class="cc-worktable-resolution-explainer">These are recommended dimensions for high-quality printing. Other image sizes are accepted for preview. Final print quality depends on actual print dimensions and production requirements.</p>
            <p id="worktableArtworkQuality" class="cc-worktable-quality" role="status" aria-live="polite"></p>
          </aside>
        </div>
        <label class="cc-worktable-scale"><span class="cc-worktable-scale-label">Artwork size — adjustment from A3/A4</span><span class="cc-worktable-scale-control"><input type="range" id="worktableArtScale" min="-50" max="100" step="1" value="0" disabled aria-label="Artwork size adjustment from selected print reference"><output id="worktableScaleOutput">0%</output></span><span id="worktableSizeGuidance" class="cc-worktable-size-guidance" aria-live="polite"></span></label>
        <div class="cc-worktable-secondary-actions"><button type="button" id="worktableResetArt" disabled>Reset placement</button><button type="button" id="worktableRemoveArt" disabled>Remove artwork</button></div>
      </div>
    </section>
    <p class="cc-worktable-hint">Drag your uploaded design on the fabric to position it. A3/A4 represent relative preview sizes; production print dimensions and fabric-color accuracy require manufacturer calibration.</p>
    <p class="cc-worktable-live" role="status" id="worktableMessage" aria-live="polite"></p>
  </section>
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
 const sizeGuidance=root.querySelector('#worktableSizeGuidance');
 const quality=root.querySelector('#worktableArtworkQuality');
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
 const interactionImages=new Map();
 const fineHover=window.matchMedia('(hover:hover) and (pointer:fine)');
 const keyFor=(group,value)=>group+':'+value;
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
 let uploadVisual=null;
 for(const [path,group,value] of layers){
  let im;
  if(path===WORKTABLE_UPLOAD_RASTER){
   // Single inline SVG in exactly the original alpha-crop stageBox.
   // Its source paths and original colors remain untouched; the rendering
   // viewBox trims Illustrator's empty export margins, not the artwork.
   im=document.createElement('div');
   im.className='cc-worktable-layer cc-worktable-prop cc-worktable-upload-svg-layer';
   positionLayer(im,path);
   im.dataset.visualOrder=String(layerCounter++);
   im.dataset.group='upload';im.dataset.value='upload';
   const float=document.createElement('div');
   float.className='cc-worktable-upload-float';
   const template=document.createElement('template');
   template.innerHTML=UPLOAD_ARTWORK_SVG.slice(UPLOAD_ARTWORK_SVG.indexOf('<svg'));
   const vector=template.content.querySelector('svg');
   if(!vector || !vector.querySelector('#CIRCLE_FOR_PLUS ellipse') || !vector.querySelector('#PLUS path') ||
      !vector.querySelector('#FRAME_LINES'))throw new Error('Supplied upload SVG geometry is unavailable');
   vector.classList.add('cc-worktable-upload-svg');
   vector.setAttribute('viewBox','32 104 440 327');
   vector.setAttribute('preserveAspectRatio','xMidYMid meet');
   vector.setAttribute('aria-hidden','true');
   vector.setAttribute('focusable','false');
   // Scope original class rules to this SVG. No vector shape is recolored or changed.
   const artStyle=vector.querySelector('style');
   if(artStyle)artStyle.textContent=artStyle.textContent.replace(/\.st([0-3])\s*\{/g,'.cc-worktable-upload-svg .st$1{');
   float.append(vector);im.append(float);stage.append(im);
   uploadVisual=im;
  }else{
   im=addImage(path,'cc-worktable-prop',{group,value});
  }
  if(group){interactiveImgs.push(im);interactionImages.set(keyFor(group,value),im);interactiveFiles.push({path,group,value});}
 }
 if(!uploadVisual)throw new Error('Illustrated upload SVG was not mounted');
 let garmentImg=addImage(ALL.garment.regular,'cc-worktable-garment');
 const tint=document.createElement('div'); tint.className='cc-worktable-tint'; stage.append(tint);
 // Separate print guide: never inherited from the uploaded image bounds.
 const printGuide=document.createElement('div');
 printGuide.className='cc-worktable-print-guide';
 printGuide.setAttribute('aria-hidden','true');stage.append(printGuide);
 const print=document.createElement('div');print.className='cc-worktable-print';
 const artImg=document.createElement('img');artImg.alt='Your uploaded artwork preview';artImg.draggable=false;
 print.append(artImg);stage.append(print);
 // Compact native buttons, with vector symbols and no additional runtime.
 const editorToolbar=document.createElement('div');
 editorToolbar.className='cc-worktable-editor-toolbar';editorToolbar.hidden=true;
 editorToolbar.setAttribute('role','toolbar');editorToolbar.setAttribute('aria-label','Artwork editing tools');
 const toolIcons={
  move:'<path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>',
  resize:'<path d="M4 10V4h6M14 20h6v-6M4 4l7 7M20 20l-7-7"/>',
  rotate:'<path d="M4 10a8 8 0 1 1 1 6M4 4v6h6"/>'
 };
 for(const tool of ['move','resize','rotate']){
  const button=document.createElement('button');button.type='button';
  button.className='cc-worktable-tool';button.dataset.tool=tool;
  button.setAttribute('aria-label',tool==='rotate'?'Rotate artwork 90 degrees clockwise':tool==='resize'?'Resize artwork using corner handles':'Move artwork');
  if(tool!=='rotate')button.setAttribute('aria-pressed','false');
  button.title=tool==='rotate'?'Rotate +90°':tool[0].toUpperCase()+tool.slice(1);
  button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+toolIcons[tool]+'</svg>';
  editorToolbar.append(button);
 }
 stage.append(editorToolbar);
 const cornerHandles=new Map();
 for(const corner of ['nw','ne','se','sw']){
  const h=document.createElement('button');h.type='button';
  h.className='cc-worktable-corner-handle';h.dataset.corner=corner;
  h.setAttribute('aria-label','Resize artwork from '+({nw:'top-left',ne:'top-right',se:'bottom-right',sw:'bottom-left'}[corner])+' corner');
  h.title='Proportional resize';
  print.append(h);cornerHandles.set(corner,h);
 }
 for(const path of ALL.workers)addImage(path,'cc-worktable-worker');
 for(const {path,group,value} of interactiveFiles)hitFor(path,group,value);
 // Only the illustrated plus/upload image is a hotspot. The notebook paper
 // remains decorative and never opens the file chooser.
 // The panel reuses the exact same pressed-state buttons and reducer as the
 // illustration. Its editorial hierarchy is presentation only: no second
 // selected-state store and no modifications to the worktable hit targets.
 const sideControl=(group,value)=>{
  const b=document.createElement('button');b.type='button';b.dataset.group=group;b.dataset.value=value;
  b.className='cc-worktable-choice';
  b.setAttribute('aria-pressed','false');
  if(group==='color'){
   // Swatches represent the calibrated FABRIC, not the unchanged illustrated
   // paint-pot pigment. The button's visible name is retained for every color.
   b.style.setProperty('--cc-fabric-swatch',FABRIC_PIGMENTS[value].midtone);
   const dot=document.createElement('span');dot.className='cc-worktable-swatch';dot.setAttribute('aria-hidden','true');
   const name=document.createElement('span');name.className='cc-worktable-choice-label';name.textContent=labels[value];
   b.append(dot,name);
  }else{
   b.textContent=labels[value]||value;
  }
  return b;
 };
 for(const [index,title,description,group,values] of [
  ['01','Garment style','Choose your silhouette','garment',Object.keys(ALL.garment)],
  ['02','Size','Find your fit','size',['S','M','L','XL','XXL']],
  ['03','Fabric color','Pick your pigment','color',['black','white','red','yellow','blue','green']],
  ['04','Print size','Relative print area','printSize',['A3','A4']],
 ]){
  const field=document.createElement('fieldset');field.className='cc-worktable-field';
  const legend=document.createElement('legend');legend.className='cc-worktable-field-heading';
  const ordinal=document.createElement('span');ordinal.className='cc-worktable-field-index';ordinal.textContent=index+' ';
  const heading=document.createElement('span');heading.className='cc-worktable-field-title';heading.textContent=title;
  legend.append(ordinal,heading);
  const descriptionNode=document.createElement('p');descriptionNode.className='cc-worktable-field-note';
  descriptionNode.textContent=description;
  const buttons=document.createElement('div');buttons.className='cc-worktable-choice-row';buttons.dataset.controlGroup=group;
  for(const value of values)buttons.append(sideControl(group,value));
  field.append(legend,descriptionNode,buttons);
  rail.append(field);
 }
 // The SVG floats only while the actual notebook target is on screen.
 // Observer + page visibility prevent offscreen/background infinite movement.
 let uploadVisible=true;
 const syncUploadMotion=()=>uploadVisual.classList.toggle('is-idle-paused',document.hidden||!uploadVisible);
 const uploadObserver=typeof IntersectionObserver!=='undefined' ? new IntersectionObserver(items=>{
  uploadVisible=items.some(item=>item.isIntersecting);
  syncUploadMotion();
 },{threshold:.08}):null;
 uploadObserver?.observe(uploadVisual);
 document.addEventListener('visibilitychange',syncUploadMotion);
 syncUploadMotion();
 const buttons=[...root.querySelectorAll('[data-group][data-value]')];
 const announce=t=>{msg.textContent=t};
 // The guide remains independent of the uploaded file and is shown even
 // before any upload when a user changes the print preset.
 let placementFeedbackTimer=null,guideTimer=null,boundaryAnnounced=false;
 let resizing=null,lastInfo=null;
 const applyGuide=()=>{
  const f=printGuideGeometry({garment:current.garment,preset:current.printSize});
  printGuide.style.left=percent(f.x,2048);printGuide.style.top=percent(f.y,1152);
  printGuide.style.width=percent(f.width,2048);printGuide.style.height=percent(f.height,1152);
  printGuide.dataset.preset=current.printSize;
  return f;
 };
 const showGuide=(linger=1300)=>{
  applyGuide();printGuide.classList.add('is-shown');
  if(guideTimer!==null)clearTimeout(guideTimer);
  guideTimer=null;
  if(!editor.selected)guideTimer=setTimeout(()=>{
   if(!editor.selected)printGuide.classList.remove('is-shown');
   guideTimer=null;
  },linger);
 };
 const hideEditor=()=>{
  editor.selected=false;editorToolbar.hidden=true;
  print.classList.remove('is-edit-selected','is-resize-mode','is-manipulating');
  if(guideTimer!==null)clearTimeout(guideTimer);
  guideTimer=setTimeout(()=>{printGuide.classList.remove('is-shown');guideTimer=null},450);
 };
 const positionToolbar=()=>{
  if(!editor.selected||!artURL){editorToolbar.hidden=true;return;}
  editorToolbar.hidden=false;
  const sr=stage.getBoundingClientRect();
  if(!sr.width)return;
  const factor=sr.width/2048;
  const imageL=lastInfo.rotatedX*factor,imageR=(lastInfo.rotatedX+lastInfo.rotatedWidth)*factor;
  const imageT=lastInfo.rotatedY*factor,imageB=(lastInfo.rotatedY+lastInfo.rotatedHeight)*factor;
  const vertical=sr.width>=620;
  editorToolbar.classList.toggle('is-vertical',vertical);
  const width=editorToolbar.offsetWidth,height=editorToolbar.offsetHeight;
  let x,y;
  if(vertical){
   x=imageR+9+width<sr.width?imageR+9:imageL-width-9;
   y=(imageT+imageB-height)/2;
  }else{
   x=(imageL+imageR-width)/2;
   y=imageT-height-9>=4?imageT-height-9:imageB+8;
  }
  const left=Math.max(4,6-sr.left);
  const right=Math.min(sr.width-width-4,window.innerWidth-sr.left-width-6);
  x=Math.max(left,Math.min(Math.max(left,right),x));
  const upper=Math.max(4,6-sr.top);
  const lower=Math.min(sr.height-height-4,window.innerHeight-sr.top-height-6);
  y=Math.max(upper,Math.min(Math.max(upper,lower),y));
  editorToolbar.style.left=x+'px';editorToolbar.style.top=y+'px';
 };
 const selectEditor=(mode=editor.mode)=>{
  if(!artURL)return;
  editor.selected=true;editor.mode=mode;
  if(guideTimer!==null)clearTimeout(guideTimer);
  showGuide();print.classList.add('is-edit-selected');
  print.classList.toggle('is-resize-mode',mode==='resize');
  for(const b of editorToolbar.querySelectorAll('[data-tool]')){
   b.classList.toggle('is-active',b.dataset.tool===mode);
   if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',String(b.dataset.tool===mode));
  }
  positionToolbar();
 };
 const indicatePlacement=(duringDrag=false)=>{
  if(editor.mode==='resize'&&editor.selected)print.classList.add('is-manipulating');
  showGuide();
  if(placementFeedbackTimer!==null)clearTimeout(placementFeedbackTimer);
  placementFeedbackTimer=null;
  if(!duringDrag)placementFeedbackTimer=setTimeout(()=>{
   print.classList.remove('is-manipulating');placementFeedbackTimer=null;
  },750);
 };
 const printPosition=({feedback=false,constrainToGuide=false}={})=>{
  applyGuide();
  if(!artBitmap){
   scaleOut.textContent='0%';sizeGuidance.textContent='';quality.textContent='';
   lastInfo=null;positionToolbar();return;
  }
  const requested=editor.adjustment;
  const info=placementGeometry({
   garment:current.garment,preset:current.printSize,
   imageWidth:artBitmap.naturalWidth,imageHeight:artBitmap.naturalHeight,
   adjustment:requested,rotation:editor.rotation,
   dx:editor.x,dy:editor.y,constrainToGuide,
  });
  lastInfo=info;
  editor.adjustment=info.adjustment;editor.x=info.dx;editor.y=info.dy;
  scale.max=String(info.maxAdjustment);scale.value=String(info.adjustment);
  scaleOut.textContent=printScaleLabel(info.adjustment);
  print.style.left=percent(info.x,2048);print.style.top=percent(info.y,1152);
  print.style.width=percent(info.width,2048);print.style.height=percent(info.height,1152);
  print.style.transform='rotate('+editor.rotation+'deg)';
  print.dataset.rotation=String(editor.rotation);
  editorToolbar.querySelector('[data-tool=rotate]')?.setAttribute('aria-label',
   'Rotate artwork 90 degrees clockwise; current '+editor.rotation+' degrees');
  print.classList.toggle('is-beyond-reference',info.exceedsReference);
  const nominalNote=info.exceedsReference
   ? 'Above the nominal '+current.printSize+' visual reference. Confirm physical print dimensions with production.'
   : '';
  const limitNote=info.maxAdjustment<100&&info.adjustment===info.maxAdjustment
   ? ' Safe garment enlargement limit reached ('+printScaleLabel(info.maxAdjustment)+').' : '';
  const sizeNote=nominalNote+limitNote;
  if(sizeGuidance.textContent!==sizeNote)sizeGuidance.textContent=sizeNote;
  const assessment=resolutionGuidance({
   preset:current.printSize,imageWidth:artBitmap.naturalWidth,
   imageHeight:artBitmap.naturalHeight,adjustment:info.adjustment,
  });
  if(quality.textContent!==assessment.text)quality.textContent=assessment.text;
  quality.classList.toggle('is-low-resolution',assessment.low);
  if((dragging||resizing)&&info.constrained&&!boundaryAnnounced){
   announce('Artwork reached the safe editing boundary.');
   boundaryAnnounced=true;
  }else if(!info.constrained)boundaryAnnounced=false;
  if(feedback&&requested>info.maxAdjustment){
   announce('Maximum safe enlargement for this garment and orientation is '+printScaleLabel(info.maxAdjustment)+'.');
  }
  positionToolbar();
 };
 let hydrated=false;
 let layersReady=false;
 let switchToken=0;
 let latestRender=null;
 let garmentSurface=null;
 let visualGarment='regular', visualColor='white';
 let preview=null;
 // At most four decoded transparent garment layers, and one base plate,
 // are retained. Color combinations are drawn only when requested.
 const decoded=new Map();
 const stageWidth=()=>stage.getBoundingClientRect().width*Math.max(1,window.devicePixelRatio||1);
 const variantIndex=()=>stageWidth()>1536?2:stageWidth()>768?1:0;
 const loadVariant=(entry,index)=>{
  const variant=entry.variants[index],key=variant.path;
  if(!decoded.has(key)){
   const promise=(async()=>{
    const image=new Image();image.decoding='async';image.src=variantURL(variant);
    await image.decode();return image;
   })().catch(error=>{decoded.delete(key);throw error});
   decoded.set(key,promise);
  }
  return decoded.get(key);
 };
 const colorized=async(garment,color,index)=>{
  const path=ALL.garment[garment],info=sourceInfo(path);
  const source=await loadVariant(info,index);
  const canvas=document.createElement('canvas');
  canvas.className='cc-worktable-layer cc-worktable-garment-surface';
  canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
  positionLayer(canvas,path);
  canvas.dataset.garment=garment;canvas.dataset.color=color;
  const context=canvas.getContext('2d',{alpha:true,willReadFrequently:color!=='white'});
  if(!context)throw new Error('Garment canvas could not initialize');
  const pigmentStarted=performance.now();
  context.drawImage(source,0,0);
  if(color!=='white'){
   // Pigment profiles are calibrated independently from illustrated paint-pot
   // dyeRGB swatches. One CIE L* tone lookup preserves the original folds and
   // alpha while assigning vivid fabric pigment. No white/intermediate frame.
   if(!FABRIC_PIGMENTS[color])throw new Error('Unknown fabric pigment');
   const imageData=context.getImageData(0,0,canvas.width,canvas.height);
   applyFabricPigmentToRGBA(imageData.data,garment,color);
   context.putImageData(imageData,0,0);
  }
  // Diagnostic per garment paint: used for rendering regression measurements.
  // No extra source image, WebP decode, network request or animation dependency.
  canvas.dataset.pigmentRenderMs=(performance.now()-pigmentStarted).toFixed(2);
  return canvas;
 };
 const composeAtomicPreview=async(colored,index)=>{
  const info=manifest.__initialScene;
  if(!info.backplateVariants?.[index])throw new Error('Atomic worktable background unavailable');
  const [backplate,...workerImgs]=await Promise.all([
   loadVariant({variants:info.backplateVariants},index),
   ...ALL.workers.map(path=>loadVariant(sourceInfo(path),index)),
  ]);
  const canvas=document.createElement('canvas');
  canvas.width=backplate.naturalWidth;canvas.height=backplate.naturalHeight;
  canvas.className='cc-worktable-layer cc-worktable-preview';
  canvas.dataset.garment=colored.dataset.garment;
  canvas.dataset.color=colored.dataset.color;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)throw new Error('Atomic preview canvas could not initialize');
  ctx.drawImage(backplate,0,0);
  const place=(img,path)=>{
   const crop=sourceInfo(path).crop;
   const left=Math.round(crop[0]*canvas.width/4000);
   const top=Math.round(crop[1]*canvas.width/4000);
   ctx.drawImage(img,left,top);
  };
  place(colored,ALL.garment[colored.dataset.garment]);
  ALL.workers.forEach((path,i)=>place(workerImgs[i],path));
  return canvas;
 };
 const queueGarmentVisual=()=>{
  const token=++switchToken;
  const wantedGarment=current.garment,wantedColor=current.color;
  if(garmentSurface&&visualGarment===wantedGarment&&visualColor===wantedColor)return Promise.resolve(true);
  const job=(async()=>{
   const index=variantIndex();
   const colored=await colorized(wantedGarment,wantedColor,index);
   if(token!==switchToken)return false;
   // When fine layers are already decoded, skip the full-stage background.
   // Before hydration, compose a COMPLETE scene without any baked white shirt.
   const scene=layersReady?null:await composeAtomicPreview(colored,index);
   if(token!==switchToken)return false;
   // All preparation is complete. These DOM changes are synchronous within
   // one frame: keep previous garment until the colored image exists.
   if(garmentSurface)garmentSurface.replaceWith(colored);
   else garmentImg.after(colored);
   garmentSurface=colored;
   garmentImg.style.visibility='hidden';
   if(scene&&preview?.isConnected){
    preview.replaceWith(scene);preview=scene;
   }
   visualGarment=wantedGarment;visualColor=wantedColor;
   printPosition(); // Upload placement changes together with the new garment.
   return true;
  })().catch(error=>{
   if(token===switchToken){
    console.error('Garment atomic visual preparation failed:',error);
    announce('The selected garment could not be prepared. The previous complete garment remains visible.');
   }
   return false;
  });
  latestRender=job;return job;
 };
 const finishHydration=async()=>{
  // Requests may change during hydration: accept only the latest complete
  // garment/color pair and never reveal the stale/white intermediate layer.
  for(let attempts=0;attempts<50;attempts++){
   const token=switchToken;
   if(!garmentSurface||current.garment!==visualGarment||current.color!==visualColor){
    await (latestRender||queueGarmentVisual());
    if(token!==switchToken)continue;
   }
   if(!garmentSurface||current.garment!==visualGarment||current.color!==visualColor){
    announce('The previous complete scene remains visible until the requested garment can be prepared.');
    return;
   }
   if(token!==switchToken)continue;
   hydrated=true;
   body.classList.remove('is-hydrating');
   preview?.remove();preview=null;
   stage.querySelector('.cc-worktable-loading')?.remove();
   announce('Worktable ready. Every detail is registered to the original artwork.');
   return;
  }
  console.warn('Hydration deferred while garment selection is changing rapidly');
 };
 const paintSelection=(deferPosition=false)=>{
  const color=dyeRGB[current.color];
  tint.style.backgroundColor=color;
  tint.classList.toggle('is-colored',current.color!=='white');
  print.classList.toggle('has-art',!!artURL);
  for(const b of buttons){
   const checked=b.dataset.group!=='upload'&&current[b.dataset.group]===b.dataset.value;
   if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',String(checked));
  }
  // Keep persistent physical selection on the alpha-trimmed artwork layers,
  // whether the action originated on the stage or the accessible control rail.
  for(const img of interactiveImgs){
   img.classList.toggle('is-selected',img.dataset.group!=='upload'&&
    current[img.dataset.group]===img.dataset.value);
  }
  if(!deferPosition)printPosition();
 };
 const clearArtURL=()=>{if(artURL)URL.revokeObjectURL(artURL);artURL=null;artBitmap=null};
 const update=(group,value)=>{
  if(group==='upload'){file.click();return}
  current=worktableReducer(current,{type:'select',group,value});
  // Retain relative placement and recompute safe bounds for garment/preset changes.
  if(group==='printSize')showGuide(1550); // guide appears even without art
  paintSelection(group==='garment');announce(`${labels[value]} selected`);
  if(group==='garment'||group==='color')void queueGarmentVisual();
 };
 let uploadAckTimer=null;
 const acknowledgeUpload=()=>{
  uploadVisual.classList.add('is-upload-acknowledged');
  if(uploadAckTimer!==null)clearTimeout(uploadAckTimer);
  uploadAckTimer=setTimeout(()=>{uploadVisual.classList.remove('is-upload-acknowledged');uploadAckTimer=null},180);
 };
 for(const b of buttons){
  b.addEventListener('click',()=>{
   if(b.classList.contains('cc-worktable-hit')&&b.dataset.group==='upload')acknowledgeUpload();
   update(b.dataset.group,b.dataset.value);
  });
  if(b.classList.contains('cc-worktable-hit')){
   const img=interactionImages.get(keyFor(b.dataset.group,b.dataset.value));
   if(!img)throw new Error('Missing illustrated control image: '+b.dataset.group+':'+b.dataset.value);
   b.addEventListener('pointerenter',event=>{
    if(fineHover.matches&&(event.pointerType==='mouse'||event.pointerType==='pen'))
     img.classList.add('is-hovered');
   });
   b.addEventListener('pointerleave',()=>img.classList.remove('is-hovered'));
   b.addEventListener('pointercancel',()=>img.classList.remove('is-hovered'));
   b.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch')img.classList.remove('is-hovered');
    if(b.dataset.group==='upload')acknowledgeUpload();
   });
   b.addEventListener('focus',()=>img.classList.toggle('is-keyboard-focus',b.matches(':focus-visible')));
   b.addEventListener('keydown',event=>{
    if(event.key==='Tab'||event.key==='Enter'||event.key===' ')img.classList.add('is-keyboard-focus');
   });
   b.addEventListener('blur',()=>img.classList.remove('is-keyboard-focus'));
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
   editor.x=editor.y=0;editor.adjustment=0;editor.rotation=0;
   editor.selected=false;editor.mode='move';editorToolbar.hidden=true;
   print.classList.remove('is-edit-selected','is-resize-mode');
   scale.value='0';scaleOut.textContent='0%';scale.disabled=false;remove.disabled=false;reset.disabled=false;
   paintSelection();showGuide(1600);
   announce('Artwork loaded locally at 0% adjustment to the '+current.printSize+
    ' visual reference. Drag to position or use the signed resize slider.');
  }catch{URL.revokeObjectURL(next);announce('The selected image could not be decoded.');}
  file.value='';
 });
 scale.addEventListener('input',()=>{
  editor.adjustment=Number(scale.value);
  printPosition({feedback:true});indicatePlacement();
 });
 reset.addEventListener('click',()=>{
  editor.x=editor.y=0;editor.adjustment=0;editor.rotation=0;scale.value='0';
  printPosition();indicatePlacement();
  announce('Artwork reset: centered within '+current.printSize+', size 0%, rotation 0 degrees.');
 });
 remove.addEventListener('click',()=>{
  hideEditor();clearArtURL();artImg.removeAttribute('src');
  scale.disabled=true;remove.disabled=true;reset.disabled=true;
  editor.x=editor.y=0;editor.adjustment=0;editor.rotation=0;
  print.classList.remove('is-manipulating','is-beyond-reference');
  if(placementFeedbackTimer!==null)clearTimeout(placementFeedbackTimer);
  placementFeedbackTimer=null;
  scale.value='0';scaleOut.textContent='0%';paintSelection();announce('Artwork removed.');
 });
 // Clicking artwork selects it; in Move mode the same gesture can drag.
 const dragLayer=document.createElement('button');dragLayer.type='button';
 dragLayer.className='cc-worktable-drag';
 dragLayer.setAttribute('aria-label','Select uploaded artwork, then move or resize with the floating editor');
 dragLayer.title='Select and edit artwork';print.append(dragLayer);
 const dragStart=e=>{
  if(!artURL||e.button>0)return;
  if(!editor.selected)selectEditor('move');
  else selectEditor(editor.mode);
  if(editor.mode!=='move')return;
  const rect=stage.getBoundingClientRect(),factor=2048/rect.width;
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,startX:editor.x,startY:editor.y,factor};
  dragLayer.setPointerCapture(e.pointerId);
  dragLayer.classList.add('is-dragging');indicatePlacement(true);
 };
 dragLayer.addEventListener('pointerdown',dragStart);
 // Native Enter/Space activation must open the editor without a mouse.
 dragLayer.addEventListener('click',e=>{
  if(e.detail===0&&artURL)selectEditor(editor.mode);
 });
 dragLayer.addEventListener('pointermove',e=>{
  if(!dragging||dragging.id!==e.pointerId)return;
  editor.x=dragging.startX+(e.clientX-dragging.x)*dragging.factor;
  editor.y=dragging.startY+(e.clientY-dragging.y)*dragging.factor;
  printPosition({constrainToGuide:true});
 });
 const dragEnd=e=>{
  if(e?.pointerId!==undefined&&dragLayer.hasPointerCapture(e.pointerId))
   dragLayer.releasePointerCapture(e.pointerId);
  if(dragging){dragging=null;dragLayer.classList.remove('is-dragging');indicatePlacement();}
 };
 dragLayer.addEventListener('pointerup',dragEnd);
 dragLayer.addEventListener('pointercancel',dragEnd);
 dragLayer.addEventListener('keydown',e=>{
  if(!artURL)return;
  if(e.key==='Escape'){e.preventDefault();hideEditor();return;}
  const delta=e.shiftKey?14:4;
  const dx={ArrowLeft:-delta,ArrowRight:delta}[e.key];
  const dy={ArrowUp:-delta,ArrowDown:delta}[e.key];
  if(dx===undefined&&dy===undefined)return;
  e.preventDefault();selectEditor('move');
  editor.x+=dx||0;editor.y+=dy||0;
  printPosition({constrainToGuide:true});indicatePlacement();
 });
 // Resize any rotated corner proportionally, with pointer capture.
 for(const [corner,handle] of cornerHandles){
  handle.addEventListener('pointerdown',e=>{
   if(!artURL||e.button>0)return;
   e.preventDefault();e.stopPropagation();selectEditor('resize');
   const sr=stage.getBoundingClientRect(),f=sr.width/2048;
   const sideX=corner.endsWith('w')?-1:1;
   const sideY=corner.startsWith('n')?-1:1;
   const theta=editor.rotation*Math.PI/180;
   const bx=sideX*lastInfo.width/2,by=sideY*lastInfo.height/2;
   const rx=bx*Math.cos(theta)-by*Math.sin(theta);
   const ry=bx*Math.sin(theta)+by*Math.cos(theta);
   const radius=Math.max(1,Math.hypot(rx,ry)*f);
   resizing={id:e.pointerId,x:e.clientX,y:e.clientY,
    dirX:rx*f/radius,dirY:ry*f/radius,radius,
    startScale:1+editor.adjustment/100};
   handle.setPointerCapture(e.pointerId);
   print.classList.add('is-manipulating');showGuide();
  });
  handle.addEventListener('pointermove',e=>{
   if(!resizing||resizing.id!==e.pointerId)return;
   e.preventDefault();
   const delta=(e.clientX-resizing.x)*resizing.dirX+
    (e.clientY-resizing.y)*resizing.dirY;
   editor.adjustment=Math.round((resizing.startScale*(1+delta/resizing.radius)-1)*100);
   printPosition();showGuide();
  });
  const end=e=>{
   if(e?.pointerId!==undefined&&handle.hasPointerCapture(e.pointerId))
    handle.releasePointerCapture(e.pointerId);
   if(resizing){resizing=null;indicatePlacement();}
  };
  handle.addEventListener('pointerup',end);
  handle.addEventListener('pointercancel',end);
  handle.addEventListener('keydown',e=>{
   if(e.key==='Escape'){hideEditor();return;}
   if(!['ArrowUp','ArrowDown','ArrowRight','ArrowLeft'].includes(e.key))return;
   e.preventDefault();selectEditor('resize');
   editor.adjustment+=(e.key==='ArrowUp'||e.key==='ArrowRight'?5:-5);
   printPosition({feedback:true});indicatePlacement();
  });
 }
 for(const button of editorToolbar.querySelectorAll('[data-tool]')){
  button.addEventListener('click',()=>{
   if(!artURL)return;
   if(button.dataset.tool==='rotate'){
    editor.rotation=(editor.rotation+90)%360;
    printPosition({feedback:true});selectEditor(editor.mode);
    button.setAttribute('aria-label','Rotate artwork 90 degrees clockwise; current '+editor.rotation+' degrees');
    announce('Artwork rotated to '+editor.rotation+' degrees clockwise.');
   }else{
    selectEditor(button.dataset.tool);
    announce(button.dataset.tool==='resize'
     ? 'Resize mode. Drag a corner to resize proportionally, or use the size slider.'
     : 'Move mode. Drag the artwork or use the keyboard arrow keys.');
   }
  });
  button.addEventListener('keydown',e=>{if(e.key==='Escape'){hideEditor();dragLayer.focus();}});
 }
 const outsideEditor=e=>{
  if(!editor.selected)return;
  if(!print.contains(e.target)&&!editorToolbar.contains(e.target))hideEditor();
 };
 const editorEscape=e=>{
  if(e.key==='Escape'&&editor.selected){
   hideEditor();if(editorToolbar.contains(document.activeElement))dragLayer.focus();
  }
 };
 const repositionEditor=()=>{if(editor.selected)positionToolbar();};
 document.addEventListener('pointerdown',outsideEditor,true);
 document.addEventListener('keydown',editorEscape);
 window.addEventListener('resize',repositionEditor,{passive:true});
 window.addEventListener('scroll',repositionEditor,{passive:true});
 const unload=()=>{
  if(placementFeedbackTimer!==null)clearTimeout(placementFeedbackTimer);
  if(guideTimer!==null)clearTimeout(guideTimer);
  clearArtURL();
 };
 window.addEventListener('pagehide',unload,{once:true});
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
  const path=img===garmentImg?ALL.garment.regular:img.dataset.source;
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
  layersReady=true;
  await finishHydration();
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
  console.error('Worktable first-frame image failed',error);
  preview.remove();
  throw new Error('The complete stage preview could not decode on this browser: '+String(error?.message||error));
 }
 void hydrate();
 return {getState:()=>({...current}),getPlacement:()=>({...editor,scale:1+editor.adjustment/100}),destroy:()=>{
  clearArtURL();if(uploadAckTimer!==null)clearTimeout(uploadAckTimer);
  uploadObserver?.disconnect();document.removeEventListener('visibilitychange',syncUploadMotion);
  document.removeEventListener('pointerdown',outsideEditor,true);
  document.removeEventListener('keydown',editorEscape);
  window.removeEventListener('resize',repositionEditor);
  window.removeEventListener('scroll',repositionEditor);
  window.removeEventListener('pagehide',unload);unload();root.replaceChildren();
 }};
}