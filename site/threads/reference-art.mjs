/**
 * Standalone Threads layout image boundary.
 * Normal catalog images are provisional until original full-resolution exports
 * are supplied. The T03 banner is a STATIC composite of existing owner-concept
 * transparent illustrations, without CMS runtime or motion integration.
 */
const T03_ART_BASE = 'https://raw.githubusercontent.com/SaamVR/EcomCMS/e03e4da15e4eeee82019937f21b688c6142f63c1/public/assets/threads/t03/';
let installed = false;

export function installReferenceArt() {
  if (installed) return;
  const fallback = document.querySelector('img[data-ref-img="backpack"]');
  if (!fallback?.parentElement) return;
  installed = true;
  const stage = document.createElement('div');
  stage.className = 'backpack-static-stage';
  stage.setAttribute('role','img');
  stage.setAttribute('aria-label','Illustrated orange and turquoise travel backpack with accessories');
  stage.style.cssText = 'position:relative; width:100%; height:min(33vw,330px);min-height:190px;align-self:end;';
  for (const layer of ['interior','body','flap','cap','sneaker','bottle']) {
    const image = document.createElement('img');
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.dataset.artLayer = layer;
    image.src = T03_ART_BASE + 'original-' + layer + '.webp';
    image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:normal;';
    stage.appendChild(image);
  }
  // Ensure layer failures do not make the banner disappear.
  let failures = 0;
  const fail = () => {
    failures++;
    if (failures >= 3) { stage.remove();fallback.hidden = false; }
  };
  for (const item of stage.children) item.addEventListener('error',fail,{once:true});
  fallback.hidden = true;
  fallback.parentElement.appendChild(stage);
}
