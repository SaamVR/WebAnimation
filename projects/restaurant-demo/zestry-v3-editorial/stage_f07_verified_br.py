#!/usr/bin/env python3
from pathlib import Path
import io,zipfile,hashlib,json,subprocess
P=Path(__file__).resolve().parent.parent
BR=P/'assets/lottie/f07_owner_v5.json.br'
PARTS=P/'review_bundle'
V4='2da907e4944f08de9e1580a029e8db05ab450a2c44dec36c6f52dcbe3dc9377e'
V5='a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b'
def main():
 assert BR.is_file(),f'Missing owner V5 compressed source: {BR}'
 new=subprocess.run(['node','-e',"process.stdout.write(require('zlib').brotliDecompressSync(require('fs').readFileSync(process.argv[1])))",str(BR)],capture_output=True,check=True).stdout
 assert hashlib.sha256(new).hexdigest()==V5,'Source does not match owner upload'
 art=json.loads(new)
 assert art['w']==960 and art['h']==720 and art['fr']==30 and art['op']==228 and len(art['layers'])==25
 parts=sorted(PARTS.glob('part-*.bin'))
 assert len(parts)>=11
 with zipfile.ZipFile(io.BytesIO(b''.join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  info={f.filename:f for f in z.infolist()}
  files={f.filename:z.read(f.filename) for f in z.infolist()}
 existing=hashlib.sha256(files['assets/lottie/f07.json']).hexdigest()
 assert existing in (V4,V5),f'Unexpected F07 parent asset {existing}'
 files['assets/lottie/f07.json']=new
 files['F07_V5_OWNER_SOURCE.md']=('# F07 V5 owner final reservation animation\n\nOriginal ZIP: F07_Table_Reservation_Edited_SVG_V5_Complete_Package(1).zip\nSHA-256: '+V5+'\n25 native shape layers; 960x720, 30fps, 228 frames (7.6 seconds).\n22 native vector artwork layers changed; original V4 motion tracks preserved.\nReplaces F07 in inline reservation section and simulated booking confirmation.\nNo deployment; original Lottie-web playback and owner visual review are release gates.\n').encode()
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w') as z:
  for n,content in files.items():
   if n in info:z.writestr(info[n],content)
   else:z.writestr(n,content,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
 bundle=out.getvalue()
 with zipfile.ZipFile(io.BytesIO(bundle)) as z:
  assert z.testzip() is None
  assert hashlib.sha256(z.read('assets/lottie/f07.json')).hexdigest()==V5
 for p in parts:p.unlink()
 for i,off in enumerate(range(0,len(bundle),512000)):
  (PARTS/('part-%03d.bin'%i)).write_bytes(bundle[off:off+512000])
 print('F07_V5_INSTALLED','sha',V5,'parts',len(list(PARTS.glob('part-*.bin'))),'bytes',len(bundle),'NO_DEPLOYMENT')
if __name__=='__main__':main()
