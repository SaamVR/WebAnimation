import {moneyUSD} from './deals.mjs';
export const catalog = [
  { id:'f2', group:'featured', asset:'./assets/products/f2/cover.webp', name:'Sunburst Baseball Cap', subtitle:'Yellow / Navy Everyday Cap', category:'Accessories', type:'cap', price:24, swatches:['#f5ad1d','#192740','#e6dfcf'], image:'feat-2' },
  { id:'f3', group:'featured', asset:'./assets/featured-orange-duffel-owner-20261018.webp', name:'Orange Weekender Duffel', subtitle:'Orange / Travel Duffel Bag', category:'Bags', type:'duffel', price:69, swatches:['#d46a24','#292b2e','#e7d5bd'], image:'feat-3' },
  { id:'f4', group:'featured', asset:'./assets/featured-black-headphones-owner-20261018.webp', name:'Studio Wireless Headphones', subtitle:'Black / Over-Ear Audio', category:'Accessories', type:'headphones', price:89, swatches:['#222427','#3b4e61','#dcd7c9'], image:'feat-4' },
  { id:'n1', group:'arrival', asset:'./assets/arrival-aqua-runner.webp', name:'Aqua Motion Runner', subtitle:'Aqua / Coral Everyday Sneaker', category:'Sneakers', price:68, swatches:['#b4d4d3','#ef565c','#b9da52'], image:'arrival-1' },
  { id:'n2', group:'arrival', asset:'./assets/arrival-crimson-runner.webp', name:'Crimson Track Runner', subtitle:'Crimson / Black Athletic Sneaker', category:'Sneakers', price:79, swatches:['#c71937','#161718','#e2e0d9'], image:'arrival-2' },
  { id:'n3', group:'arrival', asset:'./assets/arrival-amber-runner.webp', name:'Amber Street Runner', subtitle:'Mustard / Black Everyday Sneaker', category:'Sneakers', price:72, swatches:['#f5b820','#1a1b1b','#e5e4de'], image:'arrival-3' },
  { id:'n4', group:'arrival', asset:'./assets/arrival-bottom-orange-cream-20261018.webp', name:'Orange Velocity Runner', subtitle:'Orange / Cream Sport Sneaker', category:'Sneakers', price:92, swatches:['#f06a20','#171817','#e8e3d5'], image:'arrival-4' },
  { id:'n5', group:'arrival', asset:'./assets/arrival-bottom-lime-20261018.webp', name:'Lime Motion Runner', subtitle:'Lime Green / Lightweight Sneaker', category:'Sneakers', price:66, swatches:['#a2de3b','#1c2820','#e3e6dd'], image:'arrival-5' },
  { id:'n6', group:'arrival', asset:'./assets/arrival-bottom-black-teal-20261018.webp', name:'Teal Night Runner', subtitle:'Black / Turquoise Sport Sneaker', category:'Sneakers', price:89, swatches:['#171b1d','#24c7c5','#555b55'], image:'arrival-6' },
  {"id":"sho-01","group":"catalog","asset":"./assets/products/sho-01/cover.webp","name":"Navy Vintage Runner","subtitle":"Navy / Heritage Runner","category":"Sneakers","type":"sneaker","price":79,"swatches":["#172d4b"],"colors":[{"id":"color-0","name":"Navy","hex":"#172d4b"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["retro","vintage","classic","heritage","navy","low-top"],"gallery":[{"asset":"./assets/products/sho-01/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-02","group":"catalog","asset":"./assets/products/sho-02/cover.webp","name":"Forest Court Platform","subtitle":"Forest / Cream Court Sneaker","category":"Sneakers","type":"sneaker","price":89,"swatches":["#3d5b47"],"colors":[{"id":"color-0","name":"Forest green","hex":"#3d5b47"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["court","low-top","platform","cream","green"],"gallery":[{"asset":"./assets/products/sho-02/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-03","group":"catalog","asset":"./assets/products/sho-03/cover.webp","name":"Lime Flux Trainer","subtitle":"Lime / Mesh Athletic Sneaker","category":"Sneakers","type":"sneaker","price":73,"swatches":["#b4e76a"],"colors":[{"id":"color-0","name":"Lime","hex":"#b4e76a"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["neon","lime","green","training","running","breathable"],"gallery":[{"asset":"./assets/products/sho-03/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-04","group":"catalog","asset":"./assets/products/sho-04/cover.webp","name":"Burnt Orange Vintage Runner","subtitle":"Rust / Retro Everyday Sneaker","category":"Sneakers","type":"sneaker","price":86,"swatches":["#c5672c"],"colors":[{"id":"color-0","name":"Burnt orange","hex":"#c5672c"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["vintage","retro","rust","orange","heritage","chunky"],"gallery":[{"asset":"./assets/products/sho-04/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-05","group":"catalog","asset":"./assets/products/sho-05/cover.webp","name":"Crimson Track Trainer","subtitle":"Red / Black Performance Sneaker","category":"Sneakers","type":"sneaker","price":95,"swatches":["#bf302f"],"colors":[{"id":"color-0","name":"Red","hex":"#bf302f"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["athletic","track","red","white","black","performance"],"gallery":[{"asset":"./assets/products/sho-05/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-06","group":"catalog","asset":"./assets/products/sho-06/cover.webp","name":"Burgundy Heritage Runner","subtitle":"Burgundy / Classic Sport Sneaker","category":"Sneakers","type":"sneaker","price":88,"swatches":["#63303e"],"colors":[{"id":"color-0","name":"Burgundy","hex":"#63303e"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["vintage","retro","burgundy","oxblood","classic","heritage"],"gallery":[{"asset":"./assets/products/sho-06/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-07","group":"catalog","asset":"./assets/products/sho-07/cover.webp","name":"Cocoa Vintage Runner","subtitle":"Chocolate / Everyday Sneaker","category":"Sneakers","type":"sneaker","price":85,"swatches":["#613f2e"],"colors":[{"id":"color-0","name":"Chocolate","hex":"#613f2e"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["vintage","retro","brown","leather","classic","heritage"],"gallery":[{"asset":"./assets/products/sho-07/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-08","group":"catalog","asset":"./assets/products/sho-08/cover.webp","name":"Olive Trail Tech","subtitle":"Olive / Technical Running Sneaker","category":"Sneakers","type":"sneaker","price":99,"swatches":["#59634a"],"colors":[{"id":"color-0","name":"Olive","hex":"#59634a"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["trail","runner","olive","technical","outdoor","sport"],"gallery":[{"asset":"./assets/products/sho-08/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"sho-09","group":"catalog","asset":"./assets/products/sho-09/cover.webp","name":"Deep Teal Heritage Runner","subtitle":"Teal / Retro Everyday Sneaker","category":"Sneakers","type":"sneaker","price":82,"swatches":["#174947"],"colors":[{"id":"color-0","name":"Deep teal","hex":"#174947"}],"sizes":["38","39","40","41","42","43","44"],"description":"A versatile sneaker silhouette for everyday styling. Image supplied by the owner; catalog name and USD price is illustrative demo metadata.","tags":["vintage","retro","teal","green","heritage"],"gallery":[{"asset":"./assets/products/sho-09/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"hat-01","group":"catalog","asset":"./assets/products/hat-01/cover.webp","name":"Sky Blue Two-Tone Cap","subtitle":"Sky Blue / Forest Brim","category":"Accessories","type":"cap","price":24,"swatches":["#a4dce9"],"colors":[{"id":"color-0","name":"Sky blue","hex":"#a4dce9"}],"sizes":["One Size"],"description":"An embroidered or printed everyday cap for easy styling. Owner-supplied photograph; illustrative THREADS demo price.","tags":["baseball","cap","two","tone","threads","sky","blue","forest","green"],"gallery":[{"asset":"./assets/products/hat-01/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"hat-02","group":"catalog","asset":"./assets/products/hat-02/cover.webp","name":"Charcoal THREADS Cap","subtitle":"Washed Black / Logo Cap","category":"Accessories","type":"cap","price":22,"swatches":["#2b2b2b"],"colors":[{"id":"color-0","name":"Charcoal","hex":"#2b2b2b"}],"sizes":["One Size"],"description":"An embroidered or printed everyday cap for easy styling. Owner-supplied photograph; illustrative THREADS demo price.","tags":["black","charcoal","baseball","threads"],"gallery":[{"asset":"./assets/products/hat-02/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"hat-03","group":"catalog","asset":"./assets/products/hat-03/cover.webp","name":"Terracotta THREADS Cap","subtitle":"Terracotta / Logo Cap","category":"Accessories","type":"cap","price":23,"swatches":["#a44331"],"colors":[{"id":"color-0","name":"Terracotta","hex":"#a44331"}],"sizes":["One Size"],"description":"An embroidered or printed everyday cap for easy styling. Owner-supplied photograph; illustrative THREADS demo price.","tags":["rust","terracotta","red","baseball","threads"],"gallery":[{"asset":"./assets/products/hat-03/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"hat-04","group":"catalog","asset":"./assets/products/hat-04/cover.webp","name":"Sunshine Monogram Cap","subtitle":"Yellow / Orange Brim","category":"Accessories","type":"cap","price":25,"swatches":["#ffce00"],"colors":[{"id":"color-0","name":"Yellow","hex":"#ffce00"}],"sizes":["One Size"],"description":"An embroidered or printed everyday cap for easy styling. Owner-supplied photograph; illustrative THREADS demo price.","tags":["two","tone","yellow","orange","monogram","baseball"],"gallery":[{"asset":"./assets/products/hat-04/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"hat-05","group":"catalog","asset":"./assets/products/hat-05/cover.webp","name":"Burgundy Corduroy Cap","subtitle":"Burgundy / Heritage Lettering","category":"Accessories","type":"cap","price":28,"swatches":["#643139"],"colors":[{"id":"color-0","name":"Burgundy","hex":"#643139"}],"sizes":["One Size"],"description":"An embroidered or printed everyday cap for easy styling. Owner-supplied photograph; illustrative THREADS demo price.","tags":["corduroy","burgundy","maroon","threads","heritage"],"gallery":[{"asset":"./assets/products/hat-05/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"hat-06","group":"catalog","asset":"./assets/products/hat-06/cover.webp","name":"Navy Script Cap","subtitle":"Navy / Embroidered Monogram","category":"Accessories","type":"cap","price":26,"swatches":["#1d304b"],"colors":[{"id":"color-0","name":"Navy","hex":"#1d304b"}],"sizes":["One Size"],"description":"An embroidered or printed everyday cap for easy styling. Owner-supplied photograph; illustrative THREADS demo price.","tags":["baseball","navy","blue","monogram","embroidered"],"gallery":[{"asset":"./assets/products/hat-06/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"bag-01","group":"catalog","asset":"./assets/products/bag-01/cover.webp","name":"Forest Everyday Backpack","subtitle":"Forest Green / City Backpack","category":"Bags","type":"backpack","price":59,"swatches":["#10563e"],"colors":[{"id":"color-0","name":"Forest green","hex":"#10563e"}],"sizes":["One Size"],"description":"A practical backpack for commutes, study or travel. Owner-supplied photograph; illustrative THREADS demo price.","tags":["backpack","school","commuter","everyday","rucksack"],"gallery":[{"asset":"./assets/products/bag-01/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"bag-02","group":"catalog","asset":"./assets/products/bag-02/cover.webp","name":"Olive Utility Backpack","subtitle":"Olive / Organizer Backpack","category":"Bags","type":"backpack","price":72,"swatches":["#677f3e"],"colors":[{"id":"color-0","name":"Olive","hex":"#677f3e"}],"sizes":["One Size"],"description":"A practical backpack for commutes, study or travel. Owner-supplied photograph; illustrative THREADS demo price.","tags":["backpack","rucksack","travel","utility","organizer"],"gallery":[{"asset":"./assets/products/bag-02/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"bag-03","group":"catalog","asset":"./assets/products/bag-03/cover.webp","name":"Navy Gold Trek Pack","subtitle":"Navy / Mustard Hiking Backpack","category":"Bags","type":"backpack","price":99,"swatches":["#21375a"],"colors":[{"id":"color-0","name":"Navy","hex":"#21375a"}],"sizes":["One Size"],"description":"A practical backpack for commutes, study or travel. Owner-supplied photograph; illustrative THREADS demo price.","tags":["backpack","hiking","trekking","travel","large","outdoors"],"gallery":[{"asset":"./assets/products/bag-03/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"bag-04","group":"catalog","asset":"./assets/products/bag-04/cover.webp","name":"Mustard City Backpack","subtitle":"Mustard Yellow / Everyday Pack","category":"Bags","type":"backpack","price":58,"swatches":["#d2a218"],"colors":[{"id":"color-0","name":"Mustard","hex":"#d2a218"}],"sizes":["One Size"],"description":"A practical backpack for commutes, study or travel. Owner-supplied photograph; illustrative THREADS demo price.","tags":["backpack","school","daypack","casual","canvas"],"gallery":[{"asset":"./assets/products/bag-04/cover.webp","label":"Owner-supplied front cover view"}]},
  {"id":"bag-05","group":"catalog","asset":"./assets/products/bag-05/cover.webp","name":"Burgundy Weekender Duffel","subtitle":"Burgundy / Travel Holdall","category":"Bags","type":"duffel","price":74,"swatches":["#a5424c"],"colors":[{"id":"color-0","name":"Burgundy","hex":"#a5424c"}],"sizes":["One Size"],"description":"An easy-carry duffel for weekend travel or gym essentials. Owner-supplied photograph; illustrative THREADS demo price.","tags":["bag","duffel","weekender","travel","holdall","overnight"],"gallery":[{"asset":"./assets/products/bag-05/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"bag-06","group":"catalog","asset":"./assets/products/bag-06/cover.webp","name":"Graphite Travel Duffel","subtitle":"Graphite Grey / Travel Holdall","category":"Bags","type":"duffel","price":79,"swatches":["#777a77"],"colors":[{"id":"color-0","name":"Graphite grey","hex":"#777a77"}],"sizes":["One Size"],"description":"An easy-carry duffel for weekend travel or gym essentials. Owner-supplied photograph; illustrative THREADS demo price.","tags":["bag","duffel","gym","weekender","travel","charcoal"],"gallery":[{"asset":"./assets/products/bag-06/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"bag-07","group":"catalog","asset":"./assets/products/bag-07/cover.webp","name":"Cobalt Campus Duffel","subtitle":"Royal Blue / Athletic Holdall","category":"Bags","type":"duffel","price":62,"swatches":["#2866ae"],"colors":[{"id":"color-0","name":"Royal blue","hex":"#2866ae"}],"sizes":["One Size"],"description":"An easy-carry duffel for weekend travel or gym essentials. Owner-supplied photograph; illustrative THREADS demo price.","tags":["bag","duffel","gym","campus","training","weekend"],"gallery":[{"asset":"./assets/products/bag-07/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-01","group":"catalog","asset":"./assets/products/acc-01/cover.webp","name":"Amber Utility Webbing Belt","subtitle":"Amber Orange / Clip Buckle","category":"Accessories","type":"belt","price":22,"swatches":["#d85e1f"],"colors":[{"id":"color-0","name":"Amber orange","hex":"#d85e1f"}],"sizes":["One Size"],"description":"A durable-look adjustable webbing belt with clip closure. Owner-supplied photograph; illustrative THREADS demo price.","tags":["belt","webbing","orange","buckle","utility","waist"],"gallery":[{"asset":"./assets/products/acc-01/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-02","group":"catalog","asset":"./assets/products/acc-02/cover.webp","name":"Lagoon Utility Webbing Belt","subtitle":"Lagoon Blue / Clip Buckle","category":"Accessories","type":"belt","price":24,"swatches":["#5295a8"],"colors":[{"id":"color-0","name":"Lagoon blue","hex":"#5295a8"}],"sizes":["One Size"],"description":"A durable-look adjustable webbing belt with clip closure. Owner-supplied photograph; illustrative THREADS demo price.","tags":["belt","webbing","blue","buckle","utility","waist"],"gallery":[{"asset":"./assets/products/acc-02/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-03","group":"catalog","asset":"./assets/products/acc-03/cover.webp","name":"Navy Active Watch","subtitle":"Navy / Orange Dial","category":"Accessories","type":"watch","price":89,"swatches":["#263a59"],"colors":[{"id":"color-0","name":"Navy","hex":"#263a59"}],"sizes":["One Size"],"description":"A sporty digital-style wristwatch with a bright contrasting dial. Owner-supplied photograph; illustrative THREADS demo price.","tags":["watch","smartwatch","wearable","blue","sport","orange","dial"],"gallery":[{"asset":"./assets/products/acc-03/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-04","group":"catalog","asset":"./assets/products/acc-04/cover.webp","name":"Olive Insulated Bottle","subtitle":"Olive Green / Steel Bottle","category":"Accessories","type":"bottle","price":24,"swatches":["#5c6a46"],"colors":[{"id":"color-0","name":"Olive green","hex":"#5c6a46"}],"sizes":["One Size"],"description":"A reusable water bottle with a minimal everyday silhouette. Owner-supplied photograph; illustrative THREADS demo price.","tags":["bottle","flask","water","hydration","thermos","insulated"],"gallery":[{"asset":"./assets/products/acc-04/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-05","group":"catalog","asset":"./assets/products/acc-05/cover.webp","name":"Onyx THREADS Bottle","subtitle":"Matte Black / Steel Bottle","category":"Accessories","type":"bottle","price":27,"swatches":["#232628"],"colors":[{"id":"color-0","name":"Matte black","hex":"#232628"}],"sizes":["One Size"],"description":"A reusable water bottle with a minimal everyday silhouette. Owner-supplied photograph; illustrative THREADS demo price.","tags":["bottle","flask","water","insulated","black","threads"],"gallery":[{"asset":"./assets/products/acc-05/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-06","group":"catalog","asset":"./assets/products/acc-06/cover.webp","name":"Steel THREADS Bottle","subtitle":"Brushed Silver / Steel Bottle","category":"Accessories","type":"bottle","price":29,"swatches":["#aaaead"],"colors":[{"id":"color-0","name":"Steel","hex":"#aaaead"}],"sizes":["One Size"],"description":"A reusable water bottle with a minimal everyday silhouette. Owner-supplied photograph; illustrative THREADS demo price.","tags":["bottle","flask","silver","water","insulated","stainless","steel"],"gallery":[{"asset":"./assets/products/acc-06/cover.webp","label":"Owner-supplied cover view"}]},
  {"id":"acc-07","group":"catalog","asset":"./assets/products/acc-07/cover.webp","name":"Ochre Active Watch","subtitle":"Ochre Yellow / Blue Dial","category":"Accessories","type":"watch","price":92,"swatches":["#957423"],"colors":[{"id":"color-0","name":"Ochre","hex":"#957423"}],"sizes":["One Size"],"description":"A sporty digital-style wristwatch with a bright contrasting dial. Owner-supplied photograph; illustrative THREADS demo price.","tags":["watch","smartwatch","wearable","mustard","yellow","sport"],"gallery":[{"asset":"./assets/products/acc-07/cover.webp","label":"Owner-supplied cover view"}]},
];
// Primary merchandising filters; the existing homepage retains its approved sections.
export const catalogFilters = Object.freeze([
  {id:'All', label:'All Products'},
  {id:'Sneakers', label:'Shoes / Sneakers'},
  {id:'Bags', label:'Backpacks / Bags'},
  {id:'Accessories', label:'Accessories'}
]);
export const merchandisingCategory = product =>
  product.type==='cap'||product.category==='Hats' ? 'Accessories' : product.category;
export const normalizeCatalogCategory = category =>
  category==='Hats'||category==='Caps' ? 'Accessories' : category;
// Batch 2: mapped strictly to authenticated owner collage cutouts, not synthetic views.
// Gallery paths are kept independent of the product cover image for future T02 overlays.
export const galleryAssetManifest = Object.freeze({
  "f3": ["front","side","angled"],
  "f4": ["front","profile","side","angled"],
  "acc-01": [
    "front",
    "angled",
    "profile",
    "side"
  ],
  "acc-02": [
    "front",
    "angled",
    "profile",
    "side"
  ],
  "acc-03": [
    "front",
    "profile",
    "side"
  ],
  "acc-04": [
    "front",
    "back",
    "open"
  ],
  "acc-05": [
    "front",
    "back",
    "open"
  ],
  "acc-06": [
    "front",
    "back",
    "open"
  ],
  "acc-07": [
    "front",
    "profile",
    "side"
  ],
  "bag-01": [
    "front",
    "side",
    "angled"
  ],
  "bag-02": [
    "front",
    "side",
    "angled"
  ],
  "bag-03": [
    "front",
    "angled",
    "side"
  ],
  "bag-04": [
    "side",
    "angled"
  ],
  "bag-05": [
    "front",
    "side",
    "angled"
  ],
  "bag-06": [
    "front",
    "angled",
    "side"
  ],
  "bag-07": [
    "front",
    "angled",
    "side"
  ],
  "f2": [
    "front",
    "profile",
    "rear"
  ],
  "hat-01": [
    "front",
    "profile",
    "rear"
  ],
  "hat-02": [
    "front",
    "angled",
    "profile",
    "rear"
  ],
  "hat-03": [
    "front",
    "angled",
    "profile",
    "rear"
  ],
  "hat-04": [
    "front",
    "profile",
    "rear"
  ],
  "hat-05": [
    "front",
    "angled",
    "profile",
    "rear"
  ],
  "hat-06": [
    "front",
    "angled",
    "profile",
    "rear"
  ],
  "n1": [
    "angled",
    "rear",
    "action"
  ],
  "n2": [
    "angled",
    "rear",
    "action"
  ],
  "n3": [
    "angled",
    "rear",
    "action"
  ],
  "n4": [
    "angled",
    "rear",
    "action"
  ],
  "n5": [
    "angled",
    "rear",
    "action"
  ],
  "n6": [
    "angled",
    "rear",
    "action"
  ],
  "sho-01": [
    "angled",
    "rear",
    "action"
  ],
  "sho-02": [
    "angled",
    "rear",
    "action"
  ],
  "sho-03": [
    "angled",
    "rear",
    "action"
  ],
  "sho-04": [
    "angled",
    "back",
    "action"
  ],
  "sho-05": [
    "angled",
    "rear",
    "action"
  ],
  "sho-06": [
    "angled",
    "rear",
    "action"
  ],
  "sho-07": [
    "angled",
    "rear",
    "action"
  ],
  "sho-08": [
    "angled",
    "rear",
    "action"
  ],
  "sho-09": [
    "angled",
    "rear",
    "action"
  ]
});
const galleryViewLabels = Object.freeze({"front":"Front view","angled":"Three-quarter angle","profile":"Side profile","rear":"Rear view","side":"Side view","back":"Back view","open":"Open-cap view","action":"Alternative action angle"});
for (const product of catalog) {
  const views=galleryAssetManifest[product.id];
  if(!views) continue;
  product.gallery=[
    {asset:product.asset,label:product.id==='sho-04'?'Side profile':'Catalog cover image'},
    ...views.map(view=>({asset:'./assets/products/'+product.id+'/'+view+'.webp',label:galleryViewLabels[view]}))
  ];
}

export function productGallery(product) {
  // Display only real owner-provided camera angles; never magnify one image into fake views.
  if (Array.isArray(product.gallery) && product.gallery.length)
    return product.gallery.filter(x=>x&&x.asset&&x.label).map(x=>({
      asset:x.asset, label:x.label, crop:0, isAlternate:x.asset!==product.asset
    }));
  return [{asset:product.asset,label:'Catalog cover image',crop:0,isAlternate:false}];
}
// Deterministic category -> subtype -> A-Z merchandising, also for filtered Shop.
export const categoryOrder = Object.freeze(['Sneakers','Bags','Accessories']);
export const subtypeOrder = Object.freeze({
  Sneakers:['sneaker'],
  Bags:['backpack','duffel'],
  Accessories:['cap','belt','bottle','watch','headphones']
});
export function catalogProductType(product){
 if(product.type)return product.type;
 if(product.category==='Sneakers')return 'sneaker';
 if(product.id==='f3')return 'duffel';
 if(product.id==='f4')return 'headphones';
 if(product.category==='Bags')return 'backpack';
 return 'accessory';
}
export function curateShopProducts(products){
 const index=(order,value)=>{const n=order?.indexOf(value)??-1;return n<0?999:n};
 return [...products].sort((a,b)=>{
  const ca=merchandisingCategory(a),cb=merchandisingCategory(b);
  return index(categoryOrder,ca)-index(categoryOrder,cb) ||
    index(subtypeOrder[ca],catalogProductType(a))-index(subtypeOrder[cb],catalogProductType(b)) ||
    a.name.localeCompare(b.name,'en',{sensitivity:'base'}) ||
    a.id.localeCompare(b.id);
 });
}
export const catalogById = Object.freeze(Object.fromEntries(catalog.map(product=>[product.id, product])));
export const imageUrl = product => '/'+(product.asset || product.fallback || '').replace(/^\.\//,'');
export const priceTk=moneyUSD; // Compatibility name; all amounts are native USD, never BDT.
export const priceUSD=moneyUSD;
export const safeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sneakerIds = new Set(['n1','n2','n3','n4','n5','n6']);
const vintageIds = new Set(['n2','n3','n4','n6']);
export const productMeta = product => ({
  id:product.id,
  description: product.description || (product.category==='Sneakers'
    ? 'Comfortable everyday sneaker with a distinctive silhouette, created for movement and casual styling. Illustrative THREADS demo product.'
    : product.category==='Bags'
      ? 'A practical everyday travel companion with a standout finish. Illustrative THREADS demo product.'
      : 'Everyday accessory with a clean, versatile finish. Illustrative THREADS demo product.'),
  colors: Array.isArray(product.colors)&&product.colors.length ? product.colors : product.swatches.map((hex,i)=>({id:'color-'+i,name:({
    f2:['Yellow','Navy','Cream'],f3:['Orange','Black','Sand'],
    f4:['Black','Slate','Ivory'],n1:['Aqua','Coral','Lime'],n2:['Crimson','Black','Ivory'],
    n3:['Amber','Black','White'],n4:['Orange','Black','Cream'],n5:['Lime','Graphite','Ivory'],
    n6:['Black','Teal','Grey']
  })[product.id]?.[i]||'Color '+(i+1),hex})),
  sizes: Array.isArray(product.sizes)&&product.sizes.length ? product.sizes : product.category==='Sneakers' ? [38,39,40,41,42,43].map(n=>String(n)) : ['One Size'],
  status: product.group==='arrival'?'New Arrival':product.group==='catalog'?'Collection':'Featured',
  keywords: [
    product.category==='Sneakers'?'sneaker sneakers shoes trainers running footwear':'',
    product.category==='Bags'?'bag bags travel': '',
    product.type==='backpack'?'backpack backpacks rucksack daypack':'',
    product.type==='duffel'||product.id==='f3'?'duffel weekender luggage':'',
    merchandisingCategory(product)==='Accessories'?'accessories accessory':'',
    catalogProductType(product)==='cap'?'cap caps hat hats headwear baseball':'',
    product.id==='f4'?'headphones audio earphones':'',
    vintageIds.has(product.id)?'vintage retro classic heritage inspired sneakers':'',
    product.group==='arrival'?'new arrivals new':'',
    ...(Array.isArray(product.tags)?product.tags:[])
  ].join(' ')
});
export function searchCatalog(query='',category=''){
  const tokens=String(query).toLowerCase().trim().split(/\s+/).filter(Boolean).map(t=>t.endsWith('s')&&t.length>4?t.slice(0,-1):t);
  return curateShopProducts(catalog.filter(p=>{
    if(category && category!=='All' && merchandisingCategory(p).toLowerCase()!==normalizeCatalogCategory(category).toLowerCase())return false;
    const hay=(p.name+' '+p.subtitle+' '+merchandisingCategory(p)+' '+productMeta(p).keywords).toLowerCase();
    return tokens.every(token=>hay.includes(token));
  }));
}
