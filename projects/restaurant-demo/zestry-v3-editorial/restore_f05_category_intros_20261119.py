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

def patch_html(html,old=None,new=None):
 parent=previous()
 old=parent.DRAW_NEW if old is None else old
 new=parent.DRAW_OLD if new is None else new
 assert "ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119" in html
 assert "f05PaperNext" in html and "function moveDish(delta)" in html
 assert "ZESTRY_RESERVATION" not in html  # F07 is isolated in index.html
 if MARK in html:
  assert html.count(MARK)==1
  assert new in html and old not in html
  return html
 assert old!=new and html.count(old)==1,("Expected one original F05 canvas filter",html.count(old))
 # The only runtime behavior change is restoring original vector food art
 # during the native category intro/page flip; stable photo pages remain
 # governed by the original category-state filter.
 return html.replace(old,new,1).replace("</script>",
   "</script>",1).replace(
   "function drawF05(doc,fr,canvas){",
   "/* "+MARK+" — keep authored first-category art during Turn_ and Replay_; keep all motion. */\nfunction drawF05(doc,fr,canvas){",
   1
 )

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
