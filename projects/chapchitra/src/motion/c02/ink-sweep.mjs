// CHAPCHITRA C02: owner-review candidate. Navigation-only; no commerce hooks.
export const C02_PATHS = Object.freeze(['/shop/','/artists-edit/','/journal/','/about/']);
export function isC02Eligible({page,pathname,source,modified=false,sameOrigin=true,download=false,target='_self'}){
 return page==='home' && C02_PATHS.includes(pathname)
  && (source==='primary'||source==='mobile') && !modified && sameOrigin
  && !download && (!target||target==='_self');
}
const KEY='chapchitra-c02-arrival-v1';
const COVER_MS=310, REVEAL_MS=285, TICKET_TTL=12000;
const INK_SVG='<svg viewBox="0 0 1200 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
 +'<path fill="#172419" d="M0 0H1097C1118 43 1093 76 1114 118C1144 166 1074 231 1118 269S1090 381 1121 432S1083 552 1120 600S1082 736 1118 782S1088 854 1110 900H0Z"/>'
 +'<path fill="#293D2D" d="M0 0H1070C1105 52 1044 112 1091 170S1052 298 1096 359S1052 462 1101 536S1058 651 1088 702S1058 838 1090 900H0Z"/>'
 +'<path d="M1081 15C1111 78 1057 129 1098 184S1068 299 1095 358S1068 478 1098 536S1068 654 1094 707S1067 846 1093 894" fill="none" stroke="#8A503B" stroke-opacity=".76" stroke-width="4" stroke-linecap="round"/>'
 +'<path d="M1102 165l12 16-8 14-14-12zM1109 503l10 15-8 18-12-11zM1100 743l15 11-8 17-11-10z" fill="#8A503B" fill-opacity=".58"/>'
 +'</svg>';
function overlayFor(doc){
 if(!doc.getElementById('c02-ink-style')){
  const style=doc.createElement('style');style.id='c02-ink-style';
  style.textContent=[
   '.c02-ink-sweep{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;contain:paint;isolation:isolate}',
   '.c02-ink-surface{position:absolute;left:0;top:0;width:124vw;height:100%;transform:translate3d(-112%,0,0);will-change:transform}',
   '.c02-ink-surface svg{display:block;width:100%;height:100%;overflow:visible}',
   '@media(prefers-reduced-motion:reduce){.c02-ink-sweep{display:none}}'
  ].join('');
  doc.head.append(style);
 }
 const overlay=doc.createElement('div');overlay.className='c02-ink-sweep';
 overlay.dataset.c02='ink-sweep';overlay.setAttribute('aria-hidden','true');
 const surface=doc.createElement('div');surface.className='c02-ink-surface';
 surface.innerHTML=INK_SVG;overlay.append(surface);doc.body.append(overlay);
 return {overlay,surface};
}
function consumeTicket(win){
 try{
  const raw=win.sessionStorage.getItem(KEY);
  if(!raw)return false;
  win.sessionStorage.removeItem(KEY);
  const ticket=JSON.parse(raw);
  const age=Date.now()-ticket.created;
  return ticket.path===win.location.pathname&&age>=0&&age<TICKET_TTL;
 }catch{return false;}
}
function storeTicket(win,path){
 try{win.sessionStorage.setItem(KEY,JSON.stringify({path,created:Date.now()}));}catch{}
}
function animateInk(win,surface,keyframes,duration,done){
 if(typeof surface.animate!=='function'){done();return;}
 let finished=false;
 let guard;
 const complete=()=>{if(finished)return;finished=true;win.clearTimeout(guard);done();};
 guard=win.setTimeout(complete,duration+150); // only a failure fallback; normal animation determines timing
 try{
  const animation=surface.animate(keyframes.map(transform=>({transform})),{
   duration,easing:'cubic-bezier(.68,.02,.22,1)',fill:'forwards'
  });
  animation.finished.then(complete,complete);
 }catch{complete();}
}
export function installC02PageTransitions(win=window,doc=document){
 if(!doc.body||doc.documentElement.dataset.c02Installed)return;
 doc.documentElement.dataset.c02Installed='true';
 const reduce=win.matchMedia('(prefers-reduced-motion: reduce)');
 let active=null,busy=false;
 const cleanup=()=>{active?.overlay.remove();active=null;busy=false;};
 if(consumeTicket(win)&&!reduce.matches){
  active=overlayFor(doc);active.surface.style.transform='translate3d(0,0,0)';
  animateInk(win,active.surface,['translate3d(0,0,0)','translate3d(112%,0,0)'],REVEAL_MS,cleanup);
 }
 if(doc.body.dataset.page!=='home')return;
 doc.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||
   event.shiftKey||event.altKey||reduce.matches)return;
  const element=event.target instanceof win.Element?event.target:null;
  const link=element?.closest('a[href]');if(!link)return;
  const nav=link.closest('.nav-center, #mobileNav');if(!nav)return;
  const url=new URL(link.href,win.location.href);
  if(!isC02Eligible({
   page:doc.body.dataset.page,pathname:url.pathname,
   source:nav.id==='mobileNav'?'mobile':'primary',
   sameOrigin:url.origin===win.location.origin,
   download:link.hasAttribute('download'),
   target:link.getAttribute('target')||'_self'
  }))return;
  event.preventDefault();
  if(busy)return;
  busy=true;active=overlayFor(doc);storeTicket(win,url.pathname);
  animateInk(win,active.surface,['translate3d(-112%,0,0)','translate3d(0,0,0)'],COVER_MS,
   ()=>win.location.assign(url.href));
 },{capture:true});
 win.addEventListener('pageshow',event=>{if(event.persisted)cleanup();});
}
