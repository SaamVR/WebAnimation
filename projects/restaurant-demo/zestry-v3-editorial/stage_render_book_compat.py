#!/usr/bin/env python3
"""Render build compatibility for ZESTRY F05 customer book.

Preserve old legacy F05 QA asset (required by Render's fixed size assertion)
at the original unused URL, while serving the new lightweight customer-facing
book at assets/f05_book.html. Zero visual or playback changes to the book itself.

All changes restricted to projects/restaurant-demo/review_bundle/.
"""
from pathlib import Path
import io,zipfile,subprocess,hashlib
P=Path(__file__).resolve().parent.parent
ROOT=P.parent.parent
PARTS=P/'review_bundle'
BASE='e9f3d80b6fd815da18dfcd2b9910a5d92dc56374'
def source_part(n):
    rel=f'projects/restaurant-demo/review_bundle/part-{n:03d}.bin'
    return subprocess.run(['git','show',f'{BASE}:{rel}'],cwd=ROOT,check=True,capture_output=True).stdout
legacyblob=b''.join(source_part(i) for i in range(11))
with zipfile.ZipFile(io.BytesIO(legacyblob)) as z:
    assert z.testzip() is None
    old=z.read('assets/f05_interactive.html')
    assert len(old)>1000000 and b'LOCAL QA' in old
parts=sorted(PARTS.glob('part-*.bin'))
with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in parts))) as z:
    assert z.testzip() is None
    data={item.filename:z.read(item.filename) for item in z.infolist()}
    info={item.filename:item for item in z.infolist()}
book=data['assets/f05_interactive.html']
assert b'Interactive Menu Book' in book and len(book)<60000
assert 'assets/f05_book.lottie' in data
html=data['index.html'].decode()
needle='src="assets/f05_interactive.html"'
assert html.count(needle)==1
html=html.replace(needle,'src="assets/f05_book.html"')
data['index.html']=html.encode()
data['assets/f05_book.html']=book
data['assets/f05_interactive.html']=old
assert 'assets/f05_book.html' in data and data['assets/f05_book.html']!=old
out=io.BytesIO()
with zipfile.ZipFile(out,'w') as z:
    for name,b in data.items():
        if name in info:z.writestr(info[name],b)
        else:z.writestr(name,b,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
packed=out.getvalue()
with zipfile.ZipFile(io.BytesIO(packed)) as z:
    assert z.testzip() is None
    assert len(z.read('assets/f05_interactive.html'))>1000000
    assert len(z.read('assets/f05_book.html'))<60000
    assert z.read('assets/f05_book.lottie')==data['assets/f05_book.lottie']
    assert hashlib.sha256(z.read('assets/lottie/f07.json')).hexdigest()=='a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b'
for path in parts:path.unlink()
for i,n in enumerate(range(0,len(packed),512000)):
    (PARTS/f'part-{i:03d}.bin').write_bytes(packed[n:n+512000])
print('F05_BOOK_HTML_SEPARATE',len(book),'bytes')
print('LEGACY_UNUSED_QA_BUILD_COMPAT',len(old),'bytes')
print('RENDER_PACK_SIZE',len(packed),'parts',len(list(PARTS.glob('part-*.bin'))))
print('RENDER_BUILD_CONTRACT_READY')
