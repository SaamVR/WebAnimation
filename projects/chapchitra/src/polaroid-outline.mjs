/**
 * CHAPCHITRA — one continuous, variable-width print-ink outline.
 * One even-odd SVG path forms a subtly imperfect perimeter ribbon,
 * approximately 1.5–3.5 CSS px thick, with ~10px rounded corners.
 * ResizeObserver recalculates actual CSS-pixel geometry instead of
 * stretching a bitmap or stretching the SVG corner radii.
 * Neither the separate button nor shopping behavior is touched.
 */
const NS='http://www.w3.org/2000/svg';
const round=n=>Number(n.toFixed(2));
export function polaroidInkPath(width,height){
 const w=round(width),h=round(height);
 if(!(w>=40&&h>=40))return '';
 const x=n=>round(w-n),y=n=>round(h-n),wx=n=>round(w*n),hy=n=>round(h*n);
 // One gently irregular clockwise outer contour.
 const outer=[
  'M',10.4,.85,
  'C',wx(.28),.43,wx(.70),1.16,x(10.1),.84,
  'C',x(3.6),.82,x(.96),3.8,x(.78),10.1,
  'C',x(.35),hy(.32),x(1.19),hy(.68),x(.83),y(10.3),
  'C',x(1.05),y(4),x(4.35),y(.58),x(10.2),y(.72),
  'C',wx(.68),y(.42),wx(.31),y(1.07),10.3,y(.75),
  'C',4.3,y(1),.8,y(4),.74,y(10.2),
  'C',1.09,hy(.68),.38,hy(.32),.85,10.3,
  'C',.96,4.2,4.4,1.1,10.4,.85,'Z'
 ];
 // Inner counterclockwise edge is a *hole*, not another visible line.
 const inner=[
  'M',10.9,3.25,
  'C',6.2,3.1,3.3,5.9,3.25,11.4,
  'C',2.9,hy(.33),3.75,hy(.67),3.28,y(10.8),
  'C',3.42,y(6.4),6,y(3.4),11.3,y(3.45),
  'C',wx(.31),y(3.15),wx(.67),y(3.85),x(10.8),y(3.42),
  'C',x(6.4),y(3.1),x(3.5),y(6.2),x(3.44),y(11),
  'C',x(3.15),hy(.66),x(3.82),hy(.35),x(3.54),11,
  'C',x(3.5),6.4,x(6.2),3.5,x(11.2),3.3,
  'C',wx(.66),3.65,wx(.33),2.95,10.9,3.25,'Z'
 ];
 return [...outer,...inner].join(' ');
}
export function installPolaroidOutlines(root=document){
 if(typeof document==='undefined'||typeof ResizeObserver==='undefined')return;
 const frames=new WeakSet();
 const resize=new ResizeObserver(entries=>{
  for(const {target} of entries){
   const svg=target.querySelector(':scope > .polaroid-ink-outline');
   const path=svg?.firstElementChild;
   if(!svg||!path)continue;
   const {width,height}=target.getBoundingClientRect();
   if(width<40||height<40)continue;
   svg.setAttribute('viewBox','0 0 '+round(width)+' '+round(height));
   path.setAttribute('d',polaroidInkPath(width,height));
  }
 });
 function watch(frame){
  if(frames.has(frame))return;
  frames.add(frame);
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('class','polaroid-ink-outline');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  const path=document.createElementNS(NS,'path');
  path.setAttribute('class','polaroid-ink-perimeter');
  path.setAttribute('fill-rule','evenodd');
  svg.append(path);frame.append(svg);
  resize.observe(frame);
 }
 function scan(node){
  if(!(node instanceof Element))return;
  if(node.matches('.product-card-shell > .polaroid-card'))watch(node);
  node.querySelectorAll('.product-card-shell > .polaroid-card').forEach(watch);
 }
 scan(root.documentElement||root);
 const observer=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes)scan(node);
 });
 observer.observe(root.body||root,{childList:true,subtree:true});
 return {disconnect(){observer.disconnect();resize.disconnect()}};
}
