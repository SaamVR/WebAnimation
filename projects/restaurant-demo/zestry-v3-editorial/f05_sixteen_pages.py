"""ZESTRY F05: four dishes per category, one photographed dish per book leaf.

Only patches the customer interface and sample menu catalog. The original F05
dotLottie artwork and controller archive are unchanged.
"""
import re
import urllib.request

PHOTO_SOURCES = {
    # Unsplash License: https://unsplash.com/license. Individual photographer pages
    # are retained as source evidence in F05_SIXTEEN_PAGE_REVIEW.md.
    "greek.jpg": "photo-1778449532114-430396ada55b",
    "beet.jpg": "photo-1765100022784-5e72b418d34b",
    "caesar.jpg": "photo-1746211108786-ca20c8f80ecd",
    "chicken_bowl.jpg": "photo-1771384552858-feb0574f958d",
    "chicken_sandwich.jpg": "photo-1685381918549-6bbc1f2503de",
    "brownie.jpg": "photo-1777647364657-2319b02095de",
    "tiramisu.jpg": "photo-1768225385872-03945d45a0d3",
    "cheesecake.jpg": "photo-1763161693167-d5c117505cde",
    "matcha.jpg": "photo-1751563721808-3b81940b88f7",
    "smoothie.jpg": "photo-1643470758221-45463a3d210a",
}

# The original six catalog IDs and sample prices are retained. IDs 10-19
# represent additional fictitious demo-only dishes, not a real restaurant menu.
MENU = {
    "Starters": [
        dict(id=2,name="Garden Crunch Salad",price=13,photo="salad.jpg"),
        dict(id=10,name="Greek Feta Salad",price=14,photo="greek.jpg"),
        dict(id=11,name="Roasted Beet Salad",price=15,photo="beet.jpg"),
        dict(id=12,name="Classic Caesar Salad",price=14,photo="caesar.jpg"),
    ],
    "Main_Courses": [
        dict(id=3,name="Basil Pesto Farfalle",price=19,photo="pasta.jpg"),
        dict(id=4,name="The ZESTRY Smash",price=18,photo="burger.jpg"),
        dict(id=13,name="Sweet Chili Salmon Rice Bowl",price=22,photo="chicken_bowl.jpg"),
        dict(id=14,name="Crispy Chicken Sandwich",price=19,photo="chicken_sandwich.jpg"),
    ],
    "Desserts": [
        dict(id=6,name="Chocolate Cloud Cake",price=11,photo="cake.jpg"),
        dict(id=15,name="Chocolate Fudge Brownie",price=10,photo="brownie.jpg"),
        dict(id=16,name="Cafe Tiramisu",price=12,photo="tiramisu.jpg"),
        dict(id=17,name="Strawberry Cheesecake",price=12,photo="cheesecake.jpg"),
    ],
    "Drinks": [
        dict(id=7,name="Honey Oat Latte",price=6,photo="coffee.jpg"),
        dict(id=8,name="Citrus Cooler",price=7,photo="lemonade.jpg"),
        dict(id=18,name="Iced Matcha Latte",price=8,photo="matcha.jpg"),
        dict(id=19,name="Blackberry Smoothie",price=9,photo="smoothie.jpg"),
    ],
}

import json

