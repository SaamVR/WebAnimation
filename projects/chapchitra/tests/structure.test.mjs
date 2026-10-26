import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const load=p=>readFile(new URL(p,root),'utf8');
test('semantic section foundation exists',async()=>{
 const html=await load('src/index.html');
 for(const id of ['main','categories','featured','story','process','posters','arrivals','community'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/lang="bn"/);assert.match(html,/id="searchPanel"/);assert.match(html,/id="mobileMenu"/);assert.match(html,/prefers-reduced-motion|styles\.css/);
 assert.match(html,/noindex, nofollow/);
});
test('no fabricated inventory, payments, imagery or cross-project imports',async()=>{
 const combined=(await Promise.all(['src/index.html','src/app.mjs','src/components.mjs'].map(load))).join('\n');
 assert.doesNotMatch(combined,/https?:\/\/|threads\/|EcomCMS\/|stripe|checkout\.session|firebase|supabase|onrender\.com/i);
 assert.match(combined,/No email addresses are collected/);
 assert.match(combined,/No products for sale/);
});
test('CSS tokens and accessibility guardrails',async()=>{
 const css=await load('src/styles.css');
 assert.match(css,/#232323/);
 assert.match(css,/--midnight-olive/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:820px\)/);
 assert.match(css,/@media\(max-width:600px\)/);
});
test('motion remains unimplemented pending approval',async()=>{
 const docs=await load('src/motion/README.md');
 assert.match(docs,/No timelines/);
 assert.match(docs,/C01/);assert.match(docs,/C04/);
});
