#!/usr/bin/env python3
"""One-time, scoped rename of mistaken button IDs, without changing SVG/motion."""
import argparse
from pathlib import Path
import re
import subprocess
import sys

BRANCHES={
 "feature/chapchitra-c05-compact-svg-20261109":"feature/chapchitra-compact-svg-buttons",
 "feature/chapchitra-c06-long-svg-20261111":"feature/chapchitra-long-svg-buttons",
 "review/chapchitra-c05-approval-base-20261109":"review/chapchitra-compact-buttons-approval-base",
 "review/chapchitra-c06-approval-base-20261111":"review/chapchitra-long-buttons-approval-base",
}
TEXT={".md",".mjs",".cjs",".js",".css",".json",".html",".py",".yml",".yaml",".txt"}
IMMUTABLE_ASSETS={".svg",".zip",".rar",".png",".webp",".jpg",".jpeg",".gif",".mp4",".webm"}
TEMP={".github/workflows/chapchitra-button-id-migration.yml","projects/chapchitra/scripts/rename_ui_identifiers.py"}

def fix(s,mode,filename=False):
 # Never mutate immutable SHA-1/SHA-256 fingerprints when renaming an UI ID.
 # Some true hashes contain the coincidental hexadecimal characters "c05".
 preserved=[]
 if not filename:
  def shield(match):
   preserved.append(match.group(0))
   return "__PRESERVED_HASH_TOKEN_"+str(len(preserved)-1)+"__"
  s=re.sub(r"(?<![0-9a-zA-Z])[0-9a-fA-F]{32,128}(?![0-9a-zA-Z])",shield,s)
 for old,new in BRANCHES.items():
  if mode=="compact" and "c06" in old:continue
  s=s.replace(old,new)
 corrections=[
  ("__chapchitraC05","__chapchitraCompactButtons"),
  ("C05_BEFORE_URL","COMPACT_BUTTON_BEFORE_URL"),
  ("C05_URL","COMPACT_BUTTON_URL"),
  ("C05_COMPACT_","COMPACT_"),
  ("C05_FINAL_","COMPACT_FINAL_"),
  ("c05-compact","compact"),
 ]
 if mode=="all":
  corrections += [
   ("__chapchitraC06","__chapchitraLongButtons"),
   ("C06_BEFORE_URL","LONG_BUTTON_BEFORE_URL"),
   ("C06_URL","LONG_BUTTON_URL"),
   ("C06_LONG_","LONG_"),
   ("chapchitra-c06-long-svg-qa","chapchitra-long-svg-qa"),
   ("c06-long-buttons","long-buttons"),
   ("c06-long","long"),
  ]
 for a,b in corrections:s=s.replace(a,b)
 s=s.replace("c05","compact").replace("C05","COMPACT")
 if mode=="all":s=s.replace("c06","long").replace("C06","LONG")
 for old,new in [
  ("compact-compact","compact"),("COMPACT_COMPACT","COMPACT"),
  ("long-long","long"),("LONG_LONG","LONG"),
  ("COMPACT compact","Compact"),("LONG long","Long"),
  ("COMPACT Compact","Compact"),("LONG Long","Long"),
  ("Compact compact","Compact"),("Long long","Long"),
 ]:s=s.replace(old,new)
 if not filename:
  s=re.sub(
   r"(https://github\.com/SaamVR/WebAnimation/blob/)[0-9a-f]{40}(/projects/chapchitra/[^\s)\]]*(?:compact|long)[^\s)\]]*)",
   lambda m:m.group(1)+(BRANCHES["feature/chapchitra-c05-compact-svg-20261109"]
     if "compact" in m.group(2) else BRANCHES["feature/chapchitra-c06-long-svg-20261111"])+m.group(2),
   s)
 for i,old_hash in enumerate(preserved):
  s=s.replace("__PRESERVED_HASH_TOKEN_"+str(i)+"__",old_hash)
 return s

def main():
 p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--mode",choices=["compact","all"],required=True)
 arg=p.parse_args();root=Path(arg.root).resolve()
 if not (root/"projects/chapchitra/src/handdrawn-buttons.mjs").is_file():
  sys.exit("Wrong Git repository root")
 paths=[]
 for base in [root/"projects/chapchitra"]:
  if not base.is_dir():continue
  for path in base.rglob("*"):
   if not path.is_file():continue
   rel=path.relative_to(root).as_posix()
   if rel in TEMP or any(s in {".git","node_modules","dist","perf-results"} for s in path.parts):continue
   if path.suffix.lower() in IMMUTABLE_ASSETS:
    if "c05" in rel.lower() or (arg.mode=="all" and "c06" in rel.lower()):
     paths.append((path,rel,False))
    continue
   if path.suffix.lower() not in TEXT:continue
   if "c05" in rel.lower() or (arg.mode=="all" and "c06" in rel.lower()) or \
      (base.name!="workflows" and path.stat().st_size<130000):
    paths.append((path,rel,True))
 edited=[];moved=[]
 for path,rel,text in paths:
  if not text:continue
  try:source=path.read_bytes().decode("utf-8")
  except UnicodeDecodeError:continue
  result=fix(source,arg.mode)
  if result!=source:
   path.write_bytes(result.encode("utf-8"))
   edited.append(rel)
 for path,rel,text in sorted(paths,key=lambda x:len(x[1]),reverse=True):
  dest=fix(rel,arg.mode,filename=True)
  if dest==rel:continue
  target=root/dest
  if target.exists():raise RuntimeError("Destination exists: "+dest)
  target.parent.mkdir(parents=True,exist_ok=True)
  subprocess.run(["git","mv","--",rel,dest],cwd=root,check=True)
  moved.append((rel,dest))
 if arg.mode=="all":
  # Baseline runs an immutable historical build. Match it by semantic markup
  # rather than referencing its obsolete internal implementation identifiers.
  qa=root/"projects/chapchitra/scripts/long-browser-qa.cjs"
  if qa.exists():
   s=qa.read_text()
   s=s.replace("old.waitForFunction(()=>window.__chapchitraCompactButtons?.counts.ready===13)",
     "old.waitForFunction(()=>document.querySelectorAll('.cc-compact-artwork svg').length===13)")
   s=s.replace(".compact-panel[data-tone=", "[data-tone=")
   qa.write_text(s)
  rel="projects/chapchitra/scripts/rename_ui_identifiers.py"
  if (root/rel).exists():
   subprocess.run(["git","rm","--",rel],cwd=root,check=True)
 print("MIGRATION",arg.mode,"edited",len(edited),"renamed",len(moved),flush=True)
 for a,b in moved:print("MOVED",a,"=>",b)
 for a in edited:print("EDITED",a)
 subprocess.run(["git","diff","--check"],cwd=root,check=True)
 subprocess.run(["git","diff","--cached","--check"],cwd=root,check=True)

if __name__=="__main__":main()
