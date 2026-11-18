#!/usr/bin/env python3
"""ZESTRY V13 — rebuild the review ZIP from existing parts and the reviewed hero CSS.

Run from this repository in a working tree, BEFORE integrating/redeploying.
Requires only Python stdlib; changes are strictly within projects/restaurant-demo/.
Do not deploy automatically.
"""
from pathlib import Path
import hashlib
import io
import zipfile

SOURCE = Path(__file__).resolve().parent
PROJECT = SOURCE.parent
BUNDLE = PROJECT / "review_bundle"
CSS = SOURCE / "zestry-owner-v8.css"
EXPECTED = {
    "assets/lottie/f01.json": "7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
    "assets/lottie/f03.json": "136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68",
    "assets/lottie/f04.json": "e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0",
    "assets/lottie/f07.json": "a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b",
    "assets/f05_book.lottie": "3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645",
}
def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

parts = sorted(BUNDLE.glob("part-*.bin"))
if len(parts) < 20:
    raise RuntimeError(f"V12 bundle missing: found {len(parts)} parts")
css = CSS.read_bytes()
if b"width:min(100%,582px)!important;max-width:582px!important" not in css:
    raise RuntimeError("Expected safe +20% desktop circular hero CSS missing")
if b"inset:8%!important;" not in css or b"width:84%!important;" not in css:
    raise RuntimeError("Original no-crop foreground framing missing")
with zipfile.ZipFile(io.BytesIO(b"".join(part.read_bytes() for part in parts))) as z:
    if z.testzip() is not None:
        raise RuntimeError("Input review bundle ZIP failed integrity check")
    metadata = {entry.filename: entry for entry in z.infolist()}
    assets = {entry.filename: z.read(entry.filename) for entry in z.infolist()}
for name, expected in EXPECTED.items():
    if sha256(assets[name]) != expected:
        raise RuntimeError(f"Original approved asset changed: {name}")
html = assets["index.html"].decode("utf-8")
if "mountF01WoodBackdrop(l,container)" not in html or 'data-animation="f04"' in html:
    raise RuntimeError("Existing approved V12 Lottie integration unexpected")
assets["assets/zestry-owner-v8.css"] = css
output = io.BytesIO()
with zipfile.ZipFile(output, "w") as z:
    for name, data in assets.items():
        z.writestr(metadata[name], data)
newzip = output.getvalue()
with zipfile.ZipFile(io.BytesIO(newzip)) as z:
    if z.testzip() is not None or z.read("assets/zestry-owner-v8.css") != css:
        raise RuntimeError("Output ZIP integrity mismatch")
    for name, expected in EXPECTED.items():
        if sha256(z.read(name)) != expected:
            raise RuntimeError(f"Original approved asset changed in output: {name}")
# Replace parts only after every preflight and output check passed.
newparts = [newzip[i : i + 512_000] for i in range(0, len(newzip), 512_000)]
for part in parts:
    part.unlink()
for i, data in enumerate(newparts):
    (BUNDLE / f"part-{i:03d}.bin").write_bytes(data)
print(f"V13_REVIEW_BUNDLE_READY {len(newzip)} bytes / {len(newparts)} parts")
print("NO_ANIMATION_SOURCE_CHANGES. DO NOT DEPLOY WITHOUT OWNER REQUEST.")
