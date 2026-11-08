#!/usr/bin/env python3
"""Rebuild C08's approved dark-background inverted fill-only theme, without changing source keyframes."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "src/assets/c08"
SOURCE_JSON = ASSETS / "wordmark-reprint-original.json"
SOURCE_SVG = ASSETS / "approved-master-source.svg"
EXPECTED_JSON_SHA = "e3887a7187f845099a4948c3a8a3ff2b85dc650b381635cc6db5e3aa68d33876"
EXPECTED_SVG_SHA = "093b1d63ce8e572caa9f605cf1c786f174a2b3505d228b7279d51982c63cd4a3"

CREAM = (228/255,227/255,222/255)        # #E4E3DE
TERRACOTTA = (138/255,80/255,59/255)     # #8A503B
GRAPHITE = (.1373,.1373,.1373)
PRESS_GREEN = (.1608,.2392,.1765)
GALLERY_WHITE = (.9647,.9686,.9608)
COLOR_MAP = {GRAPHITE:CREAM,PRESS_GREEN:TERRACOTTA,GALLERY_WHITE:CREAM}

def sha(data):return hashlib.sha256(data).hexdigest()
source_bytes=SOURCE_JSON.read_bytes()
svg_bytes=SOURCE_SVG.read_bytes()
assert sha(source_bytes)==EXPECTED_JSON_SHA,"Immutable original C08 source JSON changed"
assert sha(svg_bytes)==EXPECTED_SVG_SHA,"Immutable original C08 source SVG changed"
original=json.loads(source_bytes)
assert (original["w"],original["h"],original["fr"],original["ip"],original["op"])==(2400,550,60,0,240)
assert len(original["layers"])==6 and not original.get("assets")
version=json.loads(source_bytes)
counter={k:0 for k in COLOR_MAP}

def walk(node):
    if isinstance(node,list):
        for x in node:walk(x)
    elif isinstance(node,dict):
        if node.get("ty") in ("fl","st"):
            color=node.get("c",{})
            if color.get("a")==0 and isinstance(color.get("k"),list):
                previous=tuple(color["k"])
                if previous not in COLOR_MAP:
                    raise ValueError("Unexpected original C08 color; refusing unreviewed mapping: "+repr(previous))
                counter[previous]+=1
                color["k"]=list(COLOR_MAP[previous])
            elif color.get("a")!=0:
                raise ValueError("Unexpected animated fill/stroke color, must inspect before mapping")
        for v in node.values():walk(v)

walk(version)
assert counter=={GRAPHITE:21,PRESS_GREEN:6,GALLERY_WHITE:1},counter

# Establish that the complete non-color structure (including transforms, paths,
# keyframes, easing, layers, timing) remains byte-value-identical after color inversion.
reversed_version=json.loads(json.dumps(version))
def restore(node):
    if isinstance(node,list):
        for x in node:restore(x)
    elif isinstance(node,dict):
        if node.get("ty") in ("fl","st") and node.get("c",{}).get("a")==0:
            vec=node["c"]["k"]
            # Distinguish the two source groups that now share Cream by
            # their unaltered deterministic occurrence order.
        for v in node.values():restore(v)

# A path-specific color mask proves everything else is unchanged.
def without_fills(node):
    if isinstance(node,list):return [without_fills(x) for x in node]
    if isinstance(node,dict):
        out={}
        for k,v in node.items():
            if node.get("ty") in ("fl","st") and k=="c":
                out[k]={"a":v["a"],"k":"COLOR_ONLY"}
            else:out[k]=without_fills(v)
        return out
    return node

assert without_fills(original)==without_fills(version),"Non-color Lottie structure changed"
found=set()
def collect(node):
    if isinstance(node,list):
        for x in node:collect(x)
    elif isinstance(node,dict):
        if node.get("ty") in ("fl","st") and node.get("c",{}).get("a")==0:
            found.add(tuple(node["c"]["k"]))
        for v in node.values():collect(v)
collect(version)
assert found=={CREAM,TERRACOTTA},found

json_bytes=(json.dumps(version,separators=(",",":"),ensure_ascii=False)+"\n").encode("utf-8")
for out in ["wordmark-reprint-hero-light.json","wordmark-reprint-dark-inverted-v2.json"]:
    (ASSETS/out).write_bytes(json_bytes)

# Derived vector theme; the original SVG remains byte-exact for navbar source.
svg=svg_bytes.decode("utf-8")
for source,color in [("#232323","#E4E3DE"),("#293D2D","#8A503B"),("#F6F7F5","#E4E3DE")]:
    assert source in svg,source
    svg=svg.replace(source,color)
assert "#293D2D" not in svg and "#F6F7F5" not in svg and "#232323" not in svg
(ASSETS/"wordmark-reprint-dark-inverted-v2.svg").write_text(svg.replace("\r\n","\n"),encoding="utf-8")
print("C08 corrected mapped fills:",counter,
      "derived JSON sha:",sha(json_bytes),
      "SVG original untouched:",sha(SOURCE_SVG.read_bytes())==EXPECTED_SVG_SHA)
