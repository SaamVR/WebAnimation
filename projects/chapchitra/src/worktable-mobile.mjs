/**
 * CHAPCHITRA Artist's Edit — phone-only illustration/popup presentation.
 *
 * Keep the authoritative 2048×1152 garment stage and all print algorithms
 * untouched. At <=600px its *container* becomes 9:16; the unchanged stage
 * is uniformly translated/scaled inside that container. The artwork's
 * stage-relative hit geometry remains correct during automatic edit zoom.
 */
const MOBILE_QUERY='(max-width: 600px)';
const GROUPS=['garment','color','size','printSize','upload'];
const LABELS={garment:'Garment',color:'Color',size:'Size',printSize:'Print',upload:'Artwork'};
const ICONS={
 garment:'<path d="m8 4 4 2 4-2 4 4 2 5-4 2-2-3v9H8v-9l-2 3-4-2 2-5 4-4Z"/><path d="M9 5c.5 2 1.5 3 3 3s2.5-1 3-3"/>',
 color:'<path d="M12 3a9 9 0 0 0 0 18h1.4a2.4 2.4 0 0 0 2.1-3.6 1.8 1.8 0 0 1 1.6-2.7h1A4.9 4.9 0 0 0 23 9.7C22.5 5.8 18.2 3 12 3Z"/><circle cx="7" cy="11" r=".8"/><circle cx="10" cy="7.5" r=".8"/><circle cx="16" cy="7.7" r=".8"/><circle cx="18.5" cy="11.6" r=".8"/>',
 size:'<path d="M3 16 16 3l5 5L8 21l-5-5Z"/><path d="m13 6 2 2m-5 1 2 2m-5 1 2 2m-5 1 2 2"/>',
 printSize:'<path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4"/>',
 upload:'<rect x="3" y="4" width="18" height="17" rx="2"/><circle cx="8" cy="9" r="1.6"/><path d="m4 18 6-6 4 4 3-3 4 4"/><path d="M18 2v6m-3-3h6"/>',
};
const fmtPct=n=>(Number.isFinite(n)?n:0).toFixed(4)+'%';
const svgIcon=group=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" width="26" height="26" aria-hidden="true">'+ICONS[group]+'</svg>';
const cropData=[
 // Named, independent clipped crops of the ORIGINAL approved desk artwork.
 // The broad soft masks only blend background pixels; objects are not redrawn.
 {id:'plant',source:[8,8,292,360],left:3,top:3,width:34,mask:'ellipse(49% 49% at 50% 50%)'},
 {id:'brushes',source:[1020,69,145,194],left:43,top:12,width:15,mask:'ellipse(48% 49% at 50% 50%)'},
 {id:'lamp',source:[366,66,183,208],left:73,top:18,width:24,mask:'ellipse(48% 49% at 50% 50%)'},
 {id:'pencil',source:[348,623,152,72],left:5,top:29,width:23,mask:'ellipse(49% 43% at 50% 50%)'},
 {id:'swatch',source:[328,686,177,166],left:5,top:65,width:25,mask:'ellipse(48% 47% at 50% 50%)'},
 {id:'ink',source:[1013,728,159,124],left:80,top:53,width:18,mask:'ellipse(48% 46% at 50% 50%)'},
];

