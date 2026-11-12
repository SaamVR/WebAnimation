// Derive a tightly inset Gallery White underprint from the owner's exact
// original alpha silhouette. Build-only: no runtime raster images, filters,
// path animation, or artist path edits. White fills enclosed transparency in
// the major contiguous brush, while disconnected bristle flecks stay clear.
import sharp from 'sharp';
const W=2048,H=288;
export async function whiteInkBacking(sourceSVG){
 const {data,info}=await sharp(sourceSVG).resize(W,H).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==W||info.height!==H||info.channels!==4)
  throw Error('C02 white silhouette source dimensions changed');
 const N=W*H,painted=new Uint8Array(N),seen=new Uint8Array(N),queue=new Int32Array(N);
 for(let i=0;i<N;i++)painted[i]=data[i*4+3]>=128?1:0;
 let largest=[],largestSize=0;
 for(let n=0;n<N;n++){
  if(!painted[n]||seen[n])continue;
  let read=0,write=0;queue[write++]=n;seen[n]=1;
  while(read<write){
   const k=queue[read++],x=k%W,y=(k/W)|0;
   const visit=v=>{if(painted[v]&&!seen[v]){seen[v]=1;queue[write++]=v;}};
   if(x>0)visit(k-1);if(x<W-1)visit(k+1);
   if(y>0)visit(k-W);if(y<H-1)visit(k+W);
  }
  if(write>largestSize){largestSize=write;largest=queue.slice(0,write);}
 }
 if(largestSize<300000)throw Error('C02 brush silhouette was not found');
 const main=new Uint8Array(N);
 for(const n of largest)main[n]=1;
 // Flood fill transparent pixels connected to the canvas exterior.
 // Remaining enclosed cutouts belong to the white underprint.
 const exterior=new Uint8Array(N);let read=0,write=0;
 const push=v=>{if(!main[v]&&!exterior[v]){exterior[v]=1;queue[write++]=v;}};
 for(let x=0;x<W;x++){push(x);push((H-1)*W+x);}
 for(let y=0;y<H;y++){push(y*W);push(y*W+W-1);}
 while(read<write){
  const k=queue[read++],x=k%W,y=(k/W)|0;
  if(x>0)push(k-1);if(x<W-1)push(k+1);
  if(y>0)push(k-W);if(y<H-1)push(k+W);
 }
 let inside=new Uint8Array(N);
 for(let i=0;i<N;i++)inside[i]=exterior[i]?0:1;
 // Inset by 8 original SVG pixels to prevent white edging/halos.
 for(let pass=0;pass<2;pass++){
  const next=new Uint8Array(N);
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
   const i=y*W+x;
   next[i]=inside[i]&&inside[i-1]&&inside[i+1]&&inside[i-W]&&inside[i+W]?1:0;
  }
  inside=next;
 }
 const edges=new Map();let edgeCount=0;
 const add=(x,y,x2,y2)=>{
  const key=y*(W+1)+x,other=y2*(W+1)+x2;
  if(!edges.has(key))edges.set(key,[]);
  edges.get(key).push(other);edgeCount++;
 };
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x;if(!inside[i])continue;
  if(y===0||!inside[i-W])add(x,y,x+1,y);
  if(x===W-1||!inside[i+1])add(x+1,y,x+1,y+1);
  if(y===H-1||!inside[i+W])add(x+1,y+1,x,y+1);
  if(x===0||!inside[i-1])add(x,y+1,x,y);
 }
 const trails=[];let visited=0;
 while(edges.size){
  const start=edges.keys().next().value;let current=start,trail=[start],length=0;
  do{
   const options=edges.get(current);
   if(!options?.length)throw Error('C02 underprint open silhouette');
   const next=options.pop();
   if(!options.length)edges.delete(current);
   visited++;length++;current=next;
   if(current!==start)trail.push(current);
   if(length>edgeCount+1)throw Error('C02 silhouette loop corrupted');
  }while(current!==start);
  if(length>=12)trails.push(trail);
 }
 if(visited!==edgeCount||!trails.length)throw Error('C02 silhouette edges inconsistent');
 const path=trails.map(trail=>{
  const pts=trail.map(v=>[(v%(W+1))*4,Math.floor(v/(W+1))*4]);
  const compact=[];
  for(let j=0;j<pts.length;j++){
   const a=pts[(j+pts.length-1)%pts.length],p=pts[j],b=pts[(j+1)%pts.length];
   if((a[0]===p[0]&&p[0]===b[0])||(a[1]===p[1]&&p[1]===b[1]))continue;
   compact.push(p);
  }
  return compact.length>=3?'M'+compact.map(p=>p.join(' ')).join('L')+'Z':'';
 }).join('');
 const filled=inside.reduce((sum,v)=>sum+v,0);
 const whiteHoles=inside.reduce((sum,v,i)=>sum+(v&&!painted[i]?1:0),0);
 if(filled<350000||whiteHoles<2000||path.length>500000)
  throw Error('C02 backing lost source holes or exceeded geometry budget');
 return {path,stats:{paintedMain:largestSize,filled,whiteHoles,edgeCount,pathBytes:path.length}};
}
