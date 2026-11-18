#!/usr/bin/env python3
"""QA ONLY: test deployed ZESTRY Render review URL in real Chrome.

Imports existing merged Playwright test suites and runs against the LIVE URL
instead of localhost. No writes to the deployed application, no booking
requests are sent (form is entirely simulated), and no redeployment.
"""
from __future__ import annotations
import hashlib,importlib.util,json,sys,traceback,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

URL="https://zestry-v3-restaurant-review-20261117.onrender.com/"
ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/live-verification-20261119"
OUT.mkdir(parents=True,exist_ok=True)
REPORT={"environment":"live-Render-review","url":URL,"deploy_sha":"a81332d7faf5c277e03207e5e2513d174d124919","checks":[],"failures":[],"deployment":"NONE"}
HASHES={
 "assets/lottie/f01.json":"7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
 "assets/lottie/f02-chef-full360.json":"e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa",
 "assets/lottie/f03.json":"136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68",
 "assets/lottie/f07.json":"a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b",
}
def add(name,passed,detail=None):
 result={"name":name,"passed":bool(passed),"detail":detail}
 REPORT["checks"].append(result)
 if not passed:REPORT["failures"].append(name)
 print(("PASS " if passed else "FAIL ")+name+" "+json.dumps(detail,default=str)[:600],flush=True)
def import_file(path,name):
 spec=importlib.util.spec_from_file_location(name,path)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 return module
reservation=import_file(ROOT/"zestry-v3-editorial/qa_reservation_modal.py","zestry_reservation_qa")
motion=reservation.existing
reservation.OUT=OUT
motion.OUT=OUT
def http(path):
 with urllib.request.urlopen(urllib.request.Request(URL+path,headers={"User-Agent":"ZESTRY-Portfolio-Postdeploy-QA/1.0","Cache-Control":"no-cache"}),timeout=25) as response:
  return response.status,response.read(),response.headers.get("Content-Type")
def test_source():
 for path,expected in HASHES.items():
  try:
   status,body,mime=http(path)
   actual=hashlib.sha256(body).hexdigest()
   add("LIVE source SHA256 "+path,status==200 and actual==expected,
       {"http":status,"bytes":len(body),"actual":actual,"expected":expected,"mime":mime})
  except Exception as e:add("LIVE source SHA256 "+path,False,str(e))
 try:
  status,body,mime=http("")
  html=body.decode("utf-8")
  needed=[
   "ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119",
   "ZESTRY_BOOK_A_TABLE_EDITORIAL_20261119",
   "ZESTRY_RESERVATION_WIDE_PANEL_20261119",
   'data-animation="f02-chef-full360"',
   "reservation-modal-animation",
   "assets/vendor/lottie.min.js",
  ]
  add("LIVE website 200 and all approved integration markers",
      status==200 and all(t in html for t in needed),
      {"status":status,"bytes":len(body),"markers":{t:t in html for t in needed}})
  add("LIVE no legacy chef mounts",
      'data-animation="f02-orbit"' not in html and 'data-animation="f02-cooking"' not in html)
  add("LIVE only current F07 booking widget",html.count("ZESTRY_RESERVATION_WIDE_PANEL_20261119")==1)
 except Exception as e:add("LIVE website source and markers",False,str(e))
def browser_tests():
 with sync_playwright() as pw:
  try:b=pw.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  except Exception:b=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   for label,w,h,reduced in [
    ("desktop",1600,900,False),("ipad",1024,768,False),
    ("mobile",390,844,False),("compact",320,690,False),
    ("reduced",390,844,True)
   ]:
    try:reservation.test_view(b,label,w,h,URL,reduced)
    except Exception as e:
     traceback.print_exc()
     reservation.ck(label+" LIVE reservation browser suite",False,str(e))
   for label,w,h in (("desktop-motion",1600,900),("mobile-motion",390,844)):
    try:motion.test_browser(b,label,w,h,URL)
    except Exception as e:
     traceback.print_exc()
     motion.check(label+" LIVE animation browser suite",False,str(e))
   try:motion.reduced_motion(b,URL)
   except Exception as e:
    traceback.print_exc()
    motion.check("LIVE reduced-motion scene",False,str(e))
  finally:b.close()
def save():
 REPORT["reservation"]={"passed":sum(x["passed"] for x in reservation.REPORT["checks"]),
                        "total":len(reservation.REPORT["checks"]),"failures":reservation.REPORT["failures"]}
 REPORT["motion"]={"passed":sum(x["pass"] for x in motion.report["checks"]),
                   "total":len(motion.report["checks"]),"failures":motion.report["failures"]}
 REPORT["total"]=len(REPORT["checks"])+REPORT["reservation"]["total"]+REPORT["motion"]["total"]
 REPORT["passed"]=sum(x["passed"] for x in REPORT["checks"])+REPORT["reservation"]["passed"]+REPORT["motion"]["passed"]
 REPORT["failures"]+=REPORT["reservation"]["failures"]+REPORT["motion"]["failures"]
 (OUT/"LIVE_ZESTRY_PR141_QA.json").write_text(json.dumps(REPORT,indent=2)+"\n")
 print("LIVE_ZESTRY_ACCEPTANCE",json.dumps({"passed":REPORT["passed"],"total":REPORT["total"],"failures":REPORT["failures"],"deployedCommit":REPORT["deploy_sha"]}),flush=True)
 return len(REPORT["failures"])
if __name__=="__main__":
 try:
  test_source()
  browser_tests()
 except Exception as e:
  traceback.print_exc()
  add("live QA harness",False,str(e))
 sys.exit(2 if save() else 0)
