import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'), source=path.join(root,'content/journal-v1');
const read=f=>fs.readFileSync(path.join(source,f),'utf8').replace(/^\uFEFF/,'');
const index=JSON.parse(read('Master-article-index.json')), images=JSON.parse(read('Master-image-manifest.json'));
assert.equal(index.length,10);assert.equal(images.length,44);assert.equal(new Set(images.map(x=>x.id)).size,44);assert.equal(images.filter(x=>x.alphaRequired).length,7);
const articles=index.map(a=>{
 const markdown=read(a.articleFile).replace(/\r\n/g,'\n').trim();
 const marker=markdown.indexOf('[IMAGE:'+a.featuredImageId+']');assert.ok(marker>0);
 const ids=[...markdown.matchAll(/\[IMAGE:(J\d\d-\d\d)\]/g)].map(x=>x[1]);assert.deepEqual(ids,a.imageDisplayOrder);
 const body=markdown.slice(marker+('[IMAGE:'+a.featuredImageId+']').length).trim();
 const slots=ids.map(id=>{const im=images.find(x=>x.id===id&&x.articleId===a.id);assert.ok(im);const asset='/assets/journal/'+a.id+'/'+im.filename;return {id,filename:im.filename,width:im.width,height:im.height,alphaRequired:im.alphaRequired,caption:im.caption,alt:im.alt,title:im.title,role:im.role,columns:im.desktop.startsWith('4–5')?5:im.desktop.startsWith('5–7')?6:im.desktop.startsWith('8–10')?9:im.role==='featured'?8:7,asset,available:fs.existsSync(path.join(root,'src',asset.slice(1)))}});
 return {id:a.id,slug:a.slug,route:a.route,title:a.title,subtitle:a.subtitle,teaser:a.description,eyebrow:a.category,category:a.category,seoTitle:a.seoTitle,metaDescription:a.metaDescription,readMinutes:a.readMinutes,titleSide:a.titleSide,layout:a.layout,featuredImageId:a.featuredImageId,body,slots};
});
const routes=new Set(articles.map(a=>a.route));for(const a of articles)for(const [,href] of a.body.matchAll(/\]\((\/[^)]+)\)/g))assert.ok(routes.has(href)||['/artists-edit/','/about/','/shop/'].includes(href),'Unknown internal route '+href);
const output='// Generated from the source-locked owner content package; reader fields only.\nexport const journalArticles='+JSON.stringify(articles,null,2)+';\n';
const target=path.join(root,'src/journal-content-v1.mjs');if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n'),output);else fs.writeFileSync(target,output);
console.log('Verified 10 articles, 44 slots, 7 alpha slots, internal routes and display order');
