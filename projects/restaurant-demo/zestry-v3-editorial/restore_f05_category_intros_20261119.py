#!/usr/bin/env python3
"""ZESTRY F05 category-intro restoration (owner correction Nov 19, 2026).

Restore the four original FIRST category illustration pages baked into the
approved F05 dotLottie artwork, visible during native Turn_* and Replay_*
states. Do not change current page swipe, 740ms dish-leaf turns, food-photo
positioning, four-item categories, layout, coffee, F06, reservation, or artwork.

ONLY change the single bundled assets/f05_book.html drawing filter. No deploy.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import io
import json
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/"review_bundle"
MARK="ZESTRY_F05_RESTORE_APPROVED_CATEGORY_INTROS_20261119"
SRC=ROOT/"zestry-v3-editorial/refine_f05_section_coffee_20261119.py"

def previous():
 spec=importlib.util.spec_from_file_location("approved_source",SRC)
 module=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 return module

def digest(data):return hashlib.sha256(data).hexdigest()

COVER_MARK="ZESTRY_F05_AUTHORED_CATEGORY_COVER_BEFORE_PHOTOS_20261119"
# Only category HOLD states are masked while a real dish photograph is shown.
# The category's original 100%-opacity F05 vector artwork remains visible on
# its first standalone page. Turn_ and Replay_ frames are never filtered.
HOLD_FILTER=(
 "if(['Starters','Main_Courses','Desserts','Drinks'].includes(window.__f05BookState)"
 "&&!window.__f05BookIntro"
 "&&(/^PAGE_(Starters|Main_Courses|Desserts|Drinks)_Food_/.test(l.nm)"
 "||l.nm.startsWith('SVG_EXACT__OPEN_Book_Open_Main_Spread_Special_Cake_')"
 "||l.nm.startsWith('SVG_EXACT__OPEN_Book_Open_Main_Spread_Special_Salad_')))continue;"
)
COVER_HOOK=r"""
/* ZESTRY_F05_AUTHORED_CATEGORY_COVER_BEFORE_PHOTOS_20261119
 * Preserve each category's AUTHOR-KEYFRAMED original illustrated first page.
 * Native menu state transitions and existing photo leaf turns stay unchanged.
 * The first Next invokes the ORIGINAL authored category Replay_ animation;
 * only after its OnComplete do the four product photographs begin.
 */
window.__f05BookIntro=false;
let f05LastMachineState=null,f05ReplayWasCover=false;
const f05BeforeCategoryCover=window.__f05Update;
window.__f05Update=(state)=>{
 const previous=f05LastMachineState;
 f05LastMachineState=state;
 if(state.startsWith('Replay_'))
  f05ReplayWasCover=window.__f05BookIntro===true;
 const isCategory=CATS.includes(state);
 let cover=false;
 if(isCategory){
  if(previous&&previous.startsWith('Replay_'))
   cover=f05ReplayWasCover;
  else if(pendingPreviousLast)
   cover=false;
  else
   cover=true;
  window.__f05BookIntro=cover;
 }
 f05BeforeCategoryCover(state);
 if(isCategory&&cover){
  // The authored F05 vector illustration is the actual first page.
  // Do not insert a photograph on top of the salad, burger, cake or drink.
  bookBox.replaceChildren();bookBox.className='photos';
  document.getElementById('book-hint').textContent=
   state.replaceAll('_',' ')+' illustrated first page · Next for four dishes';
  document.getElementById('state').textContent=
   state.replaceAll('_',' ')+' illustrated category page. Press Next for the four menu items.';
 }
};
"""
INTRO_NEXT=r""" if(event==='next'&&visibleCategory&&window.__f05BookIntro){
   // Reuse the 2.2-second AUTHORED native page-turn. Do not replace any
   // current 740ms photographic leaf swipe or move the photo cards.
   window.__f05BookIntro=false;
   if(!window.F05_QA.fire('replay')){
    drawDish();
    window.drawF05(window.F05_QA.document,0,document.getElementById('art'));
   }
   return;
 }
"""
def patch_html(html,old=None,new=None):
 parent=previous()
 old=parent.DRAW_NEW if old is None else old
 new=parent.DRAW_OLD if new is None else new
 assert "ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119" in html
 assert "f05PaperNext" in html and "function moveDish(delta)" in html
 assert "ZESTRY_RESERVATION" not in html
 if MARK in html:
  assert html.count(MARK)==1
  assert old not in html
 else:
  assert old!=new and html.count(old)==1,("Expected one original F05 canvas filter",html.count(old))
  html=html.replace(old,new,1)
  html=html.replace(
   "function drawF05(doc,fr,canvas){",
   "/* "+MARK+" — preserve category native turns and full original masters. */\nfunction drawF05(doc,fr,canvas){",
   1)
 if COVER_MARK in html:
  assert html.count(COVER_MARK)==1 and HOLD_FILTER in html
  return html
 assert html.count(new)==1,("Expected one approved original hold filter",html.count(new))
 html=html.replace(new,HOLD_FILTER,1)
 original="function bookNavigation(event){\n if(!window.F05_QA||turnLocked)return;"
 assert html.count(original)==1,("Expected existing unchanged menu navigation",html.count(original))
 html=html.replace(original,COVER_HOOK+"\nfunction bookNavigation(event){\n if(!window.F05_QA||turnLocked)return;\n"+INTRO_NEXT,1)
 assert html.count(COVER_MARK)==1
 return html

def patch(dry_run):
 parts=sorted(BUNDLE.glob("part-*.bin"))
 assert len(parts)>8,"Expected existing approved ZESTRY ZIP parts"
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  infos=z.infolist()
  data={i.filename:z.read(i.filename) for i in infos}
 assert "assets/f05_book.html" in data and "index.html" in data
 before={n:digest(b) for n,b in data.items()}
 parent=previous()
 for name,expected in parent.MASTERS.items():
  assert before[name]==expected,("approved original file changed",name)
 assert "ZESTRY_RESERVATION_WIDE_PANEL_20261119" in data["index.html"].decode()
 assert "ZESTRY_F05_OWNER_FLIP_F06_COMPACT_F03_COFFEE_20261119" in data["index.html"].decode()
 current=data["assets/f05_book.html"].decode()
 changed=patch_html(current)
 if changed==current:
  return {"status":"already-integrated","changed":[],"deploy":False}
 data["assets/f05_book.html"]=changed.encode()
 out=io.BytesIO()
 with zipfile.ZipFile(out,"w") as z:
  for info in infos:z.writestr(info,data[info.filename])
 result=out.getvalue()
 with zipfile.ZipFile(io.BytesIO(result)) as z:
  assert z.testzip() is None
  assert z.namelist()==[i.filename for i in infos]
  for n,expected in before.items():
   if n!="assets/f05_book.html":
    assert digest(z.read(n))==expected,("unintended ZIP mutation",n)
  assert z.read("assets/f05_book.html")==changed.encode()
 if not dry_run:
  for p in parts:p.unlink()
  for i,offset in enumerate(range(0,len(result),512000)):
   (BUNDLE/f"part-{i:03d}.bin").write_bytes(result[offset:offset+512000])
 return {"status":"dry-run" if dry_run else "patched",
         "changed":["assets/f05_book.html"],
         "otherMembersPreserved":len(data)-1,
         "originalAssetsUnchanged":list(parent.MASTERS),
         "zipBytes":len(result),"deploy":False}

if __name__=="__main__":
 a=argparse.ArgumentParser()
 a.add_argument("--check",action="store_true")
 print(json.dumps(patch(a.parse_args().check),indent=2))
