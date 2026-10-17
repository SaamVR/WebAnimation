/**
 * THREADS reference photograph assets.
 * The owner supplied only a 431x1536 full-page composite design JPEG.
 * This optional sprite contains *separate photographic/illustration regions*
 * extracted from that reference. The page itself is genuine semantic HTML/CSS,
 * never the original flattened screenshot.
 *
 * Keep T01-T04 motion disabled until the owner provides each choreography brief.
 */
const regions = Object.freeze({
  hero:[4,4,226,200],
  'cat-sneaker':[234,4,80,67],
  'cat-bag':[318,4,86,70],
  'cat-accessory':[408,4,84,67],
  'feat-1':[496,4,87,68],
  'feat-2':[587,4,87,68],
  'feat-3':[4,208,89,68],
  'feat-4':[97,208,91,68],
  'editorial-main':[192,208,115,112],
  'editorial-1':[311,208,53,54],
  'editorial-2':[368,208,56,54],
  'editorial-3':[428,208,53,54],
  'editorial-4':[485,208,56,54],
  campaign:[4,324,207,123],
  'arrival-1':[215,324,117,64],
  'arrival-2':[336,324,121,64],
  'arrival-3':[461,324,117,64],
  'arrival-4':[4,451,117,75],
  'arrival-5':[125,451,121,75],
  'arrival-6':[250,451,117,75],
  backpack:[371,451,197,149]
});
const urls = new Map();
let atlasPromise;

function loadAtlas() {
  if (atlasPromise) return atlasPromise;
  atlasPromise = new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null); // Fallback src remains available
    image.src = './art-atlas.webp';
  });
  return atlasPromise;
}

function cropImage(atlas, key) {
  if(urls.has(key))return urls.get(key);
  const rect = regions[key];
  if(!rect)return null;
  const [x,y,w,h]=rect;
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  const context=canvas.getContext('2d');
  if(!context)return null;
  context.drawImage(atlas,x,y,w,h,0,0,w,h);
  const url=canvas.toDataURL('image/webp',.96);
  urls.set(key,url);
  return url;
}

export async function refreshReferenceCrops() {
  const atlas = await loadAtlas();
  if (!atlas) return;
  for(const element of document.querySelectorAll('img[data-ref-img]')) {
    const key=element.dataset.refImg;
    if(!regions[key] || element.dataset.cropped===key)continue;
    const url=cropImage(atlas,key);
    if(!url)continue;
    element.loading='eager';
    element.src=url;
    element.dataset.cropped=key;
  }
}
