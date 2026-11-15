"use strict";
/* ZESTRY — independent restaurant concept. No network booking, payments or order submission. */
const DISHES = [
  {id:"pancakes",category:"Breakfast",name:"Brioche Pancake Stack",price:16,desc:"Fluffy griddled pancakes, seasonal berries and warm maple syrup.",tags:"Vegetarian",photo:"pancakes.jpg"},
  {id:"toast",category:"Breakfast",name:"Avocado Morning Toast",price:14,desc:"Sourdough toast, ripe avocado, lemon and chili flakes.",tags:"Vegetarian",photo:"toast.jpg"},
  {id:"salad",category:"Starters",name:"Garden Crunch Salad",price:13,desc:"Crisp greens, ripe tomatoes, cucumber and bright citrus dressing.",tags:"Vegetarian",photo:"salad.jpg"},
  {id:"pasta",category:"Mains",name:"Basil Pesto Farfalle",price:19,desc:"Farfalle tossed with bright basil pesto and sweet cherry tomatoes.",tags:"House favorite",photo:"pasta.jpg"},
  {id:"burger",category:"Mains",name:"The Zestry Smash",price:18,desc:"Beef patty, melty cheese, greens and tangy house sauce.",tags:"Best seller",photo:"burger.jpg"},
  {id:"brunch",category:"Mains",name:"Brunch on Toast",price:17,desc:"Golden toasted bread, savory toppings and fresh greens.",tags:"All-day favorite",photo:"toast.jpg"},
  {id:"cake",category:"Desserts",name:"Strawberry Cloud Cake",price:11,desc:"Soft vanilla sponge, whipped cream and strawberries.",tags:"Something sweet",photo:"cake.jpg"},
  {id:"latte",category:"Drinks",name:"Honey Oat Latte",price:6,desc:"Double espresso, silky oat milk and a touch of honey.",tags:"Coffee",photo:"coffee.jpg"},
  {id:"cooler",category:"Drinks",name:"Citrus Cooler",price:7,desc:"Bright citrus, sparkling water and fresh mint.",tags:"Refreshing",photo:"lemonade.jpg"}
];
const CATEGORIES=["All","Breakfast","Starters","Mains","Desserts","Drinks"];
const el=id=>document.getElementById(id);
const money=value=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const prefersLessMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let filter="All", activeDialog=null, previousFocus=null, toastTimer=null, animationRuntime=null;
const storeKey="zestry-demo-cart-v1";
let cart={};
try{const parsed=JSON.parse(localStorage.getItem(storeKey)||"{}");if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){for(const [id,qty] of Object.entries(parsed)){if(DISHES.some(d=>d.id===id)&&Number.isInteger(qty)&&qty>0&&qty<100)cart[id]=qty;}}}catch{}
function saveCart(){try{localStorage.setItem(storeKey,JSON.stringify(cart));}catch{}}
function dishById(id){return DISHES.find(x=>x.id===id);}
function cartTotal(){return DISHES.reduce((total,d)=>total+(cart[d.id]||0)*d.price,0);}
function cartCount(){return Object.values(cart).reduce((a,b)=>a+b,0);}
function notify(message){const t=el("toast");t.textContent=message;t.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("visible"),2800);}
function renderCategories(){el("category-pills").innerHTML=CATEGORIES.map(c=>'<button type="button" data-filter="'+c+'" aria-pressed="'+(c===filter)+'">'+c+'</button>').join("");}
function renderMenu(){
  const visible=filter==="All"?DISHES:DISHES.filter(d=>d.category===filter);
  el("menu-grid").innerHTML=visible.map(d=>'<article class="food-card"><div class="food-photo"><img src="assets/photos/'+d.photo+'" alt="'+d.name+'" loading="lazy" width="800" height="600"><span class="food-category">'+d.category+'</span></div><div class="food-body"><div class="food-head"><h3>'+d.name+'</h3><strong>'+money(d.price)+'</strong></div><p>'+d.desc+'</p><div class="food-bottom"><span class="food-tags">✳ '+d.tags+'</span><button class="add-button" type="button" data-add="'+d.id+'" aria-label="Add '+d.name+' to order">Add +</button></div></div></article>').join("");
}
function selectCategory(value){if(!CATEGORIES.includes(value))return;filter=value;renderCategories();renderMenu();}
function updateCart(){
  el("cart-count").textContent=cartCount();
  const rows=DISHES.filter(d=>cart[d.id]).map(d=>'<div class="cart-row"><img src="assets/photos/'+d.photo+'" alt="" width="75" height="75"><div><h3>'+d.name+'</h3><div class="cart-price">'+money(d.price*(cart[d.id]||0))+'</div><div class="cart-controls"><button type="button" data-qty="'+d.id+'" data-delta="-1" aria-label="Remove one '+d.name+'">−</button><strong>'+cart[d.id]+'</strong><button type="button" data-qty="'+d.id+'" data-delta="1" aria-label="Add one '+d.name+'">+</button><button class="remove-item" type="button" data-remove="'+d.id+'">Remove</button></div></div></div>');
  el("cart-items").innerHTML=rows.length?rows.join(""):'<div class="cart-empty"><span>✳</span><strong>Your basket looks hungry.</strong><p>Add something delicious from the menu.</p></div>';
  el("cart-subtotal").textContent=money(cartTotal());
  el("checkout-open").disabled=cartCount()===0;
}
function modifyCart(id,delta){if(!dishById(id))return;const n=(cart[id]||0)+delta;if(n<=0)delete cart[id];else cart[id]=Math.min(n,99);saveCart();updateCart();}
function addDish(id){const d=dishById(id);if(!d)return;modifyCart(id,1);notify(d.name+" added to your order");}
const dialogs={"cart":el("cart-drawer"),"checkout":el("checkout-modal"),"confirm":el("confirm-modal"),"book":el("book-modal")};
function openDialog(name){
  if(!dialogs[name])return;
  previousFocus=document.activeElement;
  Object.entries(dialogs).forEach(([k,node])=>{node.classList.toggle("open",k===name);node.setAttribute("aria-hidden",String(k!==name));});
  activeDialog=name;el("overlay-backdrop").hidden=false;document.body.classList.add("modal-open");
  requestAnimationFrame(()=>el("overlay-backdrop").classList.add("open"));
  const focusTarget=dialogs[name].querySelector('[data-close]')||dialogs[name];focusTarget.focus?.();
}
function closeDialogs(){
  Object.values(dialogs).forEach(node=>{node.classList.remove("open");node.setAttribute("aria-hidden","true");});
  el("overlay-backdrop").classList.remove("open");
  document.body.classList.remove("modal-open");
  activeDialog=null;
  setTimeout(()=>{if(!activeDialog)el("overlay-backdrop").hidden=true;},300);
  if(previousFocus?.isConnected)previousFocus.focus?.();
}
function showConfirmation(kind,message){
  el("confirm-kicker").textContent=kind==="order"?"YOUR ORDER, IN MOTION":"YOUR TABLE, IN MOTION";
  el("confirm-title").innerHTML=kind==="order"?"Something <em>delicious.</em>":"See you at <em>the table.</em>";
  el("confirm-message").textContent=message;
  const host=el("confirm-lottie");
  if(host._lottie){host._lottie.destroy();delete host._lottie;}
  delete host.dataset.motionStatus;host.classList.remove("static-preview");host.innerHTML="";
  host.setAttribute("data-lottie",kind==="order"?"f04":"f07");
  openDialog("confirm");loadMotion(host);
}
function setupForms(){
  const date=el("res-date");const today=new Date();const localDay=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);date.min=localDay;date.value=localDay;
  el("reservation-form").addEventListener("submit",e=>{
    e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
    const name=el("res-name").value.trim();if(!name)return;
    const day=el("res-date").value,time=el("res-time").value,party=Number(el("res-party").value);
    if(day<localDay||!time||party<1||party>8){notify("Choose a valid date, time and party size.");return;}
    const formatted=new Date(day+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"long",day:"numeric"});
    showConfirmation("reservation",name+", your demo table for "+party+" on "+formatted+" at "+time+" is ready for preview. No real reservation was made.");
  });
  el("checkout-form").addEventListener("submit",e=>{
    e.preventDefault();const form=e.currentTarget;if(!form.reportValidity()||cartCount()===0)return;
    const name=el("checkout-name").value.trim(),pickup=el("checkout-pickup").value,total=cartTotal();if(!name)return;
    cart={};saveCart();updateCart();form.reset();
    showConfirmation("order","Thanks, "+name+"! Your "+money(total)+" sample order is shown as confirmed for "+pickup.toLowerCase()+". No food or payment has been requested.");
  });
}
function categoryJump(value){selectCategory(value);el("menu").scrollIntoView({behavior:prefersLessMotion?"auto":"smooth"});}
function setupEvents(){
  el("category-pills").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(b)selectCategory(b.dataset.filter);});
  el("menu-grid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addDish(b.dataset.add);});
  el("open-cart").addEventListener("click",()=>openDialog("cart"));el("footer-order").addEventListener("click",()=>openDialog("cart"));
  el("cart-items").addEventListener("click",e=>{const b=e.target.closest("[data-remove],[data-qty]");if(!b)return;if(b.dataset.remove)modifyCart(b.dataset.remove,-999);else if(b.dataset.qty)modifyCart(b.dataset.qty,Number(b.dataset.delta));});
  el("checkout-open").addEventListener("click",()=>{if(cartCount())openDialog("checkout");});
  el("overlay-backdrop").addEventListener("click",closeDialogs);
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeDialogs));
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&activeDialog){closeDialogs();return;}
    if(e.key!=="Tab"||!activeDialog)return;
    const controls=[...dialogs[activeDialog].querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]")].filter(x=>x.getClientRects().length);
    if(!controls.length)return;const first=controls[0],last=controls.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  document.querySelectorAll("[data-category]").forEach(a=>a.addEventListener("click",()=>selectCategory(a.dataset.category)));
  el("mobile-menu").addEventListener("click",()=>{const opened=el("nav-links").classList.toggle("open");el("mobile-menu").setAttribute("aria-expanded",String(opened));});
  el("nav-links").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{el("nav-links").classList.remove("open");el("mobile-menu").setAttribute("aria-expanded","false");}));
  el("open-book-demo").addEventListener("click",()=>{openDialog("book");loadBookExperience();});
}
async function loadBookExperience(){
  const target=el("book-embed");if(target.dataset.loaded)return;target.dataset.loaded="1";
  try{
    const result=await fetch("assets/lottie/f05-interactive.html",{method:"HEAD"});
    if(!result.ok)throw Error("not bundled");
    target.innerHTML='<iframe title="F05 interactive restaurant menu animation" loading="lazy" src="assets/lottie/f05-interactive.html"></iframe>';
  }catch{
    target.innerHTML='<div style="padding:35px;max-width:470px;text-align:center"><div style="font-size:52px;color:#ef5d32">✳</div><h3 style="font:600 29px Fraunces,serif;color:#153f31">Menu book preview</h3><p style="font-size:14px">The original interactive F05 player is a separate artwork deliverable. Its approved file can be added here without changing the functional website.</p><button type="button" class="button button-orange" id="book-browse">Browse the real menu ↗</button></div>';
    el("book-browse").addEventListener("click",()=>{closeDialogs();categoryJump("All");});
  }
}
const MOTION_FILES={"f01":"f01.json","f02":"f02.json","f04":"f04.json","f06-1":"f06-1.json"};
let loaderPromise=null;
function getLottieEngine(){
 if(loaderPromise)return loaderPromise;
 loaderPromise=new Promise((resolve,reject)=>{
  if(window.lottie){resolve(window.lottie);return;}
  const s=document.createElement("script");s.src="assets/vendor/lottie.min.js";s.async=true;s.onload=()=>resolve(window.lottie);s.onerror=()=>reject(Error("Lottie runtime unavailable"));document.head.appendChild(s);
 });return loaderPromise;
}
const STATIC_PREVIEWS={
 "f01":"assets/photos/pasta.jpg","f02":"assets/photos/restaurant.jpg",
 "f03":"assets/lottie/f03-coffee.svg","f04":"assets/photos/pancakes.jpg",
 "f06-1":"assets/lottie/f06-1.svg","f06-2":"assets/lottie/f06-2.svg",
 "f06-3":"assets/lottie/f06-3.svg","f07":"assets/photos/restaurant.jpg",
 "f08":"assets/photos/pasta.jpg"
};
function showStill(host,name,reduced=false){
 host.innerHTML="";
 const src=STATIC_PREVIEWS[name];
 if(src){const still=document.createElement("img");still.className="lottie-still";still.src=src;still.alt=name.toUpperCase()+" static illustration preview";still.loading="lazy";host.appendChild(still);}
 const badge=document.createElement("span");badge.className="still-caption";
 badge.textContent=reduced?"STATIC PREVIEW":name.toUpperCase()+" · ILLUSTRATION PREVIEW";
 host.appendChild(badge);
 host.dataset.motionStatus=reduced?"reduced":"fallback";
 host.classList.add("static-preview");
}
async function loadMotion(host){
 if(["loaded","loading","fallback","reduced"].includes(host.dataset.motionStatus))return;
 const name=host.dataset.lottie,file=MOTION_FILES[name];
 if(!file){showStill(host,name,prefersLessMotion);return;}
 if(prefersLessMotion){showStill(host,name,true);return;}
 host.dataset.motionStatus="loading";
 try{
   const response=await fetch("assets/lottie/"+file,{cache:"force-cache"});
   if(!response.ok)throw Error("Animation file unavailable");
   const data=await response.json();
   if(!data.layers||!data.op)throw Error("Invalid Lottie content");
   const engine=await getLottieEngine();
   host.innerHTML="";host.classList.remove("static-preview");
   const anim=engine.loadAnimation({container:host,renderer:"svg",loop:host.dataset.loop==="true",autoplay:true,animationData:data,rendererSettings:{preserveAspectRatio:"xMidYMid meet",progressiveLoad:true}});
   host.dataset.motionStatus="loaded";host._lottie=anim;
 }catch{
   showStill(host,name);
 }
}
function setupMotion(){
 const spots=[...document.querySelectorAll(".lottie-stage[data-lottie]")].filter(n=>n.id!=="confirm-lottie");
 if(new URLSearchParams(location.search).has("still")){spots.forEach(n=>showStill(n,n.dataset.lottie,true));return;}
 if("IntersectionObserver" in window){
 const io=new IntersectionObserver(entries=>{for(const ent of entries){
   if(ent.isIntersecting){loadMotion(ent.target);ent.target._lottie?.play();}
   else if(ent.target._lottie)ent.target._lottie.pause();
 }},{rootMargin:"120px"});
 spots.forEach(n=>io.observe(n));
 }else spots.forEach(n=>loadMotion(n));
}
renderCategories();renderMenu();updateCart();setupForms();setupEvents();setupMotion();
