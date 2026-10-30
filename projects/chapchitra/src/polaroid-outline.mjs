/**
 * CHAPCHITRA — one continuous, variable-width print-ink outline.
 * One even-odd SVG path forms a subtly imperfect perimeter ribbon,
 * approximately 1–4 CSS px thick, with ~10px rounded corners.
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
 // One counterclockwise INNER edge defines genuine variable-width ink.
 // Selected confident stretches become ~3.5–4px thick; other stretches
 // taper to ~1–1.8px. The outer edge stays restrained and straight.
 // The interior is an even-odd hole: still ONE visible filled outline.
 const inner=[
  'M',10.7,3.32,
  // Upper-left rounded corner and left edge, deliberately uneven weight.
  'C',6.05,3.09,3.46,6.13,3.45,10.9,
  'C',3.10,hy(.25),4.62,hy(.37),4.35,hy(.51),
  'C',4.03,hy(.66),2.29,hy(.77),2.58,y(11.0),
  // Lower-left corner and bottom edge.
  'C',2.64,y(6.2),6.10,y(3.35),11.15,y(3.2),
  'C',wx(.24),y(3.65),wx(.31),y(4.46),wx(.48),y(4.23),
  'C',wx(.65),y(4.11),wx(.74),y(2.46),x(10.95),y(2.76),
  // Lower-right corner, then the two right-edge weight transitions.
  'C',x(5.75),y(2.69),x(2.55),y(6.07),x(2.48),y(10.6),
  'C',x(2.60),hy(.79),x(4.55),hy(.70),x(4.30),hy(.51),
  'C',x(4.05),hy(.33),x(2.16),hy(.24),x(2.55),10.85,
  // Upper-right rounded corner and subtly tapered top stroke.
  'C',x(2.55),5.96,x(6.05),2.65,x(11.1),2.70,
  'C',wx(.78),2.22,wx(.72),4.22,wx(.52),4.41,
  'C',wx(.33),4.28,wx(.24),2.21,10.7,3.32,'Z'
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
   // offset dimensions ignore the approved hover rotate/scale transform;
   // the ink must always fit the actual paper's untransformed border box.
   const width=target.offsetWidth,height=target.offsetHeight;
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
