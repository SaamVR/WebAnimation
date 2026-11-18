#!/usr/bin/env python3
"""ZESTRY owner recording corrections: F05 leaf turns and page composition,
compact F06 process section, and richer coffee background. Review only.

Patches the exact existing reviewed ZIP instead of redrawing or regenerating
any Lottie artwork. Does not modify reservation modal, F07, Render, THREADS,
CHAPCHITRA or any unrelated site. No deployment.
"""
from __future__ import annotations
import argparse,hashlib,io,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/"review_bundle"
MARK="ZESTRY_F05_OWNER_FLIP_F06_COMPACT_F03_COFFEE_20261119"
MASTERS={
 "assets/lottie/f01.json":"7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
 "assets/lottie/f02-chef-full360.json":"e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa",
 "assets/lottie/f03.json":"136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68",
 "assets/lottie/f07.json":"a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b",
 "assets/f05_book.lottie":"3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645",
}
STYLE=r"""
/* ZESTRY_F05_OWNER_FLIP_F06_COMPACT_F03_COFFEE_20261119
 * Scoped visual corrections from owner's 85s iPad recording.
 * Keep chef, hero, F07 reservation and all authored Lottie paths untouched.
 */
#process.process-section{
 padding-block:clamp(26px,4.2vh,43px) clamp(20px,3.2vh,32px);
}
#process .process-header{margin-bottom:3px;gap:clamp(15px,2.8vw,35px)}
#process .process-visual{width:min(100%,760px);margin-top:0}
#process .process-visual .anim{
 height:clamp(295px,49dvh,445px);
 min-height:0;
 max-height:445px;
}
#process .process-foot{padding-top:13px}
@media(max-width:760px){
 #process.process-section{padding-block:30px 26px}
 #process .process-header{gap:14px}
 #process .process-visual{width:min(100%,690px)}
 #process .process-visual .anim{
  height:clamp(275px,43dvh,385px);min-height:0;max-height:385px
 }
}
@media(max-width:400px){
 #process .process-visual .anim{height:clamp(245px,39dvh,335px)}
}
#coffee.coffee-story{
 background:linear-gradient(110deg,#f6e7d6 0%,#e7c8a6 47%,#cea184 100%);
}
#coffee .coffee-motion{filter:drop-shadow(0 8px 8px rgba(78,42,20,.08))}
@media(prefers-reduced-motion:reduce){
 #coffee .coffee-motion{filter:none}
}
"""
BOOK_STYLES=r"""
/* ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119
 * Entire illustrated right-hand paper leaf turns, not only the photo card.
 * The existing authored 2.7s category flip still runs in the Lottie player.
 */
.photos{isolation:isolate;perspective:1000px}
.photos.f05-departing{pointer-events:none;animation:f05Depart .24s ease-in both}
@keyframes f05Depart{
 from{opacity:1;transform:rotateY(0)}
 to{opacity:0;transform:rotateY(-55deg)}
}
.f05-paper-leaf{
 position:absolute;
 inset:-5px;
 z-index:8;
 transform-origin:0% 50%;
 transform-style:preserve-3d;
 pointer-events:none;
 will-change:transform;
 animation:f05PaperNext .74s cubic-bezier(.22,.62,.29,1) both;
}
.f05-paper-leaf.previous{
 transform-origin:100% 50%;
 animation-name:f05PaperPrev;
}
.f05-paper-face{
 position:absolute;
 inset:0;
 border-radius:3px 9px 9px 3px;
 background:#fffaf0;
 border:1px solid #d6bb86;
 box-shadow:inset 7px 0 12px rgba(101,66,30,.2),8px 6px 14px rgba(80,44,20,.22);
 overflow:hidden;
 backface-visibility:hidden;
}
.f05-paper-face>.dish{height:100%;border:0;border-radius:3px 8px 8px 3px}
.f05-paper-face .book-page-index{z-index:2}
.f05-paper-back{
 transform:rotateY(180deg);
 border-radius:9px 3px 3px 9px;
 background:linear-gradient(90deg,#fff4dd,#fffaf0);
 box-shadow:inset -9px 0 13px rgba(115,79,41,.22);
}
.f05-paper-back:before{
 content:"";
 position:absolute;
 inset:7px;
 border:1px solid rgba(201,167,108,.3);
 border-radius:6px;
}
@keyframes f05PaperNext{
 0%{transform:rotateY(0deg)}
 15%{transform:rotateY(-11deg)}
 50%{transform:rotateY(-89deg)}
 78%{transform:rotateY(-151deg)}
 100%{transform:rotateY(-178deg)}
}
@keyframes f05PaperPrev{
 0%{transform:rotateY(0deg)}
 16%{transform:rotateY(10deg)}
 50%{transform:rotateY(89deg)}
 82%{transform:rotateY(154deg)}
 100%{transform:rotateY(178deg)}
}
@media(prefers-reduced-motion:reduce){
 .f05-paper-leaf,.photos.f05-departing{animation:none}
}
"""
FIT_FIX=r"""
/* ZESTRY_F05_PHOTO_FRAME_CENTER_20261119
 * The 54.05% inherited inset visibly shifted the dish to the outer edge.
 * Preserve exact artwork and photographic dimensions; center inset in paper.
 */
.photos,.photos.single{left:52.75%!important}
@media(max-width:390px){.photos,.photos.single{left:52.75%!important}}
"""
DRAW_OLD="if(['Starters','Main_Courses','Desserts','Drinks'].includes(window.__f05BookState)&&(/^PAGE_(Starters|Main_Courses|Desserts|Drinks)_Food_/.test(l.nm)||l.nm.startsWith('SVG_EXACT__OPEN_Book_Open_Main_Spread_Special_Cake_')))continue;"
DRAW_NEW="if((['Starters','Main_Courses','Desserts','Drinks'].includes(window.__f05BookState)||(window.__f05BookState||'').startsWith('Turn_')||(window.__f05BookState||'').startsWith('Replay_'))&&(/^PAGE_(Starters|Main_Courses|Desserts|Drinks)_Food_/.test(l.nm)||l.nm.startsWith('SVG_EXACT__OPEN_Book_Open_Main_Spread_Special_Cake_')||l.nm.startsWith('SVG_EXACT__OPEN_Book_Open_Main_Spread_Special_Salad_')))continue;"
OLD_MOVE="""function moveDish(delta){
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
}"""
NEW_MOVE=r"""function moveDish(delta){
 if(turnLocked||!visibleCategory)return false;
 const target=currentPage+delta;
 if(target<0||target>=menuPhotos[visibleCategory].length)return false;
 if(reduceMotion.matches){
  currentPage=target;drawDish();return true;
 }
 turnLocked=true;
 const oldDish=bookBox.querySelector('.dish')?.cloneNode(true);
 const oldIndex=bookBox.querySelector('.book-page-index')?.cloneNode(true);
 currentPage=target;
 drawDish();
 const leaf=document.createElement('div');
 leaf.className='f05-paper-leaf'+(delta<0?' previous':'');
 leaf.setAttribute('aria-hidden','true');
 const front=document.createElement('div');
 front.className='f05-paper-face';
 if(oldDish)front.append(oldDish);
 if(oldIndex)front.append(oldIndex);
 const back=document.createElement('div');
 back.className='f05-paper-face f05-paper-back';
 leaf.append(front,back);
 bookBox.append(leaf);
 let done=false;
 function finish(){
  if(done)return;done=true;leaf.remove();turnLocked=false;
 }
 leaf.addEventListener('animationend',finish,{once:true});
 setTimeout(finish,880);
 return true;
}"""
HOOK=r"""
/* Keep old category artwork beneath the beginning of its genuine 2.7s
 * vector page flip, then retire it before the turning leaf crosses center.
 * Also avoid losing last-page intent when returning to a previous category.
 */
const __zestryPriorUpdate=window.__f05Update;
window.__f05Update=(state)=>{
 const wasPreviousLast=pendingPreviousLast;
 const isPageFlip=state.startsWith('Turn_');
 const departing=isPageFlip&&visibleCategory
  ?bookBox.cloneNode(true):null;
 __zestryPriorUpdate(state);
 if(isPageFlip)pendingPreviousLast=wasPreviousLast;
 if(departing&&departing.querySelector('.dish')){
  bookBox.replaceChildren(...Array.from(departing.children));
  bookBox.className='photos visible single f05-departing';
  setTimeout(()=>{
   if(document.body.dataset.f05State===state){
    bookBox.replaceChildren();bookBox.className='photos';
   }
  },260);
 }
};
for(const cat of CATS){
 const food=menuPhotos[cat][0];
 if(!food)continue;
 const image=new Image();
 image.decoding='async';image.src='photos/'+food.photo;
 image.decode?.().catch(()=>{});
}
"""
def replace_once(text,old,new,label):
 assert text.count(old)==1,(label,text.count(old))
 return text.replace(old,new,1)
