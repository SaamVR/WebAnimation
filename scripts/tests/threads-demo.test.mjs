import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {PRODUCTS,filterProducts,totalOf,formatMoney} from "../../site/threads/app.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const html=readFileSync(path.join(root,"site/threads/index.html"),"utf8");
const app=readFileSync(path.join(root,"site/threads/app.mjs"),"utf8");
test("exact canonical layout section order exists as real DOM",()=>{
 const ids=["home","categories","shop","about","mission","arrivals","sale","deal"];
 const positions=ids.map(id=>html.indexOf('id="'+id+'"'));
 assert.ok(positions.every(x=>x>=0));
 assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
 assert.match(html,/class="footer"/);
 assert.ok(!html.includes("<iframe"));
});
test("independent page has no CMS imports, checkout API calls or real payment fields",()=>{
 assert.ok(!/(EcomCMS|@\/lib\/cms|stripe|supabase|paymentIntent|cardnumber|cvv|<iframe)/i.test(app+html));
 assert.match(html,/Simulation only/);
 assert.match(html,/No payment is processed or transmitted/);
});
test("four interactive features have reachable DOM contracts",()=>{
 for(const id of ["search-trigger","site-search","cart-trigger","cart-drawer","deal-toggle","deal-expanded","pay-demo","payment-modal","payment-success"]){assert.ok(html.includes('id="'+id+'"'),id);}
 for(const hook of ["runSpotlight","flyToBag","setupBackpackArtwork","simulatePayment"]){assert.ok(app.includes("function "+hook),hook);}
});
test("catalog preserves categories, legitimate arithmetic and query matching",()=>{
 assert.equal(PRODUCTS.length,10);
 assert.equal(PRODUCTS.filter(x=>x.featured).length,4);
 assert.equal(PRODUCTS.filter(x=>!x.featured).length,6);
 assert.equal(filterProducts("headphones").length,1);
 assert.ok(filterProducts("bags").every(x=>x.category==="Bags"));
 assert.equal(filterProducts("sneaker").length>0,true);
 assert.equal(totalOf([{product:PRODUCTS[0],qty:2},{product:PRODUCTS[1],qty:1}]),477);
 assert.equal(formatMoney(7.5),"$7.50");
});
test("transparent registered backpack layers are present and local",()=>{
 for(const part of ["body","flap","interior","sneaker","bottle","cap"]){assert.ok(existsSync(path.join(root,"site/threads/assets/original-"+part+".webp")));}
 assert.ok(existsSync(path.join(root,"site/threads/art.css")));
});
