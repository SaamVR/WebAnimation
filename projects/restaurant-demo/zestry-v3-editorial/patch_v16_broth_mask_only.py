#!/usr/bin/env python3
"""Restore exact approved V16 runtime; fix ONLY wood-cloned SVG ID collisions.

Input ZIP is restored verbatim from commit
8bdcd1711b8b19e9e597a9f3dbb853d701018cc5.
No V17 performance tweaks, frame-rate overrides or V18 loop logic are allowed.
The SVG definitions ID namespace fixes the masked broth fill without changing
the scene choreography, F01/F02 Lottie JSON or camera scaling controller.
"""
from pathlib import Path
from hashlib import sha256
import io,json,re,zipfile

BUNDLE=Path(__file__).resolve().parents[1]/"review_bundle"
EXPECTED={
 "assets/lottie/f01.json":"7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
 "assets/lottie/f01-v16.json":"14f781c6568a15fd1593b7a906c95f87b9c445bd7573cf8741bbded92ca6660d",
 "assets/lottie/f02-orbit.json":"adfca93e752627a83ae06d44cc667d7baf655a79f9370f07ca3306ca10567a64",
 "assets/lottie/f02-cooking.json":"5e341a2d8229a5dc762c720da8458608d456fd57f8d3aca83c95de5a9efc390e",
}
MARKER="ZESTRY_V16_WOOD_MASK_ID_ONLY_20261118"
def main():
 parts=sorted(BUNDLE.glob("part-*.bin"))
 assert len(parts)>20, len(parts)
 original=b"".join(p.read_bytes() for p in parts)
 with zipfile.ZipFile(io.BytesIO(original)) as z:
  assert z.testzip() is None
  content={i.filename:z.read(i.filename) for i in z.infolist()}
 for p,expected in EXPECTED.items():
  actual=sha256(content[p]).hexdigest()
  assert actual==expected,(p,actual,expected)
 html=content["index.html"].decode("utf8")
 assert "mountF01V16FixedSize" in html
 assert "const zoom=1.755;" in html
 assert "ZESTRY_PERF_V17_ENTRY" not in html
 assert "ZESTRY_PERF_V17_MENU_LOOP" not in html
 assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in html
 assert "setSubframe(false)" not in html
 assert "play(name,c,name!=='f06')" in html
 original_html_sha=sha256(content["index.html"]).hexdigest()
 clone=re.compile(r"if\(defs\)wood.appendChild\(defs.cloneNode\(true\)\);\s*wood.appendChild\(original.cloneNode\(true\)\);")
 found=len(clone.findall(html))
 if MARKER in html:
  assert found==0
  print("PATCH_ALREADY_APPLIED",flush=True)
  return
 assert found==1,("Cannot locate approved V16 wood clone site",found)
 replacement=r"""if(defs)wood.appendChild(defs.cloneNode(true));
   wood.appendChild(original.cloneNode(true));
   /* ZESTRY_V16_WOOD_MASK_ID_ONLY_20261118
      Only namespace cloned WOOD background defs so the original foreground
      Broth clip-path does not collide with a copy of __lottie_element_88.
      No changes to any Lottie frame, scene, size, position or loop. */
   const woodIdMap=new Map();
   for(const n of wood.querySelectorAll('[id]')){
     const id=n.getAttribute('id');
     if(!woodIdMap.has(id))woodIdMap.set(id,'zestry-wood-'+id);
   }
   for(const n of wood.querySelectorAll('[id]')){
     n.setAttribute('id',woodIdMap.get(n.getAttribute('id')));
   }
   for(const n of wood.querySelectorAll('*')){
     for(const a of Array.from(n.attributes)){
       if(a.name==='id')continue;
       let val=a.value;
       val=val.replace(/url\(#([^)]+)\)/g,(all,id)=>
         woodIdMap.has(id)?'url(#'+woodIdMap.get(id)+')':all);
       if(val[0]==='#'&&woodIdMap.has(val.slice(1))){
         val='#'+woodIdMap.get(val.slice(1));
       }
       if(val!==a.value)n.setAttribute(a.name,val);
     }
   }"""
 patched,n=clone.subn(lambda _:replacement,html)
 assert n==1
 assert patched.count(MARKER)==1
 assert "const zoom=1.755;" in patched
 assert "mountF01V16FixedSize" in patched
 # F01's artwork, original mask, and all food motion choreography unchanged.
 assert "ZESTRY_PERF_V17_ENTRY" not in patched
 assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in patched
 content["index.html"]=patched.encode()
 output=io.BytesIO()
 with zipfile.ZipFile(output,"w") as z:
  for name,payload in content.items():
   comp=zipfile.ZIP_STORED if Path(name).suffix in (".jpg",".webp",".lottie",".png",".woff",".woff2",".gif") else zipfile.ZIP_DEFLATED
   z.writestr(name,payload,compress_type=comp,compresslevel=6 if comp==zipfile.ZIP_DEFLATED else None)
 bundle=output.getvalue()
 with zipfile.ZipFile(io.BytesIO(bundle)) as z:
  assert z.testzip() is None
  assert len(z.namelist())==len(content)
  for name,payload in content.items():
   assert z.read(name)==payload
  for name,expected in EXPECTED.items():
   assert sha256(z.read(name)).hexdigest()==expected
 # Replace only after all checks.
 for p in parts:p.unlink()
 for idx,start in enumerate(range(0,len(bundle),512000)):
  (BUNDLE/f"part-{idx:03d}.bin").write_bytes(bundle[start:start+512000])
 print("V16_MOTION_RESTORED_WITH_MASK_ONLY",json.dumps({
 "originalBytes":len(original),"newBytes":len(bundle),
 "originalIndexSha":original_html_sha,"newIndexSha":sha256(content["index.html"]).hexdigest(),
 "changedZipEntries":["index.html"],"otherEntriesUnchanged":len(content)-1,
 "originalF01V16":EXPECTED["assets/lottie/f01-v16.json"],
 "originalChef":EXPECTED["assets/lottie/f02-orbit.json"],
 "V17PerformanceChanges":False,"V18LoopChanges":False}),flush=True)
if __name__=="__main__":main()
