(()=>{'use strict';
/** BLOOM TO BOTTLE: Product-grade motion study.
 * Story is rendered entirely from a timestamp, with a separate optional hover/wind input.
 * The plant draws, the pigment converges, glass materializes, then the product becomes shoppable.
 * Playback: window.renderAt(ms), document.querySelector('#scene'), ?render=1.
 */
const c=document.querySelector('#scene'),g=c.getContext('2d',{alpha:false}),W=1440,H=810,D=11600,TAU=Math.PI*2;
const q=s=>document.querySelector(s),cl=(n,a=0,b=1)=>Math.min(b,Math.max(a,n)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=cl(t);return t*t*(3-2*t)},out=t=>1-Math.pow(1-cl(t),3),back=t=>{t=cl(t)-1;return 1+2.12*t*t*t+1.12*t*t},win=(t,a,b)=>cl((t-a)/(b-a)),stage=(t,a,b,e=smooth)=>e(win(t,a,b)),fade=(t,a,b)=>stage(t,a,a+.42)*(1-stage(t,b-.45,b));
const seed=n=>{const a=Math.sin(n*127.1+13.92)*43758.5453;return a-Math.floor(a)};
const variants={rose:{petal:'#d79ca6',light:'#efd4cc',dark:'#a76b7a',leaf:'#728f74',glass:'#ad7c52',glow:'#e8bf9c'},violet:{petal:'#a7a4d5',light:'#ddd5ed',dark:'#8181bd',leaf:'#6c8685',glass:'#987454',glow:'#c0aee2'},citrus:{petal:'#dec17a',light:'#f3dea8',dark:'#bd9b52',leaf:'#799575',glass:'#b4883c',glow:'#ead18c'}};
let variant='rose',time=0,playing=false,prev=0,raf=0,wind=0,bag=0,purchaseStart=0,mediaRecorder=null;
function fillPath(points,stroke,width,progress=1,blur=0){const count=Math.min(points.length-1,Math.round((points.length-1)*cl(progress)));if(count<1)return;g.save();g.beginPath();g.moveTo(...points[0]);for(let i=1;i<=count;i++)g.lineTo(...points[i]);g.strokeStyle=stroke;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.shadowBlur=blur;g.shadowColor=stroke;g.stroke();g.restore()}
function curve(a,b,d,e,n=90){let r=[];for(let i=0;i<=n;i++){let t=i/n,k=1-t;r.push([k*k*k*a[0]+3*k*k*t*b[0]+3*k*t*t*d[0]+t*t*t*e[0],k*k*k*a[1]+3*k*k*t*b[1]+3*k*t*t*d[1]+t*t*t*e[1]])}return r}
function circle(x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
function round(x,y,w,h,r,color,stroke,lw=1){g.beginPath();g.roundRect(x,y,w,h,r);if(color){g.fillStyle=color;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function soft(x,y,r,a,b){let f=g.createRadialGradient(x,y,0,x,y,r);f.addColorStop(0,a);f.addColorStop(1,b);g.fillStyle=f;g.fillRect(x-r,y-r,r*2,r*2)}
function letters(txt,x,y,font,col,spacing=0){g.fillStyle=col;g.font=font;g.textAlign='center';if(spacing){for(let i=0;i<txt.length;i++)g.fillText(txt[i],x+(i-(txt.length-1)/2)*spacing,y)}else g.fillText(txt,x,y);g.textAlign='left'}
function botanic(t,p,disappear){const growth=stage(t,.48,3.30,out),blossom=stage(t,2.55,4.20,out);if(disappear<.01)return;
 g.save();g.globalAlpha=disappear;g.translate(wind*18,0);
 const root=curve([965,729],[870,624],[1074,539],[972,332],160);
 fillPath(root,'#62876c',13,growth,8);fillPath(root,'#d8e5b4',3.2,growth);
 for(let j=0;j<5;j++){const u=stage(t,1.13+j*.38,2.05+j*.39,out),a=root[32+j*22],dir=j%2===0?-1:1;
  const tip=[a[0]+dir*(120+j*7)+wind*11,a[1]-50-j*4];
  const edge=curve(a,[a[0]+dir*55,a[1]-101],[tip[0]-dir*25,tip[1]-31],tip,70);
  const retreat=curve(tip,[tip[0]-dir*35,tip[1]+75],[a[0]+dir*26,a[1]+34],a,70);
  fillPath(edge,p.leaf,10,u,6);fillPath(retreat,'#a2b28e',6,u,1);
  fillPath(curve(a,[a[0]+dir*70,a[1]-30],tip,tip,64),'#d6ddad',2,u);
 }
 g.translate(972,332);g.rotate(Math.sin(t*.65)*.034+wind*.062);
 // Nine sculpted ribbons draw out in a sequence, with offset veins and pigment edges.
 for(let i=0;i<9;i++){const a=i*TAU/9-Math.PI/2,progress=stage(t,2.30+i*.12,3.64+i*.115,out)*blossom;
 const r=122+16*Math.sin(i*2.29),arr=[];for(let z=0;z<=80;z++){let k=z/80,th=a+Math.sin(k*Math.PI)*(.16+.026*i),rad=18+r*k,side=22*Math.sin(k*Math.PI);arr.push([Math.cos(th)*rad-Math.sin(th)*side,Math.sin(th)*rad+Math.cos(th)*side])}
 fillPath(arr,i%3===0?p.dark:i%2?p.petal:p.light,13,progress,12);fillPath(arr.map(([x,y])=>[x*.86,y*.86]),'#fff7e899',2.2,progress);
 }
 const core=stage(t,3.65,4.36);g.globalAlpha*=core;for(let i=0;i<27;i++){let a=i*2.39996,r=4+Math.sqrt(i)*5;circle(Math.cos(a)*r,Math.sin(a)*r,1.8+seed(i)*2.1,i%3?'#ebcd8e':'#f7e5b0')}g.restore();
}
function pigment(t,p){const travel=stage(t,3.9,5.36);if(travel===0||travel===1)return;
 // Pigment releases from the flower and is pulled in an arc towards glass.
 for(let i=0;i<74;i++){const j=seed(i+29),k=seed(i+105),local=stage(t,3.87+j*.38,5.17+k*.32),ang=TAU*j*3.7;
 const fromX=972+Math.cos(ang)*(60+seed(i+9)*130),fromY=332+Math.sin(ang)*(60+seed(i+19)*120);
 const toX=952+(j-.5)*186,toY=508+(k-.5)*250;
 let x=mix(fromX,toX,local)+Math.sin(local*Math.PI)*(i%2?110:-90),y=mix(fromY,toY,local)-110*Math.sin(local*Math.PI);
 g.globalAlpha=Math.sin(local*Math.PI)*.72;circle(x,y,1.5+seed(i+77)*4,i%3?p.light:p.petal);
 }g.globalAlpha=1;
}
function backdrop(t,p){g.clearRect(0,0,W,H);const grad=g.createLinearGradient(0,0,1440,810);grad.addColorStop(0,'#f4f0e6');grad.addColorStop(1,'#e5e5d6');g.fillStyle=grad;g.fillRect(0,0,W,H);
 soft(1111,344,470,p.light+'55','#f6f0e300');
 g.save();g.translate(954,423);g.rotate(-.19);g.beginPath();g.ellipse(0,0,359,326,0,0,TAU);g.fillStyle='#d9dfce';g.fill();g.beginPath();g.ellipse(0,0,319,289,0,0,TAU);g.strokeStyle='#fbfbf0';g.lineWidth=2;g.stroke();g.restore();
 g.save();g.setLineDash([3,10]);g.strokeStyle='#849d8933';g.lineWidth=1.5;g.beginPath();g.ellipse(964,396,389,334,-.19,0,TAU);g.stroke();g.restore();
 // Catalog furniture is quiet so the plant-to-bottle transformation remains focal.
 g.strokeStyle='#96a99a66';g.lineWidth=1;g.beginPath();g.moveTo(618,666);g.lineTo(1296,666);g.stroke();
 for(let i=0;i<56;i++){let x=610+seed(i)*752,y=83+seed(i+31)*580;circle(x,y,.65+seed(i+10), '#8798872b')}
 round(62,47,38,38,12,'#254638');letters('✳',81,75,'bold 21px DM Sans','#e7edbd');g.textAlign='left';g.font='700 16px Space Grotesk';g.fillStyle='#345743';g.fillText('FLORA',109,73);g.textAlign='right';g.fillStyle='#77917b';g.font='600 12px Space Grotesk';g.fillText('AN INGREDIENT STORY · 003',1371,70);g.textAlign='left';
}
function bottle(t,p,opacity){if(opacity<=0)return;const enter=stage(t,4.38,5.35,back),rotateIn=(1-enter)*-12,scale=mix(.78,1,enter);const breathing=Math.sin(t*1.4)*2;const x=963+wind*9,y=496+breathing;
 g.save();g.globalAlpha=opacity;g.translate(x,y);g.rotate(rotateIn*Math.PI/180);g.scale(scale,scale);
 // Bottle rests on a clear contact plane; its material is not merely a flat icon.
 g.save();g.globalAlpha*=.23;g.fillStyle='#677c5d';g.filter='blur(20px)';g.beginPath();g.ellipse(0,164,162,25,0,0,TAU);g.fill();g.restore();
 soft(0,-42,225,p.glow+'80','#e8dcc000');
 const glass=g.createLinearGradient(-110,0,111,0);glass.addColorStop(0,'#71552f');glass.addColorStop(.10,p.glass);glass.addColorStop(.31,'#d6af79');glass.addColorStop(.7,p.glass);glass.addColorStop(1,'#77542d');
 round(-108,-114,216,274,24,glass,'#987851',3);
 // Bottom thickness and glass edge highlights.
 round(-100,142,200,13,[0,0,4,4],'#e4c28e44');
 g.strokeStyle='#fceac766';g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(-92,-82);g.lineTo(-92,115);g.stroke();g.strokeStyle='#5d442a88';g.lineWidth=5;g.beginPath();g.moveTo(94,-77);g.lineTo(94,124);g.stroke();
 // Pipette collar and satin-black top.
 round(-47,-151,94,42,9,'#223d32','#19372c',3);
 let cap=g.createLinearGradient(-47,0,47,0);cap.addColorStop(0,'#1c342a');cap.addColorStop(.4,'#627264');cap.addColorStop(1,'#20372e');round(-43,-226,86,82,13,cap,'#284a3c',2);
 for(let i=0;i<12;i++){g.globalAlpha=opacity*.14;round(-32+i*5,-213,1,53,1,'#e3dbba')}g.globalAlpha=opacity;
 round(-50,-117,100,9,4,'#cba87c');
 // A cosmetic matte stock label; lettering reveals after the glass settles.
 const label=stage(t,5.38,6.36,out);g.globalAlpha=opacity*label;
 round(-86,-58,172,174,5,'#f5f0df','#d8c9aa',1.5);
 g.save();g.translate(0,13);g.strokeStyle=p.leaf;g.lineWidth=2.5;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-15,-21,-16,-43,0,-54);g.stroke();
 for(let j=0;j<4;j++){let h=-j*12;g.fillStyle=j%2?p.light:p.leaf;g.beginPath();g.ellipse(j%2?13:-13,h-6,13,6,j%2?-.5:.5,0,TAU);g.fill()}g.restore();
 letters('F L O R A',0,61,'600 20px Space Grotesk','#314e3e');letters('BOTANICAL GLOW',0,84,'600 10px Space Grotesk','#63755c');letters('SERUM · 30 ML',0,100,'500 9px Space Grotesk','#85917b');g.globalAlpha=opacity;
 // Glancing reflection crosses the bottle once materialization is complete.
 const glint=stage(t,6.62,7.5);if(glint>0&&glint<1){g.save();g.beginPath();g.roundRect(-108,-114,216,274,24);g.clip();g.translate(mix(-270,200,glint),0);g.rotate(-.25);g.fillStyle='#fffdfb32';g.fillRect(-13,-160,26,350);g.restore()}
 g.restore();
}
function petalsAndSparkles(t,p){const sustain=stage(t,5.08,5.90)*(1-stage(t,10.7,11.45));if(sustain<.001)return;
 g.save();g.globalAlpha=sustain;
 for(let i=0;i<35;i++){const a=i*2.39996+Math.sin(t*.27+i)*.1,r=170+seed(i+6)*150;
 let x=960+Math.cos(a)*r+wind*14,y=407+Math.sin(a)*r*.74+Math.sin(t*.8+i)*8;
 let size=1.4+seed(i+12)*3.2;circle(x,y,size,i%3===0?p.petal:i%2===0?p.leaf:'#fff2c2');
 }
 g.strokeStyle=p.dark+'66';g.setLineDash([2,12]);g.lineWidth=2;g.beginPath();g.ellipse(963,454,250,217,.08,0,TAU);g.stroke();g.setLineDash([]);g.restore();
}
function framing(t,p){if(window.innerWidth<=700)return;const reveal=stage(t,7.08,7.75,out);g.globalAlpha=reveal;
 g.textAlign='center';g.font='600 13px Space Grotesk';g.fillStyle='#4a7457';g.fillText('PLANT-INSPIRED · EVERYDAY RITUAL',962,735);
 g.strokeStyle=p.leaf;g.lineWidth=2.4;g.beginPath();g.moveTo(821,750);g.lineTo(1105,750);g.stroke();g.globalAlpha=1;
 g.textAlign='left';g.font='600 14px Space Grotesk';g.fillStyle='#738673';g.fillText(t<3?'01 / THE BOTANICAL':t<5.6?'02 / THE TRANSFORMATION':t<7.45?'03 / THE FORMULA':'04 / THE RITUAL',70,739);
 g.fillStyle='#bccdb6';g.fillRect(70,763,382,4);g.fillStyle=p.leaf;g.fillRect(70,763,382*(t*1000/D),4);
}
function purchaseEffect(now,p){if(!purchaseStart)return;const u=cl((now-purchaseStart)/1000);if(u>=1){purchaseStart=0;return}g.save();g.globalAlpha=1-u;for(let i=0;i<16;i++){let a=i*TAU/16,dist=40+105*out(u);circle(960+Math.cos(a)*dist,450+Math.sin(a)*dist,4*(1-u)+1,i%2?p.petal:'#5c9472')}g.restore()}
function render(ms){time=cl(ms,0,D);let t=time/1000,p=variants[variant];g.setTransform(1,0,0,1,0,0);
 backdrop(t,p);const plantFade=1-stage(t,4.18,5.45);botanic(t,p,plantFade);pigment(t,p);petalsAndSparkles(t,p);bottle(t,p,stage(t,4.39,5.19));framing(t,p);
 if(purchaseStart)purchaseEffect(performance.now(),p);
 q('#seek').value=time;q('#clock').textContent=`00:${String(Math.floor(t)).padStart(2,'0')} / 00:11`;
 const shown=t>=7.2;const ui=q('#product');ui.classList.toggle('active',shown);q('#buy').disabled=!shown;
 }
function pause(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;prev=0;q('#play').textContent='Play ▶'}
function tick(now){if(!playing)return;if(!prev)prev=now;let next=time+Math.min(65,now-prev);prev=now;if(next>=D){pause();render(D);return}render(next);raf=requestAnimationFrame(tick)}
function play(){if(playing)return;if(time>=D)render(0);playing=true;prev=0;q('#play').textContent='Pause II';raf=requestAnimationFrame(tick)}
q('#play').onclick=()=>playing?pause():play();q('#replay').onclick=()=>{pause();render(0);play()};q('#seek').oninput=e=>{pause();render(+e.target.value)};
for(let b of document.querySelectorAll('[data-color]'))b.onclick=()=>{variant=b.dataset.color;for(let x of document.querySelectorAll('[data-color]'))x.setAttribute('aria-pressed',String(x===b));render(time)};
c.addEventListener('pointermove',e=>{let r=c.getBoundingClientRect();wind=cl(((e.clientX-r.left)/r.width-.5)*2,-1,1);if(!playing)render(time)});c.addEventListener('pointerleave',()=>{wind=0;if(!playing)render(time)});
q('#buy').onclick=()=>{bag++;q('#bag').textContent=`BAG (${bag})`;q('#toast').classList.add('visible');q('#buy').textContent='ADDED ✓';purchaseStart=performance.now();setTimeout(()=>{q('#toast').classList.remove('visible');q('#buy').innerHTML='ADD TO BAG <span aria-hidden="true">↗</span>'},1700);if(!playing){const pulse=()=>{render(time);if(purchaseStart)requestAnimationFrame(pulse)};requestAnimationFrame(pulse)}};
const record=q('#record');record.onclick=()=>{if(!c.captureStream||!window.MediaRecorder){record.textContent='Unsupported';return}const type=['video/webm;codecs=vp9','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));if(!type){record.textContent='WebM unavailable';return}if(mediaRecorder?.state==='recording')return;
 pause();render(0);const stream=c.captureStream(30),chunks=[];mediaRecorder=new MediaRecorder(stream,{mimeType:type});mediaRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};mediaRecorder.onstop=()=>{const file=new Blob(chunks,{type}),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='bloom-to-bottle.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),25000);stream.getTracks().forEach(x=>x.stop());record.textContent='Record WebM'};
 mediaRecorder.start();record.textContent='Recording…';const start=performance.now();function capture(now){let m=Math.min(now-start,D);render(m);if(m<D)requestAnimationFrame(capture);else mediaRecorder.stop()}requestAnimationFrame(capture)};
const params=new URLSearchParams(location.search),renderOnly=params.has('render')||params.has('preview');if(renderOnly)document.body.classList.add('render-only');
render(0);if(!params.has('render')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)play();else if(matchMedia('(prefers-reduced-motion: reduce)').matches)render(7900);
window.motionReady=true;window.renderAt=ms=>{pause();render(ms)};window.motionStats=()=>({duration:D,time,variant,bag});
})();
