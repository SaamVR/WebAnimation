// Journal-only progressive enhancement: real links + same-document editorial swaps.
import {journalEditorial,articleEditorial,mountJournalEditorial} from './journal-editorial.mjs';
import {isJournalPath} from './motion/c02/ink-shapes.mjs';
export const JOURNAL_ENTRANCE_MS=1240;
export function journalTarget(url,base){try{const from=new URL(base),to=new URL(url,from);if(from.origin!==to.origin||!isJournalPath(from.pathname)||!isJournalPath(to.pathname))return null;return to}catch{return null}}
export function articleSlug(url){return url.searchParams.get('slug')||(url.pathname.split('/').filter(Boolean).length===3?url.pathname.split('/').filter(Boolean)[2]:null)||null}
const ease='cubic-bezier(.22,.68,.28,1)';
const finished=a=>a.finished.catch(()=>{});
function makeEntrance(root,view,{reverse=false,skip=false}={}){
 const reduce=view.matchMedia('(prefers-reduced-motion: reduce)');if(skip||reduce.matches||!root?.animate){if(root)root.dataset.jeEntrance='complete';return {play:()=>Promise.resolve(),cancel:()=>{}}}
 const front=root.querySelector('.je-front,.je-article-opening'),animations=[];let cancelled=false;
 const scale=view.innerWidth<=600?.55:1;
 function add(el,from,to,delay,duration){if(!el)return;const a=el.animate([from,to],{duration,delay,easing:ease,fill:'both'});a.pause();a.currentTime=0;animations.push(a)}
 const wordEnd={transform:'translate(0px,0px) rotate(0deg)',clipPath:'inset(0 0 0 0)'};
 const lead=root.querySelector('.je-masthead h1,.je-article-mast a');add(lead,{transform:'translate('+(-82*scale)+'px,28px) rotate(-7deg)',clipPath:'inset(0 100% 0 0)'},wordEnd,0,730);
 add(root.querySelector('.je-masthead .je-kicker,.je-article-mast span'),{transform:'translateX('+(-32*scale)+'px)',clipPath:'inset(0 100% 0 0)'},{transform:'translateX(0px)',clipPath:'inset(0 0 0 0)'},100,510);
 const panels=front?[...front.querySelectorAll('.je-image')]:[];
 for(const [i,box] of panels.entries()){const dir=(i%2? -1:1)*(reverse?-1:1),delay=140+i*110;add(box,{clipPath:dir>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0)'},delay,740);add(box.querySelector('.je-image-sheet'),{transform:'translateX('+(dir*36)+'%) rotate('+(-dir*5)+'deg)'},{transform:'translateX(0%) rotate(0deg)'},delay,780)}
 if(front){const scenes=front.matches('[data-je-scene]')?[front]:[...front.querySelectorAll('[data-je-scene]')];for(const [i,scene] of scenes.entries()){const dir=(i%2?-1:1)*(reverse?-1:1),base=260+Math.min(i*55,220);for(const [j,w] of [...scene.querySelectorAll('.je-word')].entries())add(w,{transform:'translate('+(dir*(55+j*7)*scale)+'px,'+((j%2?-1:1)*22*scale)+'px) rotate('+((j%2?-1:1)*dir*16)+'deg)',clipPath:'inset(0 0 0 0)'},wordEnd,base+Math.min(j*70,210),660);for(const [j,t] of [...scene.querySelectorAll('.je-kicker,.je-teaser,.je-lead,.je-edition,.je-read')].entries())add(t,{transform:'translateX('+(dir*34*scale)+'px)',clipPath:dir>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)'},{transform:'translateX(0px)',clipPath:'inset(0 0 0 0)'},base+130+Math.min(j*40,120),590)}}
 root.dataset.jeEntrance='waiting';
 const cancel=()=>{cancelled=true;for(const a of animations)a.cancel();root.dataset.jeEntrance='complete'};
 const play=async()=>{if(cancelled)return;if(reduce.matches){cancel();return}root.dataset.jeEntrance='playing';root.dataset.jeEntranceStarted=String(Math.round(view.performance.now()));for(const a of animations)a.play();await Promise.all(animations.map(finished));if(!cancelled){for(const a of animations)a.cancel();root.dataset.jeEntrance='complete';root.dataset.jeEntranceEnded=String(Math.round(view.performance.now()))}};
 return {play,cancel};
}
export function mountJournalNavigation(doc,view,items,draw,{closePanels=()=>{}}={}){
 const main=doc.querySelector('#main');if(!main||!isJournalPath(view.location.pathname))return;
 const media=view.matchMedia('(prefers-reduced-motion: reduce)'),controller=new AbortController(),{signal}=controller;
 let disposeScroll=mountJournalEditorial(doc,view,items,draw),entrance=makeEntrance(main.querySelector('.je-paper'),view),serial=0,exit=null,observer=null,guard=0,scrollTimer=0,liveURL=view.location.href,liveY=view.scrollY,disposed=false;
 const priorRestoration=view.history.scrollRestoration;view.history.scrollRestoration='manual';
 const mark=()=>{try{view.history.replaceState({...view.history.state,je:true,jeY:view.scrollY},'',view.location.href)}catch{}};
 function metadata(url){const slug=articleSlug(url),article=url.pathname!='/journal/'&&url.pathname!='/journal';const a=items.find(x=>x.slug===(slug||items[0].slug));doc.body.dataset.page=article?'article':'journal';doc.title=(article?(a?.title||'Story unavailable'):'The Journal')+' · CHAPCHITRA';const desc=doc.querySelector('meta[name=description]');if(desc)desc.content=article?(a?.teaser||'Story unavailable.'):'CHAPCHITRA Journal — People, Places and Prints. Editorial preview.'}
 metadata(new URL(liveURL));doc.documentElement.classList.remove('je-boot');mark();
 function clearWait(){observer?.disconnect();observer=null;if(guard)view.clearTimeout(guard);guard=0}
 function afterInk(){clearWait();const ready=()=>!doc.documentElement.classList.contains('c02-pending')&&!doc.querySelector('.c02-loader');const start=()=>{clearWait();view.requestAnimationFrame(()=>{if(!disposed)entrance.play()})};if(ready()){start();return}observer=new MutationObserver(()=>{if(ready())start()});observer.observe(doc.documentElement,{attributes:true,attributeFilter:['class','data-c02-busy']});observer.observe(doc.body,{childList:true});guard=view.setTimeout(()=>{if(ready())start();else{clearWait();entrance.cancel()}},27000)}
 afterInk();
 function cancelMotion(){clearWait();entrance.cancel();exit?.cancel();exit=null}
 function scrollTo(y){const html=doc.documentElement,old=html.style.scrollBehavior;html.style.scrollBehavior='auto';view.scrollTo(0,y);html.style.scrollBehavior=old}
 function onScroll(){liveY=view.scrollY;if(scrollTimer)view.clearTimeout(scrollTimer);scrollTimer=view.setTimeout(()=>{if(view.location.href===liveURL)mark()},120)}
 view.addEventListener('scroll',onScroll,{passive:true,signal});
 async function navigate(to,{pop=false,y=0}={}){
  const token=++serial,from=new URL(liveURL),reverse=pop||to.pathname==='/journal/';cancelMotion();closePanels();
  if(scrollTimer){view.clearTimeout(scrollTimer);scrollTimer=0}
  if(!pop)mark();
  const oldRoot=main.querySelector('.je-paper'),oldInner=oldRoot?.querySelector('.je-inner');
  if(!media.matches&&oldInner?.animate){oldRoot.dataset.jeTransition='leaving';exit=oldInner.animate([{transform:'translateX(0px)'},{transform:'translateX('+(reverse?48:-48)+'px)'}],{duration:220,easing:'cubic-bezier(.55,.06,.68,.19)',fill:'both'});await finished(exit);if(token!==serial||disposed)return;exit=null}
  if(token!==serial||disposed)return;
  const landing=to.pathname==='/journal/'||to.pathname==='/journal';
  disposeScroll?.();main.innerHTML=landing?journalEditorial(items,draw):articleEditorial(items,draw,articleSlug(to));
  if(!pop)view.history.pushState({je:true,jeY:0},'',to.href);liveURL=to.href;metadata(to);scrollTo(y);liveY=view.scrollY;
  disposeScroll=mountJournalEditorial(doc,view,items,draw);entrance=makeEntrance(main.querySelector('.je-paper'),view,{reverse,skip:pop&&y>50});
  if(pop&&y>0){view.requestAnimationFrame(()=>{if(token===serial)scrollTo(y)})}
  const heading=main.querySelector('h1');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
  await entrance.play();if(token===serial&&!disposed)mark();
 }
 doc.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self')||a.relList.contains('external')||a.getAttribute('aria-disabled')==='true')return;const to=journalTarget(a.href,view.location.href);if(!to||to.hash||to.href===view.location.href)return;e.preventDefault();navigate(to).catch(()=>view.location.assign(to.href))},{capture:true,signal});
 view.addEventListener('popstate',e=>{const to=journalTarget(view.location.href,liveURL);if(!to)return;navigate(to,{pop:true,y:Number(e.state?.jeY)||0}).catch(()=>view.location.reload())},{signal});
 media.addEventListener('change',()=>{if(media.matches)cancelMotion()},{signal});
 view.addEventListener('pagehide',e=>{mark();if(!e.persisted){disposed=true;cancelMotion();disposeScroll?.();controller.abort();if(scrollTimer)view.clearTimeout(scrollTimer);view.history.scrollRestoration=priorRestoration}},{signal});
 view.addEventListener('pageshow',e=>{if(e.persisted){cancelMotion();liveURL=view.location.href;metadata(new URL(liveURL))}},{signal});
}