STYLES = r"""
/* F05 SIXTEEN-PAGE EDITORIAL OVERRIDE: single photo per real book leaf. */
.photos,.photos.single{
  left:51.7%;top:37.2%;width:21.4%;height:30.6%;display:none;
  grid-template-columns:1fr;gap:0;perspective:900px;align-items:stretch;
}
.photos.visible,.photos.single.visible{display:grid}
.photos.turning .dish{animation:f05leaf .24s ease-in both;transform-origin:left center}
@keyframes f05leaf{
  0%{transform:rotateY(0deg);opacity:1}
  50%{transform:rotateY(-14deg);opacity:.58}
  100%{transform:rotateY(0deg);opacity:1}
}
.dish{
  min-height:0;height:100%;width:100%;display:grid;
  grid-template-rows:minmax(0,1fr) auto auto;
  gap:clamp(3px,.45vw,7px);padding:clamp(5px,.55vw,10px);
  border-radius:7px;background:#fffaf0;box-shadow:0 3px 12px #64391514;
}
.dish img{height:100%;min-height:0;width:100%;object-fit:cover;border-radius:5px}
.dish .name{
  display:block;align-content:center;min-height:0;
  font:700 clamp(15px,1.65vw,24px)/1.1 Georgia,serif;
  text-align:left;overflow-wrap:anywhere;color:#173d2b;
}
.dish .price{
  display:block;font:800 clamp(15px,1.35vw,21px)/1.2 system-ui,Arial;
  color:#a92c31;text-align:left;
}
.dish .price small{font-size:.7em;font-weight:600;white-space:nowrap;color:#385144}
.book-page-index{
  position:absolute;right:10px;top:8px;bottom:auto;color:#385144;background:#fffaf1;padding:3px 7px;border-radius:6px;
  font:700 clamp(12px,1vw,16px)/1.1 system-ui,Arial;
  letter-spacing:.08em;pointer-events:none;
}
@media(max-width:700px){
 .photos,.photos.single{left:51.6%;top:37.5%;width:22%;height:30.2%}
 .dish{padding:4px;gap:3px}
 .dish .name{font-size:clamp(13px,3.55vw,18px);line-height:1.07}
 .dish .price{font-size:clamp(13px,3.2vw,17px)}
 .book-page-index{top:6px;bottom:auto;font-size:11px}
}
@media(prefers-reduced-motion:reduce){.photos.turning .dish{animation:none}}
"""

JS = r"""
const menuPhotos=__MENU_DATA__;
let currentPage=0,visibleCategory=null,pendingPreviousLast=false,turnLocked=false;
const CATS=['Starters','Main_Courses','Desserts','Drinks'];
const bookBox=document.getElementById('f05-photos');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function drawDish(){
 const category=visibleCategory;
 const food=category?menuPhotos[category][currentPage]:null;
 bookBox.replaceChildren();
 bookBox.className='photos'+(food?' visible single':'');
 if(!food)return;
 const btn=document.createElement('button');
 btn.type='button';btn.className='dish';
 btn.setAttribute('aria-label','Add '+food.name+' to demo bag for $'+food.price);
 const img=document.createElement('img');
 img.src='photos/'+food.photo;img.alt=food.name;
 img.decoding='async';
 const name=document.createElement('span');name.className='name';name.textContent=food.name;
 const price=document.createElement('span');price.className='price';price.append('$'+food.price);
 const add=document.createElement('small');add.textContent=' · Add to bag +';price.append(add);
 btn.append(img,name,price);
 btn.addEventListener('click',()=>parent.postMessage({type:'zestry:book-add',itemId:food.id},location.origin));
 const count=document.createElement('span');count.className='book-page-index';
 count.setAttribute('aria-label','Page '+(currentPage+1)+' of 4');
 count.textContent=String(currentPage+1).padStart(2,'0')+' / 04';
 bookBox.append(btn,count);
 document.getElementById('book-hint').textContent=
   category.replaceAll('_',' ')+' · '+food.name+' · page '+(currentPage+1)+' of 4';
 document.getElementById('state').textContent=category.replaceAll('_',' ')+
   ', '+food.name+', $'+food.price+', page '+(currentPage+1)+' of 4';
 const coming=menuPhotos[category][currentPage+1];
 if(coming){const next=new Image();next.src='photos/'+coming.photo;}
}
function moveDish(delta){
 if(turnLocked||!visibleCategory)return false;
 const target=currentPage+delta;
 if(target<0||target>=4)return false;
 turnLocked=true;currentPage=target;
 drawDish();
 if(!reduceMotion.matches){
   bookBox.classList.add('turning');
   setTimeout(()=>{bookBox.classList.remove('turning');turnLocked=false;},250);
 }else{turnLocked=false;}
 return true;
}
window.__f05Update=(state)=>{
 document.body.dataset.f05State=state;
 document.body.dataset.f05Busy=String(!['Closed','Overview',...CATS].includes(state));
 if(CATS.includes(state)){
   if(state!==visibleCategory){
     currentPage=pendingPreviousLast?3:0;pendingPreviousLast=false;
   }
   visibleCategory=state;drawDish();
 }else{
   visibleCategory=null;pendingPreviousLast=false;
   bookBox.replaceChildren();bookBox.className='photos';
   document.getElementById('book-hint').textContent=
     state==='Closed'?'Tap the cover to open':
     state==='Overview'?'Choose one of the four categories':'Turning the page…';
   document.getElementById('state').textContent=state.replaceAll('_',' ');
 }
};
function bookNavigation(event){
 if(!window.F05_QA)return;
 if(event==='next'||event==='previous'){
   if(visibleCategory){
     if(turnLocked)return;
     const delta=event==='next'?1:-1;
     if(moveDish(delta))return;
     if(delta<0)pendingPreviousLast=true;
   }
 }
 if(event==='home'||event==='close')pendingPreviousLast=false;
 window.F05_QA.fire(event);
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('button[data-event]');
 if(!btn)return;
 e.preventDefault();bookNavigation(btn.dataset.event);
});
document.addEventListener('keydown',e=>{
 if(e.target.closest('input,textarea,[contenteditable]')||!visibleCategory||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
   e.preventDefault();bookNavigation(e.key==='ArrowRight'?'next':'previous');
 }
});
"""

