#!/usr/bin/env python3
"""ZESTRY V16 revision: 30% larger than deployed V15, FIXED SIZE from frame 0, review-only.

Preserves the canonical original F01 JSON and every vector shape, layer order,
timing, easing, and non-F01 component. Creates a derived position-only F01 asset with all flight paths retargeted
for the same fixed foreground scale at every frame. No zooming, no scaling animation.
Run on the isolated review branch. Never trigger or create a Render deployment.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import zipfile

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
PARTS = PROJECT / "review_bundle"
F01_SHA = "7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
F04_SHA = "e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0"
RELATIVE_GROWTH = 1.30
V15_FINAL = 1.35
TARGET = round(RELATIVE_GROWTH * V15_FINAL, 6)
POSITION_FACTOR = 0.82

def smooth(t: float) -> float:
    x = max(0., min(1., t))
    return x*x*(3.-2.*x)

def generate_derived(original: bytes) -> bytes:
    raw = json.loads(original)
    assert (raw["w"], raw["h"], raw["fr"], raw["op"]) == (1984, 1134, 30, 261)
    derived = copy.deepcopy(raw)
    count = 0
    for layer in derived["layers"]:
        if not 5 <= layer.get("ind", 0) <= 27:
            continue
        pos = layer.get("ks", {}).get("p", {})
        if pos.get("a") != 1:
            continue
        frames = pos.get("k", [])
        for i, keyframe in enumerate(frames):
            for side in ("s", "e"):
                value = keyframe.get(side)
                if not isinstance(value, list) or len(value) < 2:
                    continue
                time = keyframe["t"] if side == "s" or i+1 == len(frames) else frames[i+1]["t"]
                q = POSITION_FACTOR  # Fixed-size composition: retarget motion positions throughout
                value[0] = round(992. + (value[0]-992.)*q, 5)
                value[1] = round(567. + (value[1]-567.)*q, 5)
                count += 1
    assert count == 6003, count
    for base, changed in zip(raw["layers"], derived["layers"]):
        assert base["ind"] == changed["ind"] and base["nm"] == changed["nm"]
        if base.get("ind", -1) not in range(5, 28):
            assert base == changed
        else:
            x, y = copy.deepcopy(base), copy.deepcopy(changed)
            x["ks"].pop("p", None)
            y["ks"].pop("p", None)
            assert x == y, base["nm"]
    print("V16: edited position samples:", count, "canonical F01 unchanged")
    return json.dumps(derived, separators=(",", ":")).encode("utf-8")

def prepare_local_site(bundle: bytes, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(bundle)) as z:
        assert z.testzip() is None
        z.extractall(output)
    photos = PROJECT / "assets/photos"
    target_photos = output / "assets/photos"
    target_photos.mkdir(parents=True, exist_ok=True)
    for f in photos.glob("*.jpg"):
        shutil.copy2(f, target_photos / f.name)
    vendor = PROJECT / "assets/vendor/lottie.min.js"
    target_vendor = output / "assets/vendor/lottie.min.js"
    target_vendor.parent.mkdir(parents=True, exist_ok=True)
    assert vendor.is_file()
    shutil.copy2(vendor, target_vendor)
    index = output / "index.html"
    text = index.read_text()
    loop = "play(name,c,name!=='f06')"
    if loop in text:
        assert text.count(loop) == 1
        text = text.replace(loop, "play(name,c,name!=='f06'&&name!=='f03')")
    text = text.replace(
        "https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/",
        "assets/photos/"
    ).replace(
        "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
        "assets/vendor/lottie.min.js"
    )
    assert "name!=='f03'" in text and "f01-v16" in text or "name!=='f03'" in text and "mountF01V15SafeZoom" in text
    index.write_text(text)

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--review-site", type=Path)
    p.add_argument("--baseline-site", type=Path)
    args = p.parse_args()
    parts = sorted(PARTS.glob("part-*.bin"))
    assert len(parts) >= 20, "Review bundle not found"
    original_bundle = b"".join(x.read_bytes() for x in parts)
    with zipfile.ZipFile(io.BytesIO(original_bundle)) as z:
        assert z.testzip() is None
        assets = {i.filename: z.read(i.filename) for i in z.infolist()}
        metadata = {i.filename: i for i in z.infolist()}
    assert hashlib.sha256(assets["assets/lottie/f01.json"]).hexdigest() == F01_SHA
    assert hashlib.sha256(assets["assets/lottie/f04.json"]).hexdigest() == F04_SHA
    if args.baseline_site is not None:
        prepare_local_site(original_bundle, args.baseline_site)

    assets["assets/lottie/f01-v16.json"] = generate_derived(assets["assets/lottie/f01.json"])
    index = assets["index.html"].decode("utf-8")
    old_fn = "mountF01V15SafeZoom"
    new_fn = "mountF01V16FixedSize"
    index = index.replace(old_fn, new_fn)
    index = index.replace("const zoom=1+0.35*ease;", "const zoom=1.755;")
    index = index.replace("const zoom=1+0.755*ease;", "const zoom=1.755;")
    before = "fetch('assets/lottie/'+encodeURIComponent(name)+'.json')"
    after = "fetch('assets/lottie/'+encodeURIComponent(name==='f01'?'f01-v16':name)+'.json')"
    if before in index:
        assert index.count(before) == 1
        index = index.replace(before, after)
    assert index.count(after) == 1
    assert index.count("const zoom=1.755;") == 1
    assert "const zoom=1+0.755*ease;" not in index and "const zoom=1+0.35*ease;" not in index
    assert index.count("function "+new_fn) == 1
    assert index.count(new_fn+"(l,container)") == 1
    assets["index.html"] = index.encode("utf-8")

    css = assets["assets/zestry-owner-v8.css"].decode("utf-8")
    marker = "/* V16 FIXED SIZE review: F01 stays 1.755x V14 through every frame, no zoom or camera growth. */"
    if marker not in css:
        css += "\n"+marker+"\n"
    assets["assets/zestry-owner-v8.css"] = css.encode("utf-8")

    result = io.BytesIO()
    with zipfile.ZipFile(result, "w") as z:
        for filename, data in assets.items():
            if filename in metadata:
                z.writestr(metadata[filename], data)
            else:
                z.writestr(filename, data)
    final = result.getvalue()
    with zipfile.ZipFile(io.BytesIO(final)) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == 58
        assert z.read("assets/lottie/f01-v16.json") == assets["assets/lottie/f01-v16.json"]
        assert hashlib.sha256(z.read("assets/lottie/f01.json")).hexdigest() == F01_SHA
        assert hashlib.sha256(z.read("assets/lottie/f04.json")).hexdigest() == F04_SHA

    for part in parts:
        part.unlink()
    for n, start in enumerate(range(0, len(final), 512_000)):
        (PARTS / f"part-{n:03d}.bin").write_bytes(final[start:start+512_000])

    if args.review_site is not None:
        prepare_local_site(final, args.review_site)

    print("V16 FIXED FROM FRAME 0: 1.755x artwork; 0.82 ingredient-center factor; ZIP bytes", len(final))
    print("V16 REVIEW ONLY: No deploy command, hosting change or merge performed")

if __name__ == "__main__":
    main()
