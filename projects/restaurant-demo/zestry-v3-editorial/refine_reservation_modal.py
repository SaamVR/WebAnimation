#!/usr/bin/env python3
"""ZESTRY reservation modal editorial refinement on the approved ZIP.

Only changes the site HTML/CSS/JS inside the existing 26-part archive.
All master Lottie JSON, F05 interactive book, photography, and other archive
members remain byte identical. No preview site and no deployment.
"""
from __future__ import annotations
import argparse, hashlib,io,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/"review_bundle"
MARK="ZESTRY_BOOK_A_TABLE_EDITORIAL_20261119"
F01="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
F02="e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa"
F07="a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b"
WIDE_MARK="ZESTRY_RESERVATION_WIDE_PANEL_20261119"
WIDE_STYLES=r"""
/* ZESTRY_RESERVATION_WIDE_PANEL_20261119
 * Owner-marked header area rather than a small corner tile.
 * Original F07 Lottie remains uncropped via xMidYMid meet.
 */
@media(min-width:601px){
 #modal.reservation-dialog .modalhead{
  grid-template-columns:minmax(0,1fr) minmax(0,388px);
  column-gap:16px;
 }
 #modal.reservation-dialog .reservation-illustration{
  justify-self:start;
  align-self:center;
  width:calc(100% - 32px);
  height:146px;
  margin:0;
  border-radius:15px;
 }
}
@media(max-width:600px){
 #modal.reservation-dialog .modalhead{
  grid-template-columns:minmax(0,1fr) minmax(0,132px);
  column-gap:12px;
 }
 #modal.reservation-dialog .reservation-illustration{
  justify-self:stretch;
  width:100%;
  height:74px;
  margin:64px 0 0;
  border-radius:12px;
 }
}
@media(max-width:350px){
 #modal.reservation-dialog .modalhead{
  grid-template-columns:minmax(0,1fr) minmax(0,104px);
  column-gap:8px;
 }
 #modal.reservation-dialog .reservation-illustration{
  width:100%;
  height:60px;
  margin-top:64px;
 }
}
"""