def patch_site(html):
 assert "ZESTRY_RESERVATION_WIDE_PANEL_20261119" in html
 if MARK in html:
  assert html.count(MARK)==1
  return html
 return replace_once(html,"</style>","\n"+STYLE+"\n</style>","only existing site CSS")
def patch_book(html):
 if "ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119" in html:
  assert html.count("ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119")==1
  return html
 assert "F05 SIXTEEN-PAGE EDITORIAL OVERRIDE" in html
 assert "f05-fit-v8.css" in html and "f05_book.lottie" in html
 html=replace_once(html,DRAW_OLD,DRAW_NEW,"suppress underlying category-food flashes")
 html=replace_once(html,OLD_MOVE,NEW_MOVE,"full paper leaf turning")
 html=replace_once(html,"</style>","\n"+BOOK_STYLES+"\n</style>","F05 paper leaf styling")
 html=replace_once(html,"function bookNavigation(event){",HOOK+"\nfunction bookNavigation(event){","category transition handoff")
 html=replace_once(html,"function bookNavigation(event){\n if(!window.F05_QA)return;",
  "function bookNavigation(event){\n if(!window.F05_QA||turnLocked)return;","lock conflicting taps")
 assert "function drawDish()" in html and "menuPhotos=" in html and "window.F05_QA.fire(event)" in html
 return html
