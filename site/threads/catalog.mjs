export const catalog = [
  { id:'f1', group:'featured', asset:'./assets/featured-olive-sneaker-owner-20261018.webp', name:'Olive Sport Runner', subtitle:'Olive / Everyday Sneaker', category:'Sneakers', price:5990, swatches:['#596639','#e6dfcf','#292b25'], image:'feat-1' },
  { id:'f2', group:'featured', asset:'./assets/featured-yellow-cap-owner-20261018.webp', name:'Sunburst Baseball Cap', subtitle:'Yellow / Navy Everyday Cap', category:'Accessories', type:'cap', price:1390, swatches:['#f5ad1d','#192740','#e6dfcf'], image:'feat-2' },
  { id:'f3', group:'featured', asset:'./assets/featured-orange-duffel-owner-20261018.webp', name:'Orange Weekender Duffel', subtitle:'Orange / Travel Duffel Bag', category:'Bags', price:4490, swatches:['#d46a24','#292b2e','#e7d5bd'], image:'feat-3' },
  { id:'f4', group:'featured', asset:'./assets/featured-black-headphones-owner-20261018.webp', name:'Studio Wireless Headphones', subtitle:'Black / Over-Ear Audio', category:'Accessories', price:8990, swatches:['#222427','#3b4e61','#dcd7c9'], image:'feat-4' },
  { id:'n1', group:'arrival', asset:'./assets/arrival-aqua-runner.webp', name:'Aqua Motion Runner', subtitle:'Aqua / Coral Everyday Sneaker', category:'Sneakers', price:5490, swatches:['#b4d4d3','#ef565c','#b9da52'], image:'arrival-1' },
  { id:'n2', group:'arrival', asset:'./assets/arrival-crimson-runner.webp', name:'Crimson Track Runner', subtitle:'Crimson / Black Athletic Sneaker', category:'Sneakers', price:4690, swatches:['#c71937','#161718','#e2e0d9'], image:'arrival-2' },
  { id:'n3', group:'arrival', asset:'./assets/arrival-amber-runner.webp', name:'Amber Street Runner', subtitle:'Mustard / Black Everyday Sneaker', category:'Sneakers', price:4990, swatches:['#f5b820','#1a1b1b','#e5e4de'], image:'arrival-3' },
  { id:'n4', group:'arrival', asset:'./assets/arrival-bottom-orange-cream-20261018.webp', name:'Orange Velocity Runner', subtitle:'Orange / Cream Sport Sneaker', category:'Sneakers', price:6490, swatches:['#f06a20','#171817','#e8e3d5'], image:'arrival-4' },
  { id:'n5', group:'arrival', asset:'./assets/arrival-bottom-lime-20261018.webp', name:'Lime Motion Runner', subtitle:'Lime Green / Lightweight Sneaker', category:'Sneakers', price:4690, swatches:['#a2de3b','#1c2820','#e3e6dd'], image:'arrival-5' },
  { id:'n6', group:'arrival', asset:'./assets/arrival-bottom-black-teal-20261018.webp', name:'Teal Night Runner', subtitle:'Black / Turquoise Sport Sneaker', category:'Sneakers', price:6290, swatches:['#171b1d','#24c7c5','#555b55'], image:'arrival-6' },
];
// Primary merchandising filters; the existing homepage retains its approved sections.
export const catalogFilters = Object.freeze([
  {id:'All', label:'All Products'},
  {id:'Sneakers', label:'Shoes / Sneakers'},
  {id:'Hats', label:'Hats / Caps'},
  {id:'Bags', label:'Backpacks / Bags'},
  {id:'Accessories', label:'Accessories'}
]);
export const merchandisingCategory = product =>
  product.type==='cap'||product.category==='Hats' ? 'Hats' : product.category;
export function productGallery(product) {
  // Each owner-supplied alternate angle must be a distinct source asset.
  // Existing products intentionally retain cropped single-photo views until Batch 2 arrives.
  if (Array.isArray(product.gallery) && product.gallery.length)
    return product.gallery.filter(x=>x&&x.asset&&x.label).map(x=>({
      asset:x.asset, label:x.label, crop:0, isAlternate:true
    }));
  return [
    {asset:product.asset, label:'Full product image', crop:0, isAlternate:false},
    {asset:product.asset, label:'Detail crop of the same photograph', crop:1, isAlternate:false},
    {asset:product.asset, label:'Closer crop of the same photograph', crop:2, isAlternate:false}
  ];
}
export const catalogById = Object.freeze(Object.fromEntries(catalog.map(product=>[product.id, product])));
export const imageUrl = product => '/'+(product.asset || product.fallback || '').replace(/^\.\//,'');
export const priceTk = amount => 'Tk ' + Math.round(amount).toLocaleString('en-BD');
export const safeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sneakerIds = new Set(['f1','n1','n2','n3','n4','n5','n6']);
const vintageIds = new Set(['f1','n2','n3','n4','n6']);
export const productMeta = product => ({
  id:product.id,
  description: product.description || (product.category==='Sneakers'
    ? 'Comfortable everyday sneaker with a distinctive silhouette, created for movement and casual styling. Illustrative THREADS demo product.'
    : product.category==='Bags'
      ? 'A practical everyday travel companion with a standout finish. Illustrative THREADS demo product.'
      : 'Everyday accessory with a clean, versatile finish. Illustrative THREADS demo product.'),
  colors: Array.isArray(product.colors)&&product.colors.length ? product.colors : product.swatches.map((hex,i)=>({id:'color-'+i,name:({
    f1:['Olive','Ivory','Charcoal'],f2:['Yellow','Navy','Cream'],f3:['Orange','Black','Sand'],
    f4:['Black','Slate','Ivory'],n1:['Aqua','Coral','Lime'],n2:['Crimson','Black','Ivory'],
    n3:['Amber','Black','White'],n4:['Orange','Black','Cream'],n5:['Lime','Graphite','Ivory'],
    n6:['Black','Teal','Grey']
  })[product.id]?.[i]||'Color '+(i+1),hex})),
  sizes: Array.isArray(product.sizes)&&product.sizes.length ? product.sizes : product.category==='Sneakers' ? [38,39,40,41,42,43].map(n=>String(n)) : ['One Size'],
  status: product.group==='arrival'?'New Arrival':'Featured',
  keywords: [
    product.category==='Sneakers'?'sneaker sneakers shoes trainers running footwear':'',
    product.category==='Bags'?'bag bags travel': '',
    product.type==='backpack'?'backpack backpacks rucksack daypack':'',
    product.type==='duffel'||product.id==='f3'?'duffel weekender luggage':'',
    product.category==='Accessories'?'accessories accessory':'',
    merchandisingCategory(product)==='Hats'?'cap caps hat hats headwear baseball':'',
    product.id==='f4'?'headphones audio earphones':'',
    vintageIds.has(product.id)?'vintage retro classic heritage inspired sneakers':'',
    product.group==='arrival'?'new arrivals new':'',
    ...(Array.isArray(product.tags)?product.tags:[])
  ].join(' ')
});
export function searchCatalog(query='',category=''){
  const tokens=String(query).toLowerCase().trim().split(/\s+/).filter(Boolean).map(t=>t.endsWith('s')&&t.length>4?t.slice(0,-1):t);
  return catalog.filter(p=>{
    if(category && category!=='All' && merchandisingCategory(p).toLowerCase()!==category.toLowerCase())return false;
    const hay=(p.name+' '+p.subtitle+' '+merchandisingCategory(p)+' '+productMeta(p).keywords).toLowerCase();
    return tokens.every(token=>hay.includes(token));
  });
}
