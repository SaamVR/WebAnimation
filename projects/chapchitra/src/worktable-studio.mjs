import { WORKTABLE_VIEWBOX, GARMENT_VARIANTS, createWorktableState, worktableReducer } from './worktable-stage.mjs';
import { UPLOAD_ARTWORK_SVG } from './worktable-upload-icon.mjs';
import { FABRIC_PIGMENTS, applyFabricPigmentToRGBA } from './worktable-fabric-pigments.mjs';
import { paperGuide, placementGeometry, printScaleLabel, resolutionGuidance } from './worktable-print-placement.mjs';
import { createSideRecords, storeSide, loadSide, disposeSideRecords } from './worktable-two-sided-state.mjs';
import { calculateArtistPrice, buildArtistCustomization, formatArtistBDT } from './worktable-pricing.mjs';
import { WORKTABLE_PRICE_TAG } from './worktable-price-tag-config.mjs';

// Immutable 4000×2250 artwork is registered on the same 2048×1152 stage.
// Cropped WebP browser variants retain original alpha coordinates and source SHA256.
const ASSET_ROOT = '/assets/worktable/';
const BACK_MANIFEST_URL = '/assets/worktable/back/manifest.json';
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
 let view='front';
 const sideRecords=createSideRecords(current.printSize);
 let artURL=null;
 let artBitmap=null;
 const editor={x:0,y:0,frameX:0,frameY:0,adjustment:0,rotation:0,selected:false,mode:'move'};
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
        <p class="cc-worktable-artwork-kicker">YOUR OWN MARK</p>
        <h3 id="worktableArtworkHeading">Your artwork</h3>
      </div>
      <div class="cc-worktable-upload-row">
        <div class="cc-worktable-upload-group">
          <button type="button" id="worktableUploadArt" aria-label="Upload artwork from this device">Upload artwork</button>
          <p id="worktableArtworkQuality" class="cc-worktable-quality" role="status" aria-live="polite" hidden></p>
          <details class="cc-worktable-print-tips">
            <summary>Print tips</summary>
            <div class="cc-worktable-print-tips-content">
              <p>For crisp printing at 300 PPI, aim for:</p>
              <p><strong>A4</strong> 2480 × 3508 px</p>
              <p><strong>A3</strong> 3508 × 4961 px</p>
              <p>Other image sizes work for preview. A3/A4 guides show relative print areas, not certified garment measurements. Confirm production dimensions and image quality before printing.</p>
            </div>
          </details>
        </div>
        <label class="cc-worktable-scale"><span class="cc-worktable-scale-label">Artwork size</span><span class="cc-worktable-scale-control"><input type="range" id="worktableArtScale" min="-50" max="100" step="1" value="0" disabled aria-label="Artwork size adjustment relative to selected A3 or A4 print area"><output id="worktableScaleOutput">0%</output></span><span id="worktableSizeGuidance" class="cc-worktable-size-guidance" aria-live="polite" hidden></span></label>
        <div class="cc-worktable-secondary-actions"><button type="button" id="worktableResetArt" aria-label="Reset artwork position, size and rotation" disabled>Reset</button><button type="button" id="worktableRemoveArt" aria-label="Remove uploaded artwork" disabled>Remove</button></div>
      </div>
    </section>
    <p class="cc-worktable-hint">Move, resize or rotate directly on the shirt.</p>
    <section class="cc-worktable-price" aria-label="Custom garment estimated price">
      <div class="cc-worktable-price-head">
        <div class="cc-worktable-price-primary">
          <p class="cc-worktable-price-kicker">YOUR CUSTOM GARMENT / ESTIMATE</p>
          <output id="worktablePriceTotal" class="cc-worktable-price-total" aria-label="Estimated garment and print price">৳450</output>
          <p class="cc-worktable-price-note">Temporary BDT pricing · No checkout or payment</p>
        </div>
        <div class="cc-worktable-price-action">
          <button type="button" id="worktableAddDemoBag">Add to demo bag</button>
          <p id="worktableBagStatus" class="cc-worktable-bag-status" role="status" aria-live="polite"></p>
        </div>
      </div>
      <section class="cc-worktable-price-breakdown cc-worktable-invoice" id="worktablePriceBreakdown" aria-label="Itemized price invoice">
        <h3 class="cc-worktable-invoice-title">Price invoice</h3>
        <dl>
          <div><dt id="worktablePriceGarmentLabel">Regular Tee</dt><dd id="worktablePriceGarmentCharge">৳450</dd></div>
          <div><dt id="worktablePriceFrontLabel">Front print · No Print</dt><dd id="worktablePriceFrontCharge">৳0</dd></div>
          <div><dt id="worktablePriceBackLabel">Back print · No Print</dt><dd id="worktablePriceBackCharge">৳0</dd></div>
          <div class="cc-worktable-price-grand"><dt>Total</dt><dd id="worktablePriceBreakdownTotal">৳450</dd></div>
        </dl>
      </section>
      <p class="cc-worktable-price-disclaimer">Demo bag stores configuration details only. Uploaded image files stay in this editor; no order is placed.</p>
    </section>
    <p class="cc-worktable-live" role="status" id="worktableMessage" aria-live="polite"></p>
  </section>
  <input id="worktableFile" type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label="Choose local design image">`;
 if(embedded)body.querySelector('.cc-worktable-header')?.remove();
 root.replaceChildren(body);
 const stage=root.querySelector('.cc-worktable-stage');
 // The accessible turn button belongs INSIDE the wooden stage, centered
 // below the hem in the free lower desk area; no artificial cream footer.
 const viewRow=document.createElement('div');
 viewRow.className='cc-worktable-view-row';
 const viewButton=document.createElement('button');
 viewButton.type='button';viewButton.className='cc-worktable-view-button';
 viewButton.setAttribute('aria-label','View back');
 viewButton.innerHTML='<span aria-hidden="true" class="cc-worktable-view-glyph">↻</span><span class="cc-worktable-view-label">View back</span>';
 viewRow.append(viewButton);
 stage.append(viewRow);
 // Illustrated price-tag artwork is independently registered to the wooden desk.
 // Both tag displays receive the ONE calculated total, never a second price engine.
 const createPriceTag=(mobile=false)=>{
   const tag=document.createElement('div');
   tag.className='cc-worktable-price-tag'+(mobile?' cc-worktable-price-tag-mobile':' cc-worktable-price-tag-stage');
   tag.setAttribute('aria-hidden','true');tag.dataset.priceTag=mobile?'mobile':'stage';
   const settings=WORKTABLE_PRICE_TAG;
   const art=document.createElement('img');art.src=settings.assetPath;art.alt='';
   art.width=settings.original.width;art.height=settings.original.height;
   art.decoding='async';art.draggable=false;
   // The replacement PNG already contains "Total". Only the live amount
   // is HTML, preserving the original paper texture, label and orientation.
   const text=document.createElement('span');text.className='cc-worktable-tag-typography';
   const amount=document.createElement('span');amount.className='cc-worktable-tag-total';amount.textContent='৳450';
   text.append(amount);
   text.style.left=settings.text.xPercent+'%';text.style.top=settings.text.yPercent+'%';
   text.style.setProperty('--cc-tag-type-angle',settings.text.rotationDeg+'deg');
   text.style.setProperty('--cc-tag-amount-size',settings.text.fontSizeCqw+'cqw');
   text.style.setProperty('--cc-tag-amount-font',settings.text.fontFamily);
   text.style.setProperty('--cc-tag-amount-width',settings.text.widthPercent+'%');
   text.style.setProperty('--cc-tag-amount-spacing',settings.text.letterSpacingEm+'em');
   text.style.setProperty('--cc-tag-amount-weight',settings.text.fontWeight);
   text.style.setProperty('--cc-tag-amount-leading',settings.text.lineHeight);
   text.style.textAlign=settings.text.align;
   tag.style.setProperty('--cc-tag-desktop-x',settings.desktop.x/WORKTABLE_VIEWBOX.width*100+'%');
   tag.style.setProperty('--cc-tag-desktop-y',settings.desktop.y/WORKTABLE_VIEWBOX.height*100+'%');
   tag.style.setProperty('--cc-tag-desktop-w',settings.desktop.width/WORKTABLE_VIEWBOX.width*100+'%');
   tag.style.setProperty('--cc-tag-tablet-x',settings.tablet.x/WORKTABLE_VIEWBOX.width*100+'%');
   tag.style.setProperty('--cc-tag-tablet-y',settings.tablet.y/WORKTABLE_VIEWBOX.height*100+'%');
   tag.style.setProperty('--cc-tag-tablet-w',settings.tablet.width/WORKTABLE_VIEWBOX.width*100+'%');
   tag.style.setProperty('--cc-tag-mobile-x',settings.mobile.x/WORKTABLE_VIEWBOX.width*100+'%');
   tag.style.setProperty('--cc-tag-mobile-y',settings.mobile.y/WORKTABLE_VIEWBOX.height*100+'%');
   tag.style.setProperty('--cc-tag-mobile-w',settings.mobile.width/WORKTABLE_VIEWBOX.width*100+'%');
   tag.style.setProperty('--cc-tag-max-width',settings.desktop.maxWidth+'px');
   tag.style.setProperty('--cc-tag-mobile-width',settings.mobile.displayWidth+'px');
   tag.style.setProperty('--cc-tag-mobile-offset-x',settings.mobile.x+'px');
   tag.style.setProperty('--cc-tag-mobile-offset-y',settings.mobile.y+'px');
   tag.style.setProperty('--cc-tag-rotation',settings.rotation+'deg');
   tag.append(art,text);
   return tag;
 };
 const stagePriceTag=createPriceTag();
 stage.append(stagePriceTag);
 const mobilePriceTag=createPriceTag(true);
 stage.after(mobilePriceTag);
 const tagPrices=[stagePriceTag.querySelector('.cc-worktable-tag-total'),mobilePriceTag.querySelector('.cc-worktable-tag-total')];
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
 // Back delivery is intentionally LAZY: the first visit fetches no back PNG
 // or WebP. A missing installation leaves the approved front fully usable.
 let backManifest=null,backManifestPending=null;
 const ensureBackManifest=()=>{
  if(backManifest)return Promise.resolve(backManifest);
  if(!backManifestPending)backManifestPending=(async()=>{
   const response=await fetch(BACK_MANIFEST_URL,{cache:'force-cache'});
   if(!response.ok)throw new Error('Back-view artwork package is not installed ('+response.status+')');
   const next=await response.json();
   if(next.schema!=='chapchitra-worktable-back/1'||
      next.originalCanvas?.join('x')!=='4000x2250'||
      next.designCanvas?.join('x')!=='2048x1152'){
    throw new Error('Unexpected back-view artwork registration');
   }
   for(const key of Object.keys(ALL.garment)){
    const item=next.assets?.[key],delivery=item?.delivery;
    if(item?.original?.join('x')!=='4000x2250'||
       !Array.isArray(delivery?.stageBox)||delivery.stageBox.length!==4||
       delivery.variants?.length!==3||
       delivery.variants.some(v=>!v.path.startsWith('back/variants/'))){
      throw new Error('Missing back-view optimized artwork for '+key);
    }
   }
   backManifest=next;return next;
  })().catch(error=>{backManifestPending=null;throw error});
  return backManifestPending;
 };
 const sourceInfo=path=>{
  const meta=path.startsWith('back/')
   ?backManifest?.assets?.[path.slice(5)]?.delivery
   :manifest[path]?.delivery;
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
 // One atomic stage-relative print rectangle owns BOTH its guide and clip.
 // Independent percentage rectangles can lag by a paint frame on WebKit/
 // Chromium reduced-motion changes. Their shared parent removes that race.
 const printFrame=document.createElement('div');printFrame.className='cc-worktable-print-frame';
 stage.append(printFrame);
 const guideVisual=document.createElement('div');
 guideVisual.className='cc-worktable-paper-guide';
 guideVisual.setAttribute('aria-hidden','true');printFrame.append(guideVisual);
 // Hard clipping is a secondary defense: placementGeometry constrains the
 // complete rotated artwork before it reaches this print-area layer.
 const printClip=document.createElement('div');printClip.className='cc-worktable-print-clip';
 const print=document.createElement('div');print.className='cc-worktable-print';
 const artImg=document.createElement('img');artImg.alt='Your uploaded artwork preview';artImg.draggable=false;
 print.append(artImg);printClip.append(print);printFrame.append(printClip);
 const frameHandle=document.createElement('button');
 frameHandle.type='button';frameHandle.className='cc-worktable-frame-handle';
 frameHandle.setAttribute('aria-label','Move A4 print frame within safe A3 printing area');
 frameHandle.title='Drag to reposition the A4 print frame';
 frameHandle.textContent='↕';frameHandle.hidden=true;
 stage.append(frameHandle);
 const artBounds=document.createElement('div');artBounds.className='cc-worktable-art-bounds';
 artBounds.setAttribute('aria-hidden','true');stage.append(artBounds);
 const cornerHandles=new Map();
 for(const corner of ['nw','ne','sw','se']){
  const b=document.createElement('button');b.type='button';
  b.className='cc-worktable-corner-handle cc-worktable-corner-'+corner;
  b.dataset.corner=corner;
  b.setAttribute('aria-label','Resize artwork from '+({nw:'top left',ne:'top right',sw:'bottom left',se:'bottom right'}[corner])+' corner');
  b.title='Drag to resize proportionally';b.hidden=true;stage.append(b);cornerHandles.set(corner,b);
 }
 const tools=document.createElement('div');tools.className='cc-worktable-art-tools';
 tools.setAttribute('role','toolbar');tools.setAttribute('aria-label','Artwork transform tools');
 tools.hidden=true;stage.append(tools);
 const toolButtons=new Map();
 for(const [mode,name,icon] of [
  ['move','Move','↔'],['resize','Resize','⤢'],['rotate','Rotate 90 degrees clockwise','↻']
 ]){
  const button=document.createElement('button');button.type='button';
  button.className='cc-worktable-tool';button.dataset.tool=mode;
  button.textContent=icon;button.title=name;button.setAttribute('aria-label',name);
  button.setAttribute('aria-pressed','false');tools.append(button);toolButtons.set(mode,button);
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
  const priceTotal=root.querySelector('#worktablePriceTotal');
  const priceGarmentLabel=root.querySelector('#worktablePriceGarmentLabel');
  const priceGarmentCharge=root.querySelector('#worktablePriceGarmentCharge');
  const priceFrontLabel=root.querySelector('#worktablePriceFrontLabel');
  const priceFrontCharge=root.querySelector('#worktablePriceFrontCharge');
  const priceBackLabel=root.querySelector('#worktablePriceBackLabel');
  const priceBackCharge=root.querySelector('#worktablePriceBackCharge');
  const priceBreakdownTotal=root.querySelector('#worktablePriceBreakdownTotal');
  const addDemoBag=root.querySelector('#worktableAddDemoBag');
  const selectionForPricing=()=>{
   const record=sideName=>{
    const active=sideName===view;
    const saved=sideRecords[sideName];
    return {
     hasArtwork:active?Boolean(artURL&&artBitmap):Boolean(saved.url&&saved.bitmap),
     preset:active?current.printSize:saved.preset,
     editor:active?{...editor}:{...saved.editor},
    };
   };
   return {garment:current.garment,color:current.color,size:current.size,
    front:record('front'),back:record('back')};
  };
  const syncPricing=()=>{
   const amount=calculateArtistPrice(selectionForPricing());
   priceTotal.textContent=formatArtistBDT(amount.total);
   for(const node of tagPrices)node.textContent=formatArtistBDT(amount.total);
   priceGarmentLabel.textContent=amount.garmentLabel;
   priceGarmentCharge.textContent=formatArtistBDT(amount.base);
   for(const [which,label,value] of [
    ['Front',priceFrontLabel,priceFrontCharge],
    ['Back',priceBackLabel,priceBackCharge],
   ]){
    const side=amount[which.toLowerCase()];
    label.textContent=which+' print · '+(side.hasArtwork?side.preset:'No Print');
    value.textContent=formatArtistBDT(side.charge);
   }
   priceBreakdownTotal.textContent=formatArtistBDT(amount.total);
   return amount;
  };
  addDemoBag.addEventListener('click',()=>{
   const config=buildArtistCustomization(selectionForPricing());
   root.querySelector('#worktableBagStatus').textContent='Adding to demo bag…';
   root.dispatchEvent(new CustomEvent('chapchitra:artist-demo-add',{
    bubbles:true,detail:{selection:config}
   }));
  });
  syncPricing();
 // Paper reference and uploaded-image transform are separate stage layers.
 let placementFeedbackTimer=null,guideTimer=null,guideVisible=false,boundaryAnnounced=false;
 let lastInfo=null;
 const syncPaperGuide=()=>{
  const paper=paperGuide(current.garment,current.printSize,{
   frameX:editor.frameX,frameY:editor.frameY,
  });
  if(current.printSize==='A4'){
   editor.frameX=paper.frameX;editor.frameY=paper.frameY;
  }
  printFrame.style.left=percent(paper.x,2048);printFrame.style.top=percent(paper.y,1152);
  printFrame.style.width=percent(paper.width,2048);printFrame.style.height=percent(paper.height,1152);
  guideVisual.classList.toggle('is-visible',current.printSize==='A4'||guideVisible||editor.selected);
  guideVisual.dataset.preset=current.printSize;
  frameHandle.hidden=current.printSize!=='A4';
  frameHandle.style.left=percent(paper.x+paper.width,2048);
  frameHandle.style.top=percent(paper.y,1152);
  return paper;
 };
 const revealGuide=(delay=2000)=>{
  guideVisible=true;
  if(guideTimer!==null)clearTimeout(guideTimer);
  guideTimer=null;syncPaperGuide();
  if(!editor.selected)guideTimer=setTimeout(()=>{
   guideVisible=false;guideTimer=null;syncPaperGuide();
  },delay);
 };
 const hideEditor=()=>{
  editor.selected=false;editor.mode='move';
  guideVisible=true;tools.hidden=true;artBounds.classList.remove('is-visible');
  for(const handle of cornerHandles.values())handle.hidden=true;
  revealGuide(700);
 };
 const indicatePlacement=(duringDrag=false)=>{
  print.classList.add('is-manipulating');
  if(placementFeedbackTimer!==null)clearTimeout(placementFeedbackTimer);
  placementFeedbackTimer=null;
  if(!duringDrag)placementFeedbackTimer=setTimeout(()=>{
   print.classList.remove('is-manipulating');placementFeedbackTimer=null;
  },750);
  revealGuide();
 };
 const syncTransformTools=info=>{
  if(!artURL||!editor.selected){
   tools.hidden=true;artBounds.classList.remove('is-visible');
   for(const handle of cornerHandles.values())handle.hidden=true;
   return;
  }
  tools.hidden=false;
  const stageRect=stage.getBoundingClientRect();
  const sx=stageRect.width/2048,sy=stageRect.height/1152;
  const box=info.bounds;
  const toolbarWidth=148,toolbarHeight=44,gap=7;
  const leftX=box.x*sx-toolbarWidth-gap;
  const rightX=(box.x+box.width)*sx+gap;
  let positionX=rightX+toolbarWidth+4<=stageRect.width?rightX:
    leftX>=4?leftX:Math.min(stageRect.width-toolbarWidth-4,Math.max(4,box.x*sx));
  let positionY=(box.y+box.height/2)*sy-toolbarHeight/2;
  if(positionX!==rightX&&positionX!==leftX)positionY=box.y*sy-toolbarHeight-gap;
  positionY=clamp(positionY,4,Math.max(4,stageRect.height-toolbarHeight-4));
  tools.style.left=positionX+'px';tools.style.top=positionY+'px';
  for(const [mode,button] of toolButtons){
   button.classList.toggle('is-active',editor.mode===mode);
   button.setAttribute('aria-pressed',String(editor.mode===mode));
  }
  const resizing=editor.mode==='resize';
  artBounds.classList.toggle('is-visible',resizing);
  artBounds.style.left=percent(box.x,2048);artBounds.style.top=percent(box.y,1152);
  artBounds.style.width=percent(box.width,2048);artBounds.style.height=percent(box.height,1152);
  for(const [corner,handle] of cornerHandles){
   handle.hidden=!resizing;
   if(!resizing)continue;
   const left=corner.endsWith('w')?box.x:box.x+box.width;
   const top=corner.startsWith('n')?box.y:box.y+box.height;
   handle.style.left=percent(left,2048);handle.style.top=percent(top,1152);
  }
 };
 const printPosition=({feedback=false}={})=>{
  syncPaperGuide();
  if(!artBitmap){
   lastInfo=null;
   scaleOut.textContent='0%';sizeGuidance.textContent='';sizeGuidance.hidden=true;quality.textContent='';quality.hidden=true;
   syncTransformTools(null);
   return;
  }
  const requested=editor.adjustment;
  const info=placementGeometry({
   garment:current.garment,preset:current.printSize,
   imageWidth:artBitmap.naturalWidth,imageHeight:artBitmap.naturalHeight,
   adjustment:requested,dx:editor.x,dy:editor.y,rotation:editor.rotation,
   frameX:editor.frameX,frameY:editor.frameY,
  });
  lastInfo=info;
  editor.adjustment=info.adjustment;editor.x=info.dx;editor.y=info.dy;editor.rotation=info.rotation;
  if(current.printSize==='A4'){editor.frameX=info.frameX;editor.frameY=info.frameY;}
  scale.max=String(info.maxAdjustment);scale.value=String(info.adjustment);
  scaleOut.textContent=printScaleLabel(info.adjustment);
  // Print lives inside a fixed, stage-registered clipping rectangle.
  // Relative positioning is local to the selected print guide, not the desk.
  print.style.left=percent(info.x-info.guide.x,info.guide.width);
  print.style.top=percent(info.y-info.guide.y,info.guide.height);
  print.style.width=percent(info.width,info.guide.width);
  print.style.height=percent(info.height,info.guide.height);
  print.style.transform='rotate('+info.rotation+'deg)';
  print.dataset.rotation=String(info.rotation);
  print.classList.toggle('is-beyond-reference',info.exceedsReference);
  // Keep the daily editing UI concise; retain detailed print data in Print tips.
  const atSafeLimit=info.maxAdjustment<100&&info.adjustment===info.maxAdjustment;
  const note=atSafeLimit?'Maximum safe size reached.':'';
  sizeGuidance.textContent=note;
  sizeGuidance.hidden=!note;
  const assessment=resolutionGuidance({preset:current.printSize,
   imageWidth:artBitmap.naturalWidth,imageHeight:artBitmap.naturalHeight,
   adjustment:info.adjustment});
  quality.textContent=assessment.low?'Image quality may be low at this print size.':'';
  quality.hidden=!assessment.low;
  quality.classList.toggle('is-low-resolution',assessment.low);
  syncTransformTools(info);
  if(dragging&&info.constrained&&!boundaryAnnounced){
   announce('Artwork reached the edge of the selected print frame.');
   boundaryAnnounced=true;
  }else if(!info.constrained)boundaryAnnounced=false;
  if(feedback&&requested>info.maxAdjustment)
   announce('Maximum safe enlargement is +'+info.maxAdjustment+'%. Artwork remains inside the garment.');
 };
 let hydrated=false;
 let layersReady=false;
 let switchToken=0;
 let latestRender=null;
 let garmentSurface=null;
 let visualGarment='regular', visualColor='white', visualSide='front';
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
 const colorized=async(garment,color,index,side='front')=>{
  const path=side==='back'?'back/'+garment:ALL.garment[garment],info=sourceInfo(path);
  const source=await loadVariant(info,index);
  const canvas=document.createElement('canvas');
  canvas.className='cc-worktable-layer cc-worktable-garment-surface';
  canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
  positionLayer(canvas,path);
  canvas.dataset.garment=garment;canvas.dataset.color=color;
  canvas.dataset.side=side;canvas.dataset.assetPath=path;
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
   if(path.startsWith('back/')){
    // Only the new back art uses fitted stage registration. Front composition
    // remains precisely the approved crop-placement implementation.
    const [x,y,w,h]=sourceInfo(path).stageBox;
    ctx.drawImage(img,Math.round(x*canvas.width/2048),
     Math.round(y*canvas.height/1152),Math.round(w*canvas.width/2048),
     Math.round(h*canvas.height/1152));
    return;
   }
   const crop=sourceInfo(path).crop;
   const left=Math.round(crop[0]*canvas.width/4000);
   const top=Math.round(crop[1]*canvas.width/4000);
   ctx.drawImage(img,left,top);
  };
  place(colored,colored.dataset.assetPath||ALL.garment[colored.dataset.garment]);
  ALL.workers.forEach((path,i)=>place(workerImgs[i],path));
  return canvas;
 };
 const queueGarmentVisual=()=>{
  const token=++switchToken;
  const wantedGarment=current.garment,wantedColor=current.color,wantedSide=view;
  if(garmentSurface&&visualGarment===wantedGarment&&visualColor===wantedColor&&visualSide===wantedSide)return Promise.resolve(true);
  const job=(async()=>{
   if(wantedSide==='back')await ensureBackManifest();
   if(token!==switchToken)return false;
   const index=variantIndex();
   const colored=await colorized(wantedGarment,wantedColor,index,wantedSide);
   if(token!==switchToken)return false;
   // When fine layers are already decoded, skip the full-stage background.
   // Before hydration, compose a COMPLETE scene without any baked white shirt.
   const scene=layersReady?null:await composeAtomicPreview(colored,index);
   if(token!==switchToken)return false;
   // All preparation is complete. These DOM changes are synchronous within
   // one frame: keep previous garment until the colored image exists.
   const changedSide=visualSide!==wantedSide;
   if(changedSide)colored.classList.add('cc-worktable-turn-in');
   if(garmentSurface)garmentSurface.replaceWith(colored);
   else garmentImg.after(colored);
   garmentSurface=colored;
   garmentImg.style.visibility='hidden';
   if(scene&&preview?.isConnected){
    // Atomic scene includes the entire desk. NEVER animate or squash it:
    // only the isolated garment canvas receives the 2D turn-in effect.
    preview.replaceWith(scene);preview=scene;
   }
   visualGarment=wantedGarment;visualColor=wantedColor;visualSide=wantedSide;
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
   if(!garmentSurface||current.garment!==visualGarment||current.color!==visualColor||view!==visualSide){
    await (latestRender||queueGarmentVisual());
    if(token!==switchToken)continue;
   }
   if(!garmentSurface||current.garment!==visualGarment||current.color!==visualColor||view!==visualSide){
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
 // The two artwork records share GARMENT/SIZE/COLOR only. File URL, bitmap,
 // editor geometry, selected tool and paper preset belong to each side.
 const saveActiveSide=()=>{
  storeSide(sideRecords,view,{url:artURL,bitmap:artBitmap,editor,preset:current.printSize});
 };
 const restoreActiveSide=()=>{
  const r=loadSide(sideRecords,view);
  artURL=r.url;artBitmap=r.bitmap;
  Object.assign(editor,r.editor);
  current=worktableReducer(current,{type:'select',group:'printSize',value:r.preset});
  if(artURL){artImg.src=artURL;artImg.style.objectFit='contain'}
  else artImg.removeAttribute('src');
  scale.disabled=!artURL;reset.disabled=!artURL;remove.disabled=!artURL;
  scale.value=String(editor.adjustment);
  scaleOut.textContent=printScaleLabel(editor.adjustment);
  paintSelection();revealGuide();printPosition();syncPricing();
 };
 viewButton.addEventListener('click',async()=>{
  if(viewButton.disabled)return;
  const from=view,target=view==='front'?'back':'front';
  viewButton.disabled=true;
  saveActiveSide(); // Preserve the current side even when lazy back loading fails.
  try{
   if(dragging)throw new Error('Finish moving the artwork before turning the garment');
   if(target==='back')await ensureBackManifest();
   view=target;restoreActiveSide();
   print.style.visibility='hidden';
   const switched=await queueGarmentVisual();
   if(!switched)throw new Error('Could not prepare the requested garment view');
   restoreActiveSide();
   viewButton.querySelector('.cc-worktable-view-label').textContent=view==='front'?'View back':'View front';
   viewButton.setAttribute('aria-label',view==='front'?'View back':'View front');
   announce(view==='front'?'Front of garment shown.':'Back of garment shown.');
  }catch(error){
   view=from;restoreActiveSide();
   await queueGarmentVisual();
   announce('View change unavailable: '+String(error?.message||error).slice(0,130));
  }finally{
   print.style.visibility='';
   viewButton.disabled=false;
  }
 });
 const clearArtURL=()=>{
  if(artURL)URL.revokeObjectURL(artURL);
  artURL=null;artBitmap=null;
  sideRecords[view].url=null;sideRecords[view].bitmap=null;
 };
 const update=(group,value)=>{
  if(group==='upload'){file.click();return}
  current=worktableReducer(current,{type:'select',group,value});
  // Retain relative placement and recompute safe bounds for garment/preset changes.
  if(group==='printSize')revealGuide();
     paintSelection(group==='garment');syncPricing();announce(`${labels[value]} selected`);
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
   editor.x=editor.y=0;editor.adjustment=0;editor.rotation=0;editor.selected=false;editor.mode='move';
   // The selected A4 frame location is independent from newly uploaded artwork.
   scale.value='0';scaleOut.textContent='0%';scale.disabled=false;remove.disabled=false;reset.disabled=false;
   // Precompute the new fitted bounds before showing the new source pixels.
       paintSelection();syncPricing();artImg.style.objectFit='contain';artImg.src=artURL;revealGuide();
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
  editor.x=editor.y=0;editor.frameX=editor.frameY=0;editor.adjustment=0;editor.rotation=0;scale.value='0';
  printPosition();indicatePlacement();announce('Artwork placement reset to 0%, centered on '+current.printSize+', rotation 0°.');
 });
 remove.addEventListener('click',()=>{
  clearArtURL();artImg.removeAttribute('src');scale.disabled=true;remove.disabled=true;reset.disabled=true;
  print.classList.remove('is-manipulating','is-beyond-reference');
  if(placementFeedbackTimer!==null)clearTimeout(placementFeedbackTimer);
  placementFeedbackTimer=null;
  editor.rotation=0;editor.selected=false;editor.mode='move';
     scale.value='0';scaleOut.textContent='0%';paintSelection();syncPricing();hideEditor();announce('Artwork removed.');
 });
 const dragLayer=document.createElement('button');
 dragLayer.type='button';dragLayer.className='cc-worktable-drag';
 dragLayer.setAttribute('aria-label','Select and move uploaded artwork');
 dragLayer.title='Select artwork';print.append(dragLayer);
 const selectEditor=(mode='move')=>{
  if(!artURL)return;
  editor.selected=true;editor.mode=mode;
  revealGuide();printPosition();
 };
 for(const [mode,button] of toolButtons){
  button.addEventListener('click',event=>{
   event.stopPropagation();
   if(!artURL)return;
   editor.selected=true;
   if(mode==='rotate'){
    editor.rotation=(editor.rotation+90)%360;editor.mode='rotate';
    announce('Artwork rotated '+editor.rotation+' degrees clockwise.');
   }else{
    editor.mode=mode;
    announce(mode==='move'?'Move mode. Drag the artwork to position it.':
     'Resize mode. Drag any corner proportionally, or adjust the size slider.');
   }
   revealGuide();printPosition();
  });
 }
 // Pointer capture is attached to the actual clipped print. One finger
 // moves artwork locally; two fingers pinch it, with the same hard bounds.
 const artworkPointers=new Map();
 const dragStart=e=>{
  if(!artURL)return;
  e.preventDefault();
  if(!editor.selected)selectEditor('move');
  if(editor.mode!=='move'&&editor.mode!=='resize')return;
  const stageRect=stage.getBoundingClientRect(),factor=2048/stageRect.width;
  artworkPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  dragLayer.setPointerCapture(e.pointerId);
  if(artworkPointers.size>=2){
   const [first,second]=[...artworkPointers.values()];
   dragging={type:'pinch',factor,distance:Math.max(1,Math.hypot(second.x-first.x,second.y-first.y)),
    x:(first.x+second.x)/2,y:(first.y+second.y)/2,
    startX:editor.x,startY:editor.y,startAdjustment:editor.adjustment};
  }else{
   dragging={type:'move',id:e.pointerId,x:e.clientX,y:e.clientY,startX:editor.x,startY:editor.y,factor};
  }
  dragLayer.classList.add('is-dragging');indicatePlacement(true);
 };
 dragLayer.addEventListener('pointerdown',dragStart);
 dragLayer.addEventListener('click',()=>{if(artURL&&!editor.selected)selectEditor('move')});
 dragLayer.addEventListener('pointermove',e=>{
  if(!artworkPointers.has(e.pointerId)||!dragging)return;
  artworkPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(dragging.type==='pinch'&&artworkPointers.size>=2){
   const [first,second]=[...artworkPointers.values()];
   const distance=Math.hypot(second.x-first.x,second.y-first.y);
   const centerX=(first.x+second.x)/2,centerY=(first.y+second.y)/2;
   editor.adjustment=Math.round((1+dragging.startAdjustment/100)*distance/dragging.distance*100-100);
   editor.x=dragging.startX+(centerX-dragging.x)*dragging.factor;
   editor.y=dragging.startY+(centerY-dragging.y)*dragging.factor;
  }else if(dragging.type==='move'&&dragging.id===e.pointerId){
   editor.x=dragging.startX+(e.clientX-dragging.x)*dragging.factor;
   editor.y=dragging.startY+(e.clientY-dragging.y)*dragging.factor;
  }else return;
  printPosition();
 });
 const endDrag=e=>{
  if(artworkPointers.has(e.pointerId)){
   artworkPointers.delete(e.pointerId);
   if(dragLayer.hasPointerCapture(e.pointerId))dragLayer.releasePointerCapture(e.pointerId);
   if(artworkPointers.size===1){
    const [id,position]=[...artworkPointers.entries()][0];
    dragging={type:'move',id,x:position.x,y:position.y,
     startX:editor.x,startY:editor.y,factor:2048/stage.getBoundingClientRect().width};
   }else if(!artworkPointers.size)dragging=null;
  }else if(dragging?.type==='resize'&&dragging.id===e.pointerId){
   const handle=cornerHandles.get(dragging.corner);
   if(handle?.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
   dragging=null;
  }
  if(!dragging){dragLayer.classList.remove('is-dragging');indicatePlacement();}
 };
 dragLayer.addEventListener('pointerup',endDrag);
 dragLayer.addEventListener('pointercancel',endDrag);
 // Frame handle is separate from the artwork's drag target, so repositioning
 // an A4 print moves both its fixed rectangle and every pixel of its artwork.
 frameHandle.addEventListener('pointerdown',e=>{
  if(current.printSize!=='A4')return;
  e.preventDefault();e.stopPropagation();
  const factor=2048/stage.getBoundingClientRect().width;
  dragging={type:'frame',id:e.pointerId,x:e.clientX,y:e.clientY,
   startX:editor.frameX,startY:editor.frameY,factor};
  frameHandle.setPointerCapture(e.pointerId);indicatePlacement(true);
 });
 frameHandle.addEventListener('pointermove',e=>{
  if(dragging?.type!=='frame'||dragging.id!==e.pointerId)return;
  editor.frameX=dragging.startX+(e.clientX-dragging.x)*dragging.factor;
  editor.frameY=dragging.startY+(e.clientY-dragging.y)*dragging.factor;
  printPosition();
 });
 const endFrame=e=>{
  if(dragging?.type!=='frame'||dragging.id!==e.pointerId)return;
  if(frameHandle.hasPointerCapture(e.pointerId))frameHandle.releasePointerCapture(e.pointerId);
  dragging=null;indicatePlacement();
 };
 frameHandle.addEventListener('pointerup',endFrame);
 frameHandle.addEventListener('pointercancel',endFrame);
 frameHandle.addEventListener('keydown',e=>{
  if(current.printSize!=='A4')return;
  const delta=e.shiftKey?14:4;
  const dx={ArrowLeft:-delta,ArrowRight:delta}[e.key];
  const dy={ArrowUp:-delta,ArrowDown:delta}[e.key];
  if(dx===undefined&&dy===undefined)return;
  e.preventDefault();
  editor.frameX+=dx||0;editor.frameY+=dy||0;
  printPosition();indicatePlacement();
 });
 dragLayer.addEventListener('keydown',e=>{
  if(!artURL)return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();selectEditor('move');return;}
  const delta=e.shiftKey?14:4;
  const dx={ArrowLeft:-delta,ArrowRight:delta}[e.key],dy={ArrowUp:-delta,ArrowDown:delta}[e.key];
  if(dx===undefined&&dy===undefined)return;
  e.preventDefault();selectEditor('move');
  editor.x+=dx||0;editor.y+=dy||0;printPosition();indicatePlacement();
 });
 for(const [corner,handle] of cornerHandles){
  handle.addEventListener('pointerdown',e=>{
   if(!artURL||!lastInfo)return;
   e.preventDefault();e.stopPropagation();
   editor.selected=true;editor.mode='resize';
   const stageRect=stage.getBoundingClientRect();
   const sx=stageRect.width/2048,sy=stageRect.height/1152;
   const centerX=stageRect.left+lastInfo.centerX*sx,centerY=stageRect.top+lastInfo.centerY*sy;
   const distance=Math.max(10,Math.hypot(e.clientX-centerX,e.clientY-centerY));
   dragging={type:'resize',corner,id:e.pointerId,centerX,centerY,distance,
    startAdjustment:editor.adjustment};
   handle.setPointerCapture(e.pointerId);indicatePlacement(true);
  });
  handle.addEventListener('pointermove',e=>{
   if(!dragging||dragging.type!=='resize'||dragging.corner!==corner||dragging.id!==e.pointerId)return;
   const nextDistance=Math.hypot(e.clientX-dragging.centerX,e.clientY-dragging.centerY);
   const newScale=(1+dragging.startAdjustment/100)*(nextDistance/dragging.distance);
   editor.adjustment=clamp(Math.round((newScale-1)*100),-50,100);
   printPosition({feedback:true});
  });
  handle.addEventListener('pointerup',endDrag);
  handle.addEventListener('pointercancel',endDrag);
  handle.addEventListener('keydown',e=>{
   if(e.key!=='ArrowUp'&&e.key!=='ArrowRight'&&e.key!=='ArrowDown'&&e.key!=='ArrowLeft')return;
   e.preventDefault();
   editor.adjustment+=e.key==='ArrowUp'||e.key==='ArrowRight'?1:-1;
   printPosition({feedback:true});indicatePlacement();
  });
 }
 const onOutsidePointer=e=>{
  if(!editor.selected)return;
  const t=e.target;
  if(print.contains(t)||tools.contains(t)||
   [...cornerHandles.values()].some(h=>h===t||h.contains(t)))return;
  hideEditor();
 };
 document.addEventListener('pointerdown',onOutsidePointer,true);
 const unload=()=>{
  if(placementFeedbackTimer!==null)clearTimeout(placementFeedbackTimer);
  if(guideTimer!==null)clearTimeout(guideTimer);
  document.removeEventListener('pointerdown',onOutsidePointer,true);
  saveActiveSide();
  disposeSideRecords(sideRecords,url=>URL.revokeObjectURL(url));
  artURL=null;artBitmap=null;
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
 return {getState:()=>({...current,view}),getPricing:()=>calculateArtistPrice(selectionForPricing()),getOrderData:()=>buildArtistCustomization(selectionForPricing()),getPlacement:()=>({...editor,scale:1+editor.adjustment/100}),destroy:()=>{
  saveActiveSide();disposeSideRecords(sideRecords,url=>URL.revokeObjectURL(url));
  artURL=null;artBitmap=null;
  if(uploadAckTimer!==null)clearTimeout(uploadAckTimer);
  uploadObserver?.disconnect();document.removeEventListener('visibilitychange',syncUploadMotion);
  window.removeEventListener('pagehide',unload);root.replaceChildren();
 }};
}