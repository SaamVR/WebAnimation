from pathlib import Path
import re,base64,zipfile,io,hashlib,json,sys
src=Path(sys.argv[1]).read_text()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
m=re.search(r'<script type="text/plain" id="f05-bundle">([A-Za-z0-9+/=]+)</script>',src)
assert m,'F05 bundle missing'
bundle=base64.b64decode(m.group(1))
with zipfile.ZipFile(io.BytesIO(bundle)) as z:
 assert z.testzip() is None
 sm=json.loads(z.read('s/F05_Menu_Controller.json'))
 assert set(['Closed','Overview','Starters','Main_Courses','Desserts','Drinks']).issubset({s['name'] for s in sm['states']})
scripts=re.findall(r'<script>([\s\S]*?)</script>',src)
assert len(scripts)==2
painter,logic=scripts
painter=painter.replace("if(l.ty!==4)continue;ctx.save();","if(l.ty!==4)continue;if(l.nm==='STAGE_Background')continue;if(['Starters','Main_Courses','Desserts','Drinks'].includes(window.__f05BookState)&&(/^PAGE_(Starters|Main_Courses|Desserts|Drinks)_Food_/.test(l.nm)||l.nm.startsWith('SVG_EXACT__OPEN_Book_Open_Main_Spread_Special_Cake_')))continue;ctx.save();")
needle="const raw=atob(document.getElementById('f05-bundle').textContent.trim());const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));"
assert needle in logic
logic=logic.replace(needle,"const response=await fetch('f05_book.lottie');if(!response.ok)throw Error('F05 HTTP '+response.status);const bytes=new Uint8Array(await response.arrayBuffer());")
needle="cur=n;anim=null;stateLabel.textContent=n.replaceAll('_',' ');"
assert needle in logic
logic=logic.replace(needle,"cur=n;anim=null;window.__f05BookState=n;window.__f05Update?.(n);stateLabel.textContent=n.replaceAll('_',' ');")
idle_old="function frameLoop(now){if(anim){const state=states.get(cur),duration=anim.op-1;"
assert logic.count(idle_old)==1
logic=logic.replace(idle_old,"function frameLoop(now){if(anim){const state=states.get(cur),duration=anim.op-1;if(state.loop&&state.animation.startsWith('hold_')){auto=false;return;}",1)
needle="document.getElementById('controls').addEventListener('click',e=>{let b=e.target.closest('button[data-event]');if(b)fire(b.dataset.event)});"
assert needle in logic
logic=logic.replace(needle,'')
style=r'''
:root{font-family:system-ui,Arial,sans-serif;background:transparent;color:#18412f}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
main{width:100%;height:100%;display:block;overflow:hidden}
.viewport{position:relative;width:100%;height:100%;isolation:isolate}
.surface{position:absolute;left:-22.5%;top:-21.5%;width:145%;aspect-ratio:3/2}
#art{display:block;width:100%;height:100%;cursor:pointer;touch-action:manipulation}
.hotspots{position:absolute;inset:0;pointer-events:none}
.hotspots button{position:absolute;background:transparent;border:0;padding:0;cursor:pointer;pointer-events:auto;color:transparent;font-size:1px;touch-action:manipulation}
.hotspots button:focus-visible{outline:3px solid #d59d22;border-radius:5px;background:#fff0aa30}
.hotspots .cover{left:42%;top:24%;width:30%;height:48%}
.hotspots .cat{left:29.7%;width:17.8%;height:6.9%}
.hotspots .starters{top:36.8%}.hotspots .mains{top:45.3%}.hotspots .desserts{top:53.5%}.hotspots .drinks{top:61.8%}
.hotspots .nav{top:74.5%;width:4%;height:7%}
.hotspots .prev{left:24.8%}.hotspots .home{left:30%}.hotspots .replay{left:67%}.hotspots .next{left:72%}
.hotspots .close{top:15%;left:71.7%;width:4.5%;height:7%}
body[data-f05-state="Closed"] .hotspots .cat,body[data-f05-state="Closed"] .hotspots .nav,body[data-f05-state="Closed"] .hotspots .close{display:none}
body:not([data-f05-state="Closed"]) .hotspots .cover{display:none}
body[data-f05-busy="true"] .hotspots .cat{pointer-events:none}
.photos{position:absolute;left:52.2%;top:40.1%;width:20.0%;height:27.0%;z-index:3;display:none;grid-template-columns:repeat(2,1fr);gap:1.3%;pointer-events:auto}
.photos.visible{display:grid}.photos.single{left:54.8%;width:14.8%;grid-template-columns:1fr}
.dish{min-width:0;display:flex;flex-direction:column;border:1px solid #ddbb83;background:#fff9ed;color:#19412b;border-radius:5px;padding:4px;cursor:pointer;text-align:center;box-shadow:0 3px 6px #64391512}
.dish img{display:block;width:100%;height:63%;min-height:0;object-fit:cover;border-radius:3px}
.dish .name{font:700 clamp(6px,.8vw,11px)/1.1 Georgia,serif;flex:1;align-content:center}
.dish .price{font:700 clamp(7px,.75vw,10px)/1 system-ui;color:#b62b2d}
.dish:focus-visible{outline:3px solid #d59d22}
.hint{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media(max-width:700px){.surface{left:-42%;top:-14%;width:184%}.dish{padding:2px}.dish img{height:61%}.dish .name,.dish .price{font-size:7px}}
@media(max-width:400px){.surface{left:-46%;top:-8%;width:192%}}
'''
markup='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZESTRY — Interactive Menu Book</title><style>'''+style+'''</style></head><body data-f05-state="Closed"><main>
<div class="viewport"><div class="surface">
<canvas id="art" width="1536" height="1024" role="img" aria-label="Animated restaurant menu book"></canvas>
<div id="f05-photos" class="photos" role="group" aria-label="Food photographs for the selected page"></div>
<div class="hotspots">
<button class="cover" data-event="open" aria-label="Open menu book"></button>
<button class="cat starters" data-event="select_starters" aria-label="Choose Starters"></button>
<button class="cat mains" data-event="select_main" aria-label="Choose Main Courses"></button>
<button class="cat desserts" data-event="select_desserts" aria-label="Choose Desserts"></button>
<button class="cat drinks" data-event="select_drinks" aria-label="Choose Drinks"></button>
<button class="nav prev" data-event="previous" aria-label="Previous page"></button>
<button class="nav home" data-event="home" aria-label="Return to menu categories"></button>
<button class="nav replay" data-event="replay" aria-label="Replay page animation"></button>
<button class="nav next" data-event="next" aria-label="Next page"></button>
<button class="close" data-event="close" aria-label="Close menu book"></button>
</div></div><div id="book-hint" class="hint">Tap the book to open</div></div>
<output id="state" class="sr" aria-live="polite">Loading…</output>
</main>'''
interface=r"""
const menuPhotos={
Starters:[{id:2,name:'Garden Crunch Salad',price:13,photo:'salad.jpg'}],
Main_Courses:[{id:3,name:'Basil Pesto Farfalle',price:19,photo:'pasta.jpg'},{id:4,name:'The ZESTRY Smash',price:18,photo:'burger.jpg'}],
Desserts:[{id:6,name:'Strawberry Cloud Cake',price:11,photo:'cake.jpg'}],
Drinks:[{id:7,name:'Honey Oat Latte',price:6,photo:'coffee.jpg'},{id:8,name:'Citrus Cooler',price:7,photo:'lemonade.jpg'}]
};
window.__f05Update=(state)=>{
document.body.dataset.f05State=state;
document.body.dataset.f05Busy=String(!['Closed','Overview','Starters','Main_Courses','Desserts','Drinks'].includes(state));
const box=document.getElementById('f05-photos');const foods=menuPhotos[state]||[];
box.replaceChildren();box.className='photos'+(foods.length?' visible':'')+(foods.length===1?' single':'');
for(const food of foods){
 const btn=document.createElement('button');btn.type='button';btn.className='dish';
 btn.setAttribute('aria-label','Add '+food.name+' to demo bag for $'+food.price);
 const im=document.createElement('img');im.src='photos/'+food.photo;im.alt=food.name;
 const name=document.createElement('span');name.className='name';name.textContent=food.name;
 const price=document.createElement('span');price.className='price';price.textContent='$'+food.price+' · Add +';
 btn.append(im,name,price);btn.addEventListener('click',()=>parent.postMessage({type:'zestry:book-add',itemId:food.id},location.origin));box.append(btn);
}
document.getElementById('book-hint').textContent=state==='Closed'?'Tap the cover to open':state==='Overview'?'Choose one of the four categories':foods.length?'Tap a photo to add it to your bag':'Turning the page…';
};
document.addEventListener('click',(e)=>{const btn=e.target.closest('button[data-event]');if(btn&&window.F05_QA){e.preventDefault();window.F05_QA.fire(btn.dataset.event);}});
"""
html=markup+'<script>'+painter+'</script><script>'+interface+'</script><script>'+logic+'</script></body></html>'
assert len(html)<60000,len(html)
(out/'f05_book.html').write_text(html)
(out/'f05_book.lottie').write_bytes(bundle)
print('F05 source bytes',len(src),'new HTML',len(html),'binary',len(bundle),'sha',hashlib.sha256(bundle).hexdigest())
