#!/usr/bin/env python3
"""Dry-run/contract tests. Run: python -m unittest discover -s
projects/restaurant-demo/zestry-v3-editorial -p 'test_visible_loops.py' -v
No hosted preview or modifications to the source archive.
"""
import io
import importlib.util
import tempfile
import unittest
import zipfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('visible',HERE/'enable_visible_loops.py')
visible=importlib.util.module_from_spec(spec)
spec.loader.exec_module(visible)
PAGE='''<!doctype html><style>
/* ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118 */
/* ZESTRY_F02_OWNER_FULL360_SINGLE_20261119 */
</style><div data-animation="f02-chef-full360"></div><script>
async function play(name,container,loop=false){
if(name==='f01'||name==='f02-chef-full360'||name==='f03'||name==='f07')loop=false;
if(name==='f01'){broth.hasMask=true;}
if(name==='f03'){const keep=true;}
const l=lottie.loadAnimation({container,loop,autoplay:true,renderer:'svg'});
container.dataset.loaded='yes';
}
function askBooking(){return 'ok'}
for(const c of document.querySelectorAll('.anim'))play(name,c,name!=='f06')
</script>'''

class VisibleReplayContracts(unittest.TestCase):
 def test_transform_is_forward_visible_only_and_idempotent(self):
  page=visible.change_page(PAGE)
  self.assertEqual(visible.change_page(page),page)
  for needed in ("loop=true;","autoplay:false",
                 "zestryMotionAttach(l,container);","!document.hidden",
                 "isIntersecting&&e.intersectionRatio>0",
                 "zestryMotionReduced.matches",
                 "play(name,c,name!=='f06')","broth.hasMask=true"):
   self.assertIn(needed,page)
  self.assertEqual(page.count(visible.MARK),1)
  self.assertNotIn("setDirection(",page)
 def test_rejects_obsolete_two_chefs(self):
  with self.assertRaises(AssertionError):
   visible.change_page(PAGE.replace("f02-chef-full360","f02-cooking"))
 def test_only_html_changes_in_zip(self):
  with tempfile.TemporaryDirectory() as tmp:
   parts=Path(tmp)/"review_bundle";parts.mkdir()
   data={"index.html":PAGE.encode()}
   data.update({f"assets/a{i:02d}.txt":b"unchanged"+bytes([i]) for i in range(50)})
   for k in visible.IMMUTABLE:data[k]=b"mock original "+k.encode()
   originals={k:visible.sha(v) for k,v in data.items()}
   old_parts,old_immutable=visible.BUNDLE,visible.IMMUTABLE
   try:
    visible.BUNDLE=parts
    visible.IMMUTABLE={k:originals[k] for k in old_immutable}
    with io.BytesIO() as mem:
     with zipfile.ZipFile(mem,'w') as z:
      for name,blob in data.items():z.writestr(name,blob)
     packed=mem.getvalue()
    (parts/'part-000.bin').write_bytes(packed)
    self.assertEqual(visible.patch(True)['status'],"dry-run-ready")
    self.assertEqual(visible.patch()['status'],"bundle-patched")
    self.assertEqual(visible.patch()['status'],"already-integrated")
    with zipfile.ZipFile(io.BytesIO(b''.join(
        p.read_bytes() for p in sorted(parts.glob('part-*.bin'))))) as z:
     self.assertIn(visible.MARK,z.read('index.html').decode())
     for k,digest in originals.items():
      if k!="index.html":self.assertEqual(visible.sha(z.read(k)),digest)
   finally:
    visible.BUNDLE=old_parts
    visible.IMMUTABLE=old_immutable

if __name__=='__main__':unittest.main()
