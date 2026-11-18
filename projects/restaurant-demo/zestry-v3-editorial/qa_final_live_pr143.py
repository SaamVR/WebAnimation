#!/usr/bin/env python3
"""ZESTRY PR143 live Render smoke/QA — standalone, read-only, no redeployment.

Runs the exact approved owner F05, motion and reservation Chromium tests
AGAINST THE EXISTING PUBLIC RENDER SITE; verifies live Lottie SHA256.
"""
from __future__ import annotations
import importlib.util,hashlib,json,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE="https://zestry-v3-restaurant-review-20261117.onrender.com/"
SHA="63274b383c7622f2df0074947a647acafeb98152"
ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/live-pr143-20261119"
OUT.mkdir(parents=True,exist_ok=True)
REPORT={"site":BASE,"source_deployed_commit":SHA,"deployment":"NONE","checks":[],"failures":[]}
ASSETS={
 "assets/f05_book.lottie":"3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645",
 "assets/lottie/f01.json":"7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
 "assets/lottie/f02-chef-full360.json":"e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa",
 "assets/lottie/f03.json":"136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68",
 "assets/lottie/f07.json":"a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b",
}
def fetch(path):
 req=urllib.request.Request(BASE+path,headers={"User-Agent":"ZESTRY-LiveFinalOwnerQA/1.0","Cache-Control":"no-cache"})
 with urllib.request.urlopen(req,timeout=45) as r:
  return r.status,r.read(),r.headers.get("Content-Type")
def verify(name,result,detail=None):
 x={"name":name,"passed":bool(result),"detail":detail}
 REPORT["checks"].append(x)
 if not x["passed"]:REPORT["failures"].append(name)
 print(("PASS " if x["passed"] else "FAIL ")+name+" "+json.dumps(detail,default=str)[:800],flush=True)
def imp(path,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/"zestry-v3-editorial"/path)
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 return m
f05=imp("qa_f05_owner_recording_20261119.py","f05_pr143_live")
motion=imp("qa_visible_loops.py","motion_pr143_live")
reservation=imp("qa_reservation_modal.py","reservation_pr143_live")
# Reservation imports a separate copy of motion; both share same output directory.
f05.OUT=motion.OUT=reservation.OUT=reservation.existing.OUT=OUT
def site_assets():
 for path,expected in ASSETS.items():
  try:
   code,data,ctype=fetch(path)
   digest=hashlib.sha256(data).hexdigest()
   verify("LIVE original asset "+path,code==200 and digest==expected,
          {"code":code,"sha256":digest,"bytes":len(data),"mime":ctype})
  except Exception as exc:verify("LIVE original asset "+path,False,str(exc))
 try:
  code,html,_=fetch("")
  data=html.decode()
  terms=["ZESTRY_F05_OWNER_FLIP_F06_COMPACT_F03_COFFEE_20261119",
         "ZESTRY_RESERVATION_WIDE_PANEL_20261119",
         "ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119",
         "ZESTRY_BOOK_A_TABLE_EDITORIAL_20261119"]
  verify("LIVE Render HTML contains approved F05 F06 F03 and original F07",
         code==200 and all(t in data for t in terms),
         {"http":code,"markers":{t:t in data for t in terms}})
  code,book,_=fetch("assets/f05_book.html")
  string=book.decode()
  verify("LIVE F05 paper-leaf and category handoff",
         code==200 and "ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119" in string and
         "f05PaperNext" in string and "Turn_Starters_to_Main_Courses" in string)
  code,fit,_=fetch("assets/f05-fit-v8.css")
  verify("LIVE photo alignment override centered at 52.75%",
         code==200 and "ZESTRY_F05_PHOTO_FRAME_CENTER_20261119" in fit.decode() and
         "left:52.75%" in fit.decode())
 except Exception as exc:verify("LIVE website source",False,str(exc))
def test():
 with sync_playwright() as pw:
  try:b=pw.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  except Exception:b=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   for label,w,h in [("desktop",1600,900),("ipad",1024,768),("mobile",390,844)]:
    try:f05.run_device(b,label,w,h,BASE)
    except Exception as exc:
     traceback.print_exc()
     f05.verify(label+" LIVE full menu, F06 and coffee browser suite",False,str(exc))
   for label,w,h in [("desktop-motion",1600,900),("mobile-motion",390,844)]:
    try:motion.test_browser(b,label,w,h,BASE)
    except Exception as exc:
     traceback.print_exc()
     motion.check(label+" LIVE motion regression",False,str(exc))
   try:motion.reduced_motion(b,BASE)
   except Exception as exc:
    traceback.print_exc()
    motion.check("LIVE reduced motion",False,str(exc))
   for label,w,h,reduced in [
    ("desktop-reservation",1600,900,False),
    ("ipad-reservation",1024,768,False),
    ("mobile-reservation",390,844,False),
    ("compact-reservation",320,690,False),
    ("reduced-reservation",390,844,True)]:
    try:reservation.test_view(b,label,w,h,BASE,reduced)
    except Exception as exc:
     traceback.print_exc()
     reservation.ck(label+" LIVE booking regression",False,str(exc))
  finally:b.close()
def finish():
 suites={"host":REPORT["checks"],"f05":f05.REPORT["checks"],
         "motion":motion.report["checks"],"reservation":reservation.REPORT["checks"]}
 count=sum(len(v) for v in suites.values())
 passed=sum(sum(x.get("passed",x.get("pass",False)) for x in v) for v in suites.values())
 failures=REPORT["failures"]+f05.REPORT["failures"]+motion.report["failures"]+reservation.REPORT["failures"]
 REPORT.update({"passed":passed,"total":count,"failures":failures,
                "suiteTotals":{k:{"total":len(v),"passed":sum(x.get("passed",x.get("pass",False)) for x in v)} for k,v in suites.items()}})
 (OUT/"ZESTRY_LIVE_PR143_QA.json").write_text(json.dumps(REPORT,indent=2)+"\n")
 print("ZESTRY_FINAL_LIVE_QA",json.dumps({"passed":passed,"total":count,"failures":failures,"renderSHA":SHA}),flush=True)
 return not failures
if __name__=="__main__":
 try:
  site_assets()
  test()
 except Exception as exc:
  traceback.print_exc()
  verify("unhandled live QA",False,str(exc))
 raise SystemExit(0 if finish() else 2)
