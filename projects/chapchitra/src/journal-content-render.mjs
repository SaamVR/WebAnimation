// Reader-facing article rendering; editorial production briefs are not shipped.
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const oldSlugs={'prints-and-people':'fashion-trends-bangladesh-2026','colors-of-place':'bangladeshi-folk-art-contemporary-fashion','the-making-table':'how-t-shirt-printing-works','art-on-cloth':'wear-your-personality','the-first-impression':'why-original-t-shirt-designs-matter'};
export const legacyJournalSlugs=Object.freeze(oldSlugs);
export function resolveArticle(items,slug){return items.find(a=>a.slug===(oldSlugs[slug]||slug||items[0].slug))}
export function articleMetadata(a){return a?{title:a.seoTitle,description:a.metaDescription,type:'article',schema:{'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.teaser,articleSection:a.category,inLanguage:'en'}}:{title:'The Journal · CHAPCHITRA',description:'CHAPCHITRA Journal — fashion, art, culture, people and printmaking.',type:'website',schema:null}}
export const safeJson=x=>JSON.stringify(x).replace(/</g,'\\u003c');
const inline=s=>{let out='',end=0;const re=/\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;for(const m of s.matchAll(re)){out+=esc(s.slice(end,m.index));if(m[1]){const href=m[2];out+=/^(https:\/\/|\/(?!\/))/.test(href)?'<a href="'+esc(href)+'">'+esc(m[1])+'</a>':esc(m[1])}else out+=m[3]?'<strong>'+esc(m[3])+'</strong>':'<em>'+esc(m[4])+'</em>';end=m.index+m[0].length}return out+esc(s.slice(end))};
const rows=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
// Section numbering is a presentation convention, not a change to source copy.
const cleanHeading=t=>t.replace(/^\d+[.)]\s+/,'');
function blocks(md){
 const lines=md.split('\n'),out=[];let i=0;
 const ordered=/^(\d+)[.)]\s+(.+)$/;
 const boundary=/^(#{2,3} |\[IMAGE:|- |\| |\||\d+[.)]\s+|---$)/;
 while(i<lines.length){
  const l=lines[i].trim();if(!l||l==='---'){i++;continue}
  let m=l.match(/^\[IMAGE:(J\d\d-\d\d)\]$/);if(m){out.push({type:'image',id:m[1]});i++;continue}
  m=l.match(/^(##|###) (.+)$/);if(m){out.push({type:m[1]==='##'?'h2':'h3',text:cleanHeading(m[2])});i++;continue}
  if(l.startsWith('|')&&lines[i+1]?.trim().startsWith('|')){const h=rows(l),body=[];i+=2;while(lines[i]?.trim().startsWith('|'))body.push(rows(lines[i++]));out.push({type:'table',head:h,body});continue}
  if(l.startsWith('- ')){const arr=[];while(lines[i]?.trim().startsWith('- '))arr.push(lines[i++].trim().slice(2));out.push({type:'list',arr});continue}
  if(ordered.test(l)){const arr=[];while((m=lines[i]?.trim().match(ordered))){arr.push({number:Number(m[1]),text:m[2]});i++}out.push({type:'ordered',arr});continue}
  const p=[l];i++;while(i<lines.length&&lines[i].trim()&&!boundary.test(lines[i].trim()))p.push(lines[i++].trim());out.push({type:'p',text:p.join(' ')})
 }return out
}
function prose(b){
 if(b.type==='h3')return '<h3>'+inline(b.text)+'</h3>';
 if(b.type==='ordered')return '<ol start="'+b.arr[0].number+'">'+b.arr.map(t=>'<li value="'+t.number+'">'+inline(t.text)+'</li>').join('')+'</ol>';
 if(b.type==='list')return '<ul>'+b.arr.map(t=>'<li>'+inline(t)+'</li>').join('')+'</ul>';
 if(b.type==='table')return '<div class="je-v1-table-scroll" tabindex="0" role="region" aria-label="Article comparison table"><table><thead><tr>'+b.head.map(t=>'<th scope="col">'+inline(t)+'</th>').join('')+'</tr></thead><tbody>'+b.body.map(r=>'<tr>'+r.map(t=>'<td>'+inline(t)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 return '<p>'+inline(b.text)+'</p>'
}
export function imageSlot(slot,{preview=false}={}){const attr=preview?'data-je-preview-slot':'data-je-image-slot';const box='<div class="je-image je-v1-slot'+(slot.alphaRequired?' je-v1-alpha':'')+'" data-je-image '+attr+'="'+slot.id+'" style="--je-ratio:'+slot.width+'/'+slot.height+';--je-cols:'+slot.columns+'"><div class="je-image-sheet">'+(slot.available?'<img src="'+esc(slot.asset)+'" width="'+slot.width+'" height="'+slot.height+'" alt="'+esc(slot.alt)+'" decoding="async" '+(slot.role==='featured'?'':'loading="lazy"')+'>':'<div class="je-v1-placeholder" role="img" aria-label="Image pending: '+esc(slot.title)+'"><span>IMAGE PENDING</span><small>'+slot.id+'</small></div>')+'</div></div>';return preview?box:'<figure class="je-v1-figure" data-je-figure="'+slot.id+'" data-je-columns="'+slot.columns+'">'+box+'<figcaption>'+esc(slot.caption)+'</figcaption></figure>'}
// Manifest widths are retained as ranges: portrait 4–5, cutout 5–7,
// landscape 6–8 and diagram 8–10. Never change marker order on mobile.
const renderProse=(arr,columns=false)=>'<div class="je-v1-prose'+(columns?' je-mag-columns':'')+'">'+arr.map(prose).join('')+'</div>';
const canColumn=arr=>arr.length>=3&&arr.every(b=>b.type==='p')&&arr.reduce((n,b)=>n+b.text.length,0)>650;
const wrapSlots=new Set(['J02-04','J04-04','J07-03']);
export function articleBody(a,words){
 const sections=[];let current={heading:null,blocks:[]};
 for(const b of blocks(a.body)){if(b.type==='h2'){if(current.heading||current.blocks.length)sections.push(current);current={heading:b.text,blocks:[]}}else current.blocks.push(b)}
 if(current.heading||current.blocks.length)sections.push(current);
 let number=0;const seed=Number(a.id.slice(1));
 return '<div class="je-v1-body je-mag-body">'+sections.map((section,si)=>{
  const out=[];let chunk=[];let sectionKind='text';
  const flush=()=>{if(chunk.length){const long=canColumn(chunk);out.push('<div class="je-mag-text-band" data-je-text-align="'+((si+seed)%3===0?'right':(si+seed)%3===1?'left':'center')+'">'+renderProse(chunk,long)+'</div>');chunk=[]}};
  for(let i=0;i<section.blocks.length;i++){
   const b=section.blocks[i];if(b.type!=='image'){chunk.push(b);continue}
   const im=a.slots.find(x=>x.id===b.id);if(!im)throw Error('Missing image '+b.id);
   const order=number++,side=(order+seed)%2?'left':'right';
   const width=im.columns===9?8+(order+seed)%3:im.columns===7?6+(order+seed)%3:im.columns===6?5+(order+seed)%3:4+(order+seed)%2;
   const attrs=' data-je-side="'+side+'" style="--je-figure-cols:'+width+'"';
   if(wrapSlots.has(im.id)&&section.blocks[i+1]?.type==='p'){
    // Float only with real subsequent prose; marker/reading order is unchanged.
    flush();const after=[];while(section.blocks[i+1]?.type==='p')after.push(section.blocks[++i]);
    out.push('<div class="je-mag-wrap"'+attrs+'>'+imageSlot(im)+renderProse(after)+'</div>');sectionKind='wrap';
   }else if(im.columns<9&&chunk.length){
    out.push('<div class="je-v1-pair je-mag-pair"'+attrs+'>'+renderProse(chunk)+imageSlot(im)+'</div>');chunk=[];sectionKind='pair';
   }else{
    flush();out.push('<div class="je-v1-band je-mag-band"'+attrs+'>'+imageSlot(im)+'</div>');sectionKind='band';
   }
  }
  flush();
  return '<section class="je-v1-section je-mag-section" data-je-scene data-je-composition="'+sectionKind+'">'+(section.heading?'<h2 aria-label="'+esc(section.heading)+'">'+words(section.heading)+'</h2>':'')+out.join('')+'</section>';
 }).join('')+'</div>'
}