export function mountMobileArtistEdit({
 body,frame,stage,manifest,layers,sourceURL,sourceInfo,
 artworkZone,update,file,uploadVisual,selectArtwork,refreshPlacement,
}){
 const media=window.matchMedia(MOBILE_QUERY);
 const wood=sourceURL(manifest['Artist-edit-backdrop-1.png'].delivery.variants[1]);
 frame.style.setProperty('--cc-mobile-wood','url("'+wood+'")');
 frame.classList.add('cc-mobile-frame-ready');
 const decors=document.createElement('div');
 decors.className='cc-mobile-decorations';
 decors.setAttribute('aria-hidden','true');
 frame.prepend(decors);
 for(const item of cropData){
  const [x,y,w,h]=item.source;
  const el=document.createElement('div');
  el.className='cc-mobile-decor cc-mobile-decor--'+item.id;
  el.style.left=item.left+'%';el.style.top=item.top+'%';
  el.style.width=item.width+'%';
  el.style.aspectRatio=w+' / '+h;
  el.style.clipPath=item.mask;
  const img=document.createElement('img');
  img.src=wood;img.alt='';img.draggable=false;img.decoding='async';
  img.style.position='absolute';
  img.style.width=fmtPct(1536/w*100);
  img.style.height=fmtPct(864/h*100);
  img.style.left=fmtPct(-x/w*100);
  img.style.top=fmtPct(-y/h*100);
  img.style.maxWidth='none';
  el.append(img);decors.append(el);
 }
 const popup=document.createElement('section');
 popup.className='cc-mobile-popup';popup.id='ccMobileArtistPopup';
 popup.setAttribute('role','dialog');
 popup.setAttribute('aria-label','Select a worktable category');
 popup.setAttribute('aria-modal','false');
 popup.hidden=true;
 const art=document.createElement('div');art.className='cc-mobile-popup-art';
 const close=document.createElement('button');
 close.type='button';close.className='cc-mobile-popup-close';close.textContent='×';
 close.setAttribute('aria-label','Close category');
 popup.append(art,close);
 frame.append(popup);
 const nav=document.createElement('nav');
 nav.className='cc-mobile-category-nav';nav.setAttribute('aria-label','Artist’s Edit categories');
 const items=new Map();
 for(const group of GROUPS){
  const item=document.createElement('button');item.type='button';
  item.className='cc-mobile-category-button';item.dataset.mobileGroup=group;
  item.setAttribute('aria-expanded','false');item.setAttribute('aria-controls',popup.id);
  item.setAttribute('aria-label','Open '+LABELS[group]+' options');
  item.innerHTML=svgIcon(group)+'<span>'+LABELS[group]+'</span>';
  nav.append(item);items.set(group,item);
 }
 frame.after(nav);
 const done=document.createElement('button');
 done.type='button';done.className='cc-mobile-zoom-done';
 done.textContent='Done';done.setAttribute('aria-label','Finish editing artwork and return to full worktable');
 done.hidden=true;frame.append(done);
 const originalZoneParent=artworkZone.parentNode;
 const originalZoneNext=artworkZone.nextSibling;
 let active=null;
 let zoomed=false;
 let disposed=false;
 const previousFocus=()=>document.activeElement;
 let beforePopupFocus=null;
 const isMobile=()=>media.matches;
 const isZoomed=()=>zoomed&&isMobile();
 const cleanArtZone=()=>{
  if(artworkZone.parentNode!==originalZoneParent){
   originalZoneParent.insertBefore(artworkZone,originalZoneNext);
  }
 };
 const closePopup=({returnFocus=false}={})=>{
  const was=active;
  active=null;popup.hidden=true;popup.dataset.group='';
  art.replaceChildren();cleanArtZone();
  items.forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-expanded','false')});
  if(returnFocus&&was)items.get(was)?.focus();
 };
 const drawPopup=group=>{
  art.replaceChildren();cleanArtZone();
  const matching=layers.filter(([path,g])=>{
   if(group==='garment')return path.startsWith('Garment style/');
   if(group==='color')return path.startsWith('Tshirt color/');
   if(group==='size')return path.startsWith('Size/');
   if(group==='printSize')return path.startsWith('Print size/');
   return path.startsWith('Upload image notebook/');
  }).filter(([path])=>!path.includes('title_2.png')&&!path.includes('title_3.png'));
  // Use complete illustrations rather than rebuilding art from typography:
  // each source is an individual transparent WebP layer, not a flatten.
  const box=group==='garment'?[60,316,555,654]:
   group==='color'?[19,681,456,1080]:
   group==='size'?[663,0,1390,198]:
   group==='printSize'?[1650,742,2010,1084]:[1547,157,1982,687];
  const [x0,y0,x1,y1]=box,w=x1-x0,h=y1-y0;
  const canvas=document.createElement('div');
  canvas.className='cc-mobile-popup-illustration';
  canvas.style.aspectRatio=w+' / '+h;
  canvas.dataset.kind=group;
  for(const [path,g,value] of matching){
   if(path.includes('upload_button'))continue; // use the owner SVG below
   const info=sourceInfo(path);
   if(!info?.stageBox)continue;
   const [x,y,iw,ih]=info.stageBox;
   const im=document.createElement('img');
   im.className='cc-mobile-illustrated-piece';
   im.alt='';im.draggable=false;im.decoding='async';
   im.src=sourceURL(info.variants[1]);
   im.style.left=fmtPct((x-x0)/w*100);
   im.style.top=fmtPct((y-y0)/h*100);
   im.style.width=fmtPct(iw/w*100);
   im.style.height=fmtPct(ih/h*100);
   canvas.append(im);
  }
  if(group==='upload'){
   const copy=uploadVisual.cloneNode(true);
   copy.removeAttribute('id');
   copy.className='cc-mobile-popup-upload-art';
   const info=sourceInfo('Upload image notebook/Upload_image_notebook_upload_button_4.png');
   const [x,y,iw,ih]=info.stageBox;
   Object.assign(copy.style,{left:fmtPct((x-x0)/w*100),top:fmtPct((y-y0)/h*100),
    width:fmtPct(iw/w*100),height:fmtPct(ih/h*100)});
   canvas.append(copy);
   const hit=document.createElement('button');
   hit.type='button';hit.className='cc-mobile-popup-option cc-mobile-popup-upload-hit';
   hit.setAttribute('aria-label','Upload artwork from this device');
   Object.assign(hit.style,{left:fmtPct((x-x0+iw/2)/w*100),top:fmtPct((y-y0+ih/2)/h*100)});
   hit.addEventListener('click',()=>file.click());
   canvas.append(hit);
  }else{
   for(const [path,g,value] of matching){
    if(!g||value===undefined)continue;
    const bbox=manifest[path]?.bbox;if(!bbox)continue;
    const centerX=(bbox[0]+bbox[2])/2,centerY=(bbox[1]+bbox[3])/2;
    const hit=document.createElement('button');
    hit.type='button';hit.className='cc-mobile-popup-option';
    hit.dataset.group=g;hit.dataset.value=value;
    hit.setAttribute('aria-label',g==='garment'?value+' garment':LABELS[group]+' '+value);
    hit.setAttribute('aria-pressed','false');
    Object.assign(hit.style,{left:fmtPct((centerX-x0)/w*100),top:fmtPct((centerY-y0)/h*100)});
    hit.addEventListener('click',()=>{update(g,value);syncSelected()});
    canvas.append(hit);
   }
  }
  art.append(canvas);
  if(group==='upload'){
   const more=document.createElement('div');
   more.className='cc-mobile-popup-artwork-controls';
   more.append(artworkZone);art.append(more);
  }
  syncSelected();
 };
 const syncSelected=()=>{
  for(const button of art.querySelectorAll('.cc-mobile-popup-option[data-group]')){
   const live=window.__ccMobileState?.()||null;
   if(!live)continue;
   button.setAttribute('aria-pressed',String(live[button.dataset.group]===button.dataset.value));
  }
 };
 // State is fetched from the existing editor closure. There is no new reducer.
 const stateAccessor=value=>{window.__ccMobileState=value};
 const openPopup=group=>{
  if(!isMobile()||zoomed)return;
  if(active===group){closePopup({returnFocus:true});return}
  closePopup();active=group;
  popup.dataset.group=group;popup.setAttribute('aria-label',LABELS[group]+' options');
  drawPopup(group);popup.hidden=false;
  items.forEach((b,k)=>{const selected=k===group;b.classList.toggle('is-active',selected);b.setAttribute('aria-expanded',String(selected))});
  beforePopupFocus=previousFocus();
 };
 const enterZoom=()=>{
  if(!isMobile()||zoomed)return false;
  closePopup();zoomed=true;body.classList.add('cc-mobile-editing');
  done.hidden=false;
  selectArtwork();
  requestAnimationFrame(()=>refreshPlacement());
  return true;
 };
 const exitZoom=()=>{
  if(!zoomed)return;
  zoomed=false;body.classList.remove('cc-mobile-editing');
  done.hidden=true;requestAnimationFrame(()=>refreshPlacement());
 };
 const viewportChanged=()=>{
  if(!isMobile()){closePopup();exitZoom()}
 };
 const onOutside=e=>{
  if(!active||!isMobile())return;
  if(popup.contains(e.target)||nav.contains(e.target))return;
  closePopup();
 };
 const onKey=e=>{
  if(e.key!=='Escape'||!isMobile())return;
  if(zoomed){e.preventDefault();exitZoom();done.blur()}
  else if(active){e.preventDefault();closePopup({returnFocus:true})}
 };
 for(const [group,item] of items)item.addEventListener('click',()=>openPopup(group));
 close.addEventListener('click',()=>closePopup({returnFocus:true}));
 done.addEventListener('click',exitZoom);
 document.addEventListener('pointerdown',onOutside,true);
 document.addEventListener('keydown',onKey);
 media.addEventListener?.('change',viewportChanged);
 // Do not introduce a second price/garment/side editor. The caller owns it all.
 return {isMobile,isZoomed,enterZoom,exitZoom,openPopup,closePopup,syncSelected,stateAccessor,
  destroy(){
   if(disposed)return;disposed=true;
   closePopup();exitZoom();media.removeEventListener?.('change',viewportChanged);
   document.removeEventListener('pointerdown',onOutside,true);
   document.removeEventListener('keydown',onKey);
   nav.remove();popup.remove();done.remove();decors.remove();
   delete window.__ccMobileState;
  }};
}
