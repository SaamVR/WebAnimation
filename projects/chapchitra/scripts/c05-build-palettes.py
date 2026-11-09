#!/usr/bin/env python3
"""Generate exact C05 SVG palette variants; only class paint values differ."""
from pathlib import Path
import hashlib
root=Path(__file__).resolve().parent.parent
folder=root/'src/assets/compact'
master=(folder/'compact-button-approved-original.svg').read_bytes()
expected='d3a84e9f49ff2355261914d91c7607f402e0d958305102ad9b7512d5d4d8384f'
assert hashlib.sha256(master).hexdigest()==expected
svg=master.decode('utf-8')
assert 'viewBox="0 0 164 64"' in svg and 'id="BUTTON_FACE"' in svg and 'id="BUTTON_SHADOW"' in svg
old={'st5':'#172419','st6':'#1F2216','st7':'#637565','st8':'#293D2D','st9':'#D8CEC2','st10':'#232323'}
colors={
 'forest':{'st5':'#172419','st6':'#1F2216','st7':'#637565','st8':'#293D2D','st9':'#D8CEC2','st10':'#232323'},
 'terracotta':{'st5':'#1F2216','st6':'#1F2216','st7':'#6E523F','st8':'#8A503B','st9':'#D8CEC2','st10':'#232323'},
 'neutral':{'st5':'#8A503B','st6':'#1F2216','st7':'#637565','st8':'#A6A29B','st9':'#E4E3DE','st10':'#232323'}
}
for name,m in colors.items():
 result=svg
 for cls,color in old.items():
  find=f'.{cls}{{fill:{color};}}'
  repl=f'.{cls}{{fill:{m[cls]};}}'
  assert result.count(find)==1,(cls,name)
  result=result.replace(find,repl,1)
 reverse=result
 for cls,color in old.items():
  reverse=reverse.replace(f'.{cls}{{fill:{m[cls]};}}',f'.{cls}{{fill:{color};}}',1)
 assert reverse==svg,'Non-paint source content changed'
 dest=folder/f'compact-button-{name}.svg'
 dest.write_text(result,encoding='utf8')
 print(name,len(result.encode()),hashlib.sha256(dest.read_bytes()).hexdigest())
print('SOURCE VERIFIED',expected)
