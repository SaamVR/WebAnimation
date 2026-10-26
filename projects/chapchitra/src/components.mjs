// Self-contained structural placeholders. No brand illustrations, products or stock photos.
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export function shirtSilhouette(index=0) {
  const palette = ['#e4e2da','#d1d3cb','#bfc7bf','#e2d4c5'];
  const fill = palette[index % palette.length];
  return `<svg class="shirt-svg" viewBox="0 0 280 280" aria-hidden="true" focusable="false"><path d="M97 39c24 16 62 16 86 0l48 33 32 54-46 34-24-30v111H87V130l-24 30-46-34 32-54 48-33Z" fill="${fill}" stroke="#66736a" stroke-width="2.5" stroke-linejoin="round"/><path d="M97 39q42 55 86 0" fill="none" stroke="#a7ada1" stroke-width="2.5"/><path d="M95 137h91M95 149h91" opacity=".24" stroke="#47544b" stroke-width=".9"/><text x="140" y="190" text-anchor="middle" font-size="9" letter-spacing="2" fill="#666c64">ARTWORK PENDING</text></svg>`;
}
export function printSilhouette(index=0) {
  return `<div class="blank-print blank-print-${index%3}" aria-hidden="true"><span class="print-border"><span>STUDIO<br>IMPRESSION</span><small>ARTWORK PENDING</small></span></div>`;
}
export function categoryCard({name,note,kind},index) {
  return `<article class="category-card"><div class="category-visual">${kind==='apparel'?shirtSilhouette(index):printSilhouette(index)}</div><div class="category-label"><h3>${escapeHTML(name)}</h3><span>${escapeHTML(note)}</span></div></article>`;
}
export function artworkCard(title,index) {
  return `<article class="artwork-card"><div class="artwork-visual">${index%2===0?shirtSilhouette(index):printSilhouette(index)}</div><div class="artwork-caption"><span>${escapeHTML(title)}</span><small>Sample slot / not for sale</small></div></article>`;
}