OLD_DIALOG="function setDialog(title,content){$('#modal-title').textContent=title;$('#modal-content').innerHTML=content;$('#drawer').classList.remove('active');modal('dialog')}"
NEW_DIALOG=r"""function setDialog(title,content){
 // Fully retire any previous confirmation/booking modal Lottie before a
 // new dialog is constructed; no invisible player may keep rendering.
 for(const t of Array.from(zestryMotionTracks)){
  if(!t.modal)continue;
  t.animation.destroy();
  t.observer?.disconnect();
  zestryMotionTracks.delete(t);
 }
 const dialog=$('#modal'),head=dialog.querySelector('.modalhead');
 head.querySelector('.reservation-helper')?.remove();
 head.querySelector('.reservation-illustration')?.remove();
 const booking=title==='Request a table';
 dialog.classList.toggle('reservation-dialog',booking);
 $('#modal-title').textContent=title;
 $('#modal-content').innerHTML=content;
 if(booking){
  const helper=document.createElement('p');
  helper.className='reservation-helper';
  helper.id='reservation-helper';
  helper.textContent='This is a simulated reservation request. No real restaurant availability is checked.';
  $('#modal-title').after(helper);
  const illustration=document.createElement('div');
  illustration.className='reservation-illustration';
  illustration.setAttribute('aria-hidden','true');
  illustration.innerHTML='<div id="reservation-modal-animation" class="anim"></div>';
  helper.after(illustration);
  dialog.setAttribute('aria-describedby','reservation-helper');
 }else dialog.removeAttribute('aria-describedby');
 $('#drawer').classList.remove('active');
 modal('dialog');
}"""
STYLES=r"""
/* ZESTRY_BOOK_A_TABLE_EDITORIAL_20261119
 * Approved yellow-orange + deep-red treatment. Only reservation dialog.
 * Original F07 animation mounts at top-right, not an invented illustration.
 */
#modal.reservation-dialog{
 width:min(760px,calc(100vw - 32px));
 max-height:calc(100vh - 24px);
 max-height:calc(100dvh - 24px);
 border-radius:20px;
 overflow-x:hidden;
 overflow-y:auto;
 background:#fff8ed;
 border:1px solid rgba(195,40,45,.13);
 box-shadow:0 28px 76px rgba(48,20,12,.32);
}
#modal.reservation-dialog .modalhead{
 position:relative;
 display:grid;
 grid-template-columns:minmax(0,1fr) 190px;
 grid-template-rows:auto auto;
 align-items:center;
 column-gap:22px;
 row-gap:10px;
 padding:31px 34px 27px;
 min-height:202px;
 border-bottom:5px solid var(--yellow);
 background:var(--red);
}
#modal.reservation-dialog .modalhead #modal-title{
 grid-column:1;
 grid-row:1;
 align-self:end;
 max-width:100%;
 color:#fffdf7;
 font:700 clamp(28px,3vw,36px)/1.12 'Fraunces',Georgia,serif;
 letter-spacing:-.03em;
}
#modal.reservation-dialog .reservation-helper{
 grid-column:1;
 grid-row:2;
 align-self:start;
 max-width:330px;
 margin:0;
 color:#ffe9d7;
 font:500 13px/1.55 'DM Sans',Arial,sans-serif;
}
#modal.reservation-dialog .reservation-illustration{
 grid-column:2;
 grid-row:1 / span 2;
 align-self:center;
 justify-self:center;
 width:172px;
 height:142px;
 max-width:100%;
 margin-top:44px;
 margin-right:18px;
 background:linear-gradient(140deg,var(--yellow),#ffe9a2);
 border:2px solid #ffefba;
 border-radius:21px;
 box-shadow:0 11px 24px rgba(63,15,16,.2);
 overflow:hidden;
 pointer-events:none;
}
#modal.reservation-dialog .reservation-illustration .anim{
 display:block;width:100%;height:100%;min-width:0;min-height:0;
}
#modal.reservation-dialog .reservation-illustration svg{
 display:block;width:100%!important;height:100%!important;
}
#modal.reservation-dialog .modalhead>.x{
 position:absolute;
 top:12px;right:12px;
 width:44px;height:44px;
 display:grid;place-items:center;
 color:#fff;
 background:rgba(255,255,255,.13);
 border:1px solid rgba(255,255,255,.42);
 border-radius:50%;
 cursor:pointer;
 z-index:2;
}
#modal.reservation-dialog .modalhead>.x:hover{background:rgba(255,255,255,.24)}
#modal.reservation-dialog .modalbody{padding:30px 36px 34px;background:#fff8ed}
#modal.reservation-dialog #booking-form{
 display:grid;
 grid-template-columns:minmax(0,1fr);
 gap:21px;
 width:100%;min-width:0;
}
#modal.reservation-dialog #booking-form .formrow{
 display:grid;
 grid-template-columns:repeat(2,minmax(0,1fr));
 gap:22px;
 min-width:0;
}
#modal.reservation-dialog #booking-form .formfield{
 display:grid;
 grid-template-columns:minmax(0,1fr);
 align-content:start;
 gap:9px;
 min-width:0;
 width:100%;
 margin:0;
}
#modal.reservation-dialog #booking-form .formfield label{
 font-size:14px;
 font-weight:800;
 line-height:1.35;
 color:#3c2520;
}
#modal.reservation-dialog #booking-form .formfield input,
#modal.reservation-dialog #booking-form .formfield select{
 box-sizing:border-box;
 display:block;
 min-width:0;
 width:100%;
 max-width:100%;
 min-height:54px;
 height:54px;
 padding:12px 14px;
 font:500 16px/1.4 'DM Sans',Arial,sans-serif;
 color:#34231e;
 background:#fff;
 border:1.5px solid #dfcbb8;
 border-radius:10px;
}
#modal.reservation-dialog #booking-form .formfield input:focus-visible,
#modal.reservation-dialog #booking-form .formfield select:focus-visible{
 outline:3px solid var(--yellow);
 outline-offset:1px;
 border-color:var(--red);
}
#modal.reservation-dialog #booking-form .btn{
 justify-self:start;
 margin-top:3px;
 min-height:52px;
 padding:14px 23px;
 border-radius:10px;
 background:var(--yellow);
 border-color:var(--yellow);
 color:var(--dark);
 font-size:14px;
 box-shadow:0 5px 0 rgba(125,62,21,.13);
}
@media(max-width:600px){
 #modal.reservation-dialog{width:calc(100vw - 20px);border-radius:16px}
 #modal.reservation-dialog .modalhead{
  grid-template-columns:minmax(0,1fr) minmax(90px,115px);
  column-gap:12px;
  row-gap:9px;
  min-height:158px;
  padding:25px 19px 20px;
 }
 #modal.reservation-dialog .modalhead #modal-title{
  font-size:clamp(23px,6.5vw,29px);
 }
 #modal.reservation-dialog .reservation-helper{
  font-size:11.5px;
  line-height:1.42;
  max-width:240px;
 }
 #modal.reservation-dialog .reservation-illustration{
  width:110px;
  height:93px;
  max-width:100%;
  margin:64px 0 0;
  border-radius:13px;
 }
 #modal.reservation-dialog .modalhead>.x{right:7px;top:7px}
 #modal.reservation-dialog .modalbody{padding:22px 20px 26px}
 #modal.reservation-dialog #booking-form{gap:18px}
 #modal.reservation-dialog #booking-form .formrow{
  grid-template-columns:minmax(0,1fr);
  gap:18px;
 }
 #modal.reservation-dialog #booking-form .btn{
  width:100%;
  justify-self:stretch;
  margin-top:2px;
 }
}
@media(max-width:350px){
 #modal.reservation-dialog .modalhead{
  grid-template-columns:minmax(0,1fr) 94px;
  padding-left:16px;
  padding-right:15px;
  column-gap:7px;
 }
 #modal.reservation-dialog .reservation-illustration{width:93px;height:82px}
 #modal.reservation-dialog .modalbody{padding:19px 16px 24px}
}
"""
def sha(b):return hashlib.sha256(b).hexdigest()
def replace_once(s,old,new,label):
 assert s.count(old)==1,(label,s.count(old))
 return s.replace(old,new,1)
