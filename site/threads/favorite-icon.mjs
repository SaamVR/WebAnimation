/** Exactly the same SVG path, dimensions and strokes in navbar and all cards. */
export const favoriteSvg=()=>`<svg class="threads-heart" viewBox="0 0 24 24" width="24" height="24"
 aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
 <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>`;
export const favoriteButton=(product,selected)=>`<button type="button" class="threads-product-favorite"
 data-save="${product.id}" aria-label="${selected?'Remove':'Add'} ${product.name.replaceAll('&','&amp;').replaceAll('<','&lt;')} ${selected?'from':'to'} favorites"
 aria-pressed="${selected}">${favoriteSvg()}</button>`;
export function installNavbarHeart(){
 const nav=document.getElementById('favorites-button');
 if(!nav)return;
 nav.innerHTML=favoriteSvg();
 nav.classList.add('threads-navbar-heart');
}
export function syncNavbarFavorites(count){
 const nav=document.getElementById('favorites-button');
 if(!nav)return;
 nav.classList.toggle('has-favorites',count>0);
 nav.setAttribute('aria-label',count?`Saved favorites (${count})`:'View saved favorites');
}
