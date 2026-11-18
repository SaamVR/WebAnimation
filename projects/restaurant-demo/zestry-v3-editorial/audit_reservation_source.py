#!/usr/bin/env python3
"""Source audit: print the actual shipped ZIP's reservation modal and relevant styling. No mutation."""
from __future__ import annotations
import io,zipfile,re,hashlib
from pathlib import Path
root=Path("projects/restaurant-demo")
parts=sorted((root/"review_bundle").glob("part-*.bin"))
assert parts
with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
 assert z.testzip() is None
 html=z.read("index.html").decode()
 print("ARCHIVE_MEMBERS",len(z.namelist()),"MAIN_SHA256",hashlib.sha256(html.encode()).hexdigest(),flush=True)
 print("ANIM_HOSTS",re.findall(r'data-animation=["\x27]([^"\x27]+)',html),flush=True)
 for needle in ("Request a table","booking-form","bookform","id='modal'","id=\"modal\"","function askBooking","async function play","function showModal","new IntersectionObserver","form-row","res-form","data-book","id=\"reservation"):
  matches=[m.start() for m in re.finditer(re.escape(needle),html,re.I)]
  print("\n==== SEARCH",needle,len(matches),flush=True)
  for p in matches[:3]:
   print("OFFSET",p,repr(html[max(0,p-1000):p+2900]),flush=True)
 css=html.split("<style>",1)[1].split("</style>",1)[0] if "<style>" in html else ""
 print("\nINLINE CSS TOTAL",len(css),flush=True)
 for needle in ("#modal",".modal",".booking-",".field",".form-grid",".form-row",".reserve-",".book-"):
  matches=[m.start() for m in re.finditer(re.escape(needle),css,re.I)]
  print("\n==== CSS",needle,len(matches),flush=True)
  for p in matches[:8]:
   print("CSS_OFFSET",p,repr(css[max(0,p-100):p+650]),flush=True)
