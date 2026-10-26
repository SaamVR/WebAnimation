import { categoryCard, artworkCard, shirtSilhouette } from './components.mjs';

const categories = [
  {name:'Illustrated Tees',note:'Apparel slot',kind:'apparel'},
  {name:'Artist Editions',note:'Limited-edition slot',kind:'apparel'},
  {name:'Paper & Prints',note:'Poster / paper slot',kind:'art'},
];
const features=['Featured piece 01','Featured piece 02','Featured piece 03'];
const arrivals=['Future arrival 01','Future arrival 02','Future arrival 03','Future arrival 04'];
const byId = id => document.getElementById(id);
const categoryGrid=byId('categoryGrid');
const featureGrid=byId('featureGrid');
const arrivalGrid=byId('arrivalGrid');
if (categoryGrid) categoryGrid.innerHTML=categories.map(categoryCard).join('');
if (featureGrid) featureGrid.innerHTML=features.map(artworkCard).join('');
if (arrivalGrid) arrivalGrid.innerHTML=arrivals.map((title,i)=>`<article class="arrival-card"><div class="arrival-visual">${shirtSilhouette(i)}</div><div><strong>${title}</strong><small>Placeholder · no live inventory</small></div></article>`).join('');

const searchToggle=byId('searchToggle');
const searchPanel=byId('searchPanel');
const searchInput=byId('siteSearch');
const results=byId('searchResults');
const sections=[['Categories','#categories'],['Featured artwork','#featured'],['People, Places, Prints','#story'],['Studio process','#process'],['Posters and artwork','#posters'],['New arrivals','#arrivals'],['Community','#community']];
const renderResults=query=>{
  const normalized=query.trim().toLocaleLowerCase();
  const matches=sections.filter(([label])=>label.toLocaleLowerCase().includes(normalized));
  results.replaceChildren();
  if(!normalized){ results.textContent='Search site sections only; real product search will come later.'; return; }
  if(!matches.length){results.textContent='No matching sections in this study.';return;}
  matches.forEach(([label,target])=>{const link=document.createElement('a');link.href=target;link.textContent=label;results.append(link);});
};
function toggleSearch(force){
  const open=typeof force==='boolean'?force:searchPanel.hidden;
  searchPanel.hidden=!open;
  searchToggle.setAttribute('aria-expanded',String(open));
  if(open){renderResults('');searchInput.focus();}else searchToggle.focus();
}
searchToggle.addEventListener('click',()=>toggleSearch());
searchInput.addEventListener('input',()=>renderResults(searchInput.value));
results.addEventListener('click',event=>{if(event.target.closest('a'))toggleSearch(false);});
const menuToggle=byId('menuToggle');
const mobileMenu=byId('mobileMenu');
function setMenu(open){mobileMenu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close menu':'Open menu');}
menuToggle.addEventListener('click',()=>setMenu(mobileMenu.hidden));
mobileMenu.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    if(!searchPanel.hidden){toggleSearch(false);return;}
    if(!mobileMenu.hidden){setMenu(false);menuToggle.focus();}
  }
});
const notice=byId('notice');
let noticeTimer;
function showNotice(message){
  clearTimeout(noticeTimer);notice.textContent=message;notice.hidden=false;
  noticeTimer=setTimeout(()=>{notice.hidden=true;},3800);
}
byId('cartButton').addEventListener('click',()=>showNotice('Cart is reserved for a later demo stage. No items or purchases are available.'));
byId('bellButton').addEventListener('click',()=>showNotice('Brass bell animation C02 awaits artwork and creative approval.'));