def upgrade_book(html):
    if "F05 SIXTEEN-PAGE EDITORIAL OVERRIDE" in html:
        return html
    start = html.index("const menuPhotos={")
    end = html.index("</script><script>", start)
    assert "window.__f05Update" in html[start:end], "F05 runtime interface changed"
    html = html[:start] + JS.replace("__MENU_DATA__",json.dumps(MENU,ensure_ascii=False,separators=(',',':'))) + html[end:]
    assert html.count("</style>")==1
    html = html.replace("</style>",STYLES+"</style>",1)
    assert html.count("const menuPhotos=")==1 and "function frameLoop" in html
    return html

def upgrade_index(index_bytes):
    s = index_bytes.decode("utf-8")
    if "ZESTRY_F05_16_CATALOG" in s:
        return index_bytes
    assert "zestry:book-add" in s and "items.some(x=>x.id===id)" in s
    extras = [x for cat in MENU.values() for x in cat if x["id"]>=10]
    # Supply both normalized and legacy aliases so existing cart/order renderers
    # can use the same shared items array as the six original entries.
    extra_data = []
    for item in extras:
        d=dict(item)
        d.update(n=item["name"],p=item["price"],cat=next(k.replace('_',' ') for k,v in MENU.items() if item in v),
                 category=next(k.replace('_',' ') for k,v in MENU.items() if item in v),
                 image=item["photo"],img=item["photo"],description="ZESTRY sample menu item")
        extra_data.append(d)
    marker="window.addEventListener('message',e=>{const book="
    assert s.count(marker)==1, "F05 add-to-bag handler changed"
    s=s.replace('Strawberry Cloud Cake','Chocolate Cloud Cake')
    injection="/* ZESTRY_F05_16_CATALOG (demo data) */\nitems.push(..."+json.dumps(extra_data,separators=(',',':'))+");\n"
    return s.replace(marker,injection+marker,1).encode("utf-8")

def install_photos(files):
    for filename,photo_id in PHOTO_SOURCES.items():
        key="assets/photos/"+filename
        if key in files:continue
        url="https://images.unsplash.com/"+photo_id+"?fit=crop&w=900&h=1000&q=76&fm=jpg"
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 ZESTRY-Demo-Asset-Bundler"})
        try:
            with urllib.request.urlopen(req,timeout=25) as response:
                data=response.read(2_000_001)
        except Exception as exc:
            raise RuntimeError("Unable to bundle licensed menu photo: "+filename+" from "+url) from exc
        if not data.startswith(b"\xff\xd8") or not 8_000<len(data)<2_000_001:
            raise ValueError("Non-JPEG or unexpected image size: "+filename)
        files[key]=data
    assert all("assets/photos/"+f in files for f in PHOTO_SOURCES)
    return files

def validate_menu():
    assert list(MENU)==["Starters","Main_Courses","Desserts","Drinks"]
    assert all(len(v)==4 for v in MENU.values())
    assert len({x["id"] for v in MENU.values() for x in v})==16
    assert len({x["photo"] for v in MENU.values() for x in v})==16
    assert all(x["price"]>0 for v in MENU.values() for x in v)
    return True

if __name__=="__main__":
    validate_menu()
    print("F05 sample catalog: 4 categories; 4 distinct dishes each; 16 distinct photographs")