def modify(page):
 if MARK in page:
  assert page.count(MARK)==1 and "reservation-modal-animation" in page
  if WIDE_MARK in page:
   assert page.count(WIDE_MARK)==1
   return page
  return replace_once(page,"</style>","\n"+WIDE_STYLES+"\n</style>","extend reservation illustration to marked rectangle")
 assert "ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119" in page
 assert "ZESTRY_F02_OWNER_FULL360_SINGLE_20261119" in page
 assert "play(name,c,name!=='f06')" in page
 assert page.count(OLD_DIALOG)==1
 page=replace_once(page,OLD_DIALOG,NEW_DIALOG,"modal lifecycle")
 disclaimer='<p>This is a simulated reservation request. No real restaurant availability is checked.</p><form id="booking-form">'
 page=replace_once(page,disclaimer,'<form id="booking-form">',"remove oversized helper from form")
 page=replace_once(page,"$('#date').value=m}","$('#date').value=m;play('f07',$('#reservation-modal-animation'),true)}","mount approved F07 only in open booking dialog")
 page=replace_once(page,"</style>","\n"+STYLES+"\n"+WIDE_STYLES+"\n</style>","reservation scoped styling")
 assert page.count(MARK)==1
 assert page.count("id=\"booking-form\"")==1
 assert page.count("id=\"reservation-modal-animation\"")==1
 assert page.count("function askBooking()")==1
 assert "function showConfirm(kind,line)" in page and "zestryMotionAttach(l,container)" in page
 return page
def patch(check_only=False):
 parts=sorted(BUNDLE.glob("part-*.bin"))
 assert parts
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  data={i.filename:z.read(i.filename) for i in z.infolist()}
 originals={p:sha(x) for p,x in data.items()}
 for name,digest in (
  ("assets/lottie/f01.json",F01),
  ("assets/lottie/f02-chef-full360.json",F02),
  ("assets/lottie/f07.json",F07)
 ):
  assert originals[name]==digest,(name,"artist-approved source changed")
 before=data["index.html"]
 after=modify(before.decode()).encode()
 if before==after:return {"status":"already-integrated","deployment":False}
 data["index.html"]=after
 out=io.BytesIO()
 with zipfile.ZipFile(out,"w") as z:
  for name,blob in data.items():
   compression=zipfile.ZIP_STORED if Path(name).suffix in (
    ".jpg",".png",".webp",".lottie",".woff",".woff2",".gif"
   ) else zipfile.ZIP_DEFLATED
   z.writestr(name,blob,compress_type=compression,
              compresslevel=6 if compression==zipfile.ZIP_DEFLATED else None)
 payload=out.getvalue()
 with zipfile.ZipFile(io.BytesIO(payload)) as z:
  assert z.testzip() is None
  assert z.namelist()==list(data)
  assert z.read("index.html")==after
  assert all(sha(z.read(p))==v for p,v in originals.items() if p!="index.html")
 if not check_only:
  for p in parts:p.unlink()
  for i,offset in enumerate(range(0,len(payload),512000)):
   (BUNDLE/f"part-{i:03d}.bin").write_bytes(payload[offset:offset+512000])
 return {"status":"dry-run-ready" if check_only else "bundle-patched",
         "changedArchiveMembers":["index.html"],"preserved":len(data)-1,
         "masterF01":F01,"masterF02":F02,"masterF07":F07,
         "bytes":len(payload),"deployment":False}
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("--check",action="store_true")
 print(json.dumps(patch(p.parse_args().check),indent=2))