def patch_fit(css):
 if "ZESTRY_F05_PHOTO_FRAME_CENTER_20261119" in css:return css
 assert "left:54.05%!important" in css
 return css+"\n"+FIT_FIX
def patch(check=False):
 parts=sorted(BUNDLE.glob("part-*.bin"))
 assert len(parts)>8,"Expected split current ZESTRY review ZIP"
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  members={info.filename:z.read(info.filename) for info in z.infolist()}
  infos=z.infolist()
 assert len(members)>50
 originals={n:hashlib.sha256(b).hexdigest() for n,b in members.items()}
 for n,hash_expected in MASTERS.items():
  assert originals[n]==hash_expected,("immutable owner source changed",n)
 replace_map={
  "index.html":patch_site,
  "assets/f05_book.html":patch_book,
  "assets/f05-fit-v8.css":patch_fit,
 }
 changed=[]
 for name,fn in replace_map.items():
  assert name in members,name
  old=members[name]
  new=fn(old.decode("utf-8")).encode("utf-8")
  if old!=new:members[name]=new;changed.append(name)
 if not changed:
  return dict(status="already-integrated",files=[],deploy=False)
 data=io.BytesIO()
 with zipfile.ZipFile(data,"w") as z:
  for info in infos:
   # Keep metadata, order, compression, and every other member's raw content.
   z.writestr(info,members[info.filename])
 payload=data.getvalue()
 with zipfile.ZipFile(io.BytesIO(payload)) as z:
  assert z.testzip() is None
  assert z.namelist()==list(members)
  for name,digest in originals.items():
   if name not in replace_map:assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
 if not check:
  for p in parts:p.unlink()
  for i,offset in enumerate(range(0,len(payload),512000)):
   (BUNDLE/f"part-{i:03d}.bin").write_bytes(payload[offset:offset+512000])
 return dict(status="dry-run-ready" if check else "bundle-patched",files=changed,
             unchangedOwnerAssets=len(MASTERS),size=len(payload),deploy=False)
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("--check",action="store_true")
 args=p.parse_args()
 print(json.dumps(patch(args.check),indent=2))
