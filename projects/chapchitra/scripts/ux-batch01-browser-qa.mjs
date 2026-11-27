import { chromium,webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const app=path.resolve(import.meta.dirname,'..'),root=path.resolve(app,'../../..','..');
const tools=process.env.CC_LOCAL_TOOLS||'G:/CHAPCHITRA-Local/tools';
const baseline='http://127.0.0.1:4173',candidate='http://127.0.0.1:4174';
const out=path.join(tools,'qa','ux-batch01-ui');
fs.mkdirSync(out,{recursive:true});
const profiles=[{width:1440,height:900},{width:834,height:1112},{width:390,height:844}];
const sha=process.env.CC_TEST_SHA||'uncommitted';
const results=[];
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({sha,results},null,2));
const token=randomBytes(24).toString('hex');
const server=spawn(process.execPath,[path.join(tools,'server.cjs'),path.join(app,'dist'),'4174',token,sha],{stdio:'ignore',windowsHide:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const load=async(p,url,selector)=>{await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await p.locator(selector).first().waitFor({state:'visible',timeout:20000});await p.evaluate(()=>document.fonts.ready);};
const rect=async(p,s)=>p.locator(s).first().evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left};});
const shot=async(p,s,file)=>p.locator(s).first().screenshot({path:path.join(out,file+'.png'),timeout:20000});
const check=async(p)=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2,'horizontal overflow');
const focus=async(l)=>l.evaluate(e=>({focused:document.activeElement===e,visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));
try{
 let ok=false;for(let i=0;i<40;i++){try{const h=await (await fetch(candidate+'/_cc_local_health')).json();if(h.sha===sha&&h.token===token){ok=true;break}}catch{}await wait(250);}
 assert.ok(ok,'candidate server did not become healthy');
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  let b;try{b=await type.launch({headless:true});}catch(e){if(engine==='chromium')b=await type.launch({headless:true,channel:'chrome'});else throw e;}
  try{for(const viewport of profiles)for(const theme of ['light','dark']){
   const name=engine+'-'+viewport.width+'-'+theme, rec={name,engine,viewport,theme,status:'FAIL',checks:{},errors:[],external:[],bad:[]};
   const c=await b.newContext({viewport,colorScheme:theme,hasTouch:viewport.width<600,serviceWorkers:'block',reducedMotion:'reduce'});
   try{
    await c.route('**/*',async r=>{const u=new URL(r.request().url());if(/^https?:$/.test(u.protocol)&&![baseline,candidate].includes(u.origin)){rec.external.push(u.href);return r.abort();}await r.continue()});
    const p=await c.newPage();p.on('pageerror',e=>rec.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)rec.bad.push(r.status()+' '+r.url());});
    const product='/product/?id=study-001';
    await load(p,baseline+product,'.detail-layout');await check(p);
    rec.before={footer:await rect(p,'.footer-grid'),product:await rect(p,'.detail-layout')};
    await shot(p,'.detail-layout',name+'-before-product');await shot(p,'.site-footer',name+'-before-footer');
    await load(p,baseline+'/artists-edit/','#artistWorktable');await p.locator('.cc-worktable-palette').waitFor({state:'attached'});await p.waitForFunction(()=>document.body.dataset.worktableStatus==='ready',{timeout:20000});
    rec.before.palette=await rect(p,'.cc-worktable-palette');rec.before.stage=await rect(p,'.cc-worktable-stage');
    await shot(p,'.cc-worktable-palette',name+'-before-artist');
    await load(p,candidate+product,'.detail-info');await check(p);
    rec.after={footer:await rect(p,'.footer-grid'),product:await rect(p,'.detail-layout')};
    if(viewport.width>=1200){assert.ok(rec.after.footer.width>rec.before.footer.width+100,'footer not widened');assert.ok(rec.after.product.width>rec.before.product.width+100,'product not widened');}
    rec.checks.widths='PASS';
    assert.equal(await p.locator('input[name=detailSize]').count(),5);assert.equal(await p.locator('input[name=detailColor]').count(),6);
    const choose=async(s,col)=>{await p.locator('input[name=detailSize][value="'+s+'"]').check();await p.locator('input[name=detailColor][value="'+col+'"]').check();};
    await choose('M','red');await shot(p,'.detail-layout',name+'-after-product');
    const add=p.locator('.detail-info [data-add-to-bag]');await add.click();await add.click();await choose('XL','blue');await add.click();
    const stored=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('chapchitra-session-demo-bag-v1')));
    assert.deepEqual(stored,[['study-001~M~red',2],['study-001~XL~blue',1]]);
    await load(p,candidate+'/bag/','.demo-bag-row');assert.equal(await p.locator('[data-bag-row]').count(),2);
    const red=p.locator('[data-bag-row="study-001~M~red"]'),blue=p.locator('[data-bag-row="study-001~XL~blue"]');
    assert.match(await red.innerText(),/Size M.*Fabric Red/);assert.match(await blue.innerText(),/Size XL.*Fabric Blue/);
    await red.locator('[data-bag-adjust="-1"]').click();assert.equal(await red.locator('output').innerText(),'1');
    await p.reload();await red.waitFor();assert.equal(await red.locator('output').innerText(),'1');await blue.locator('[data-bag-remove]').click();assert.equal(await blue.count(),0);
    rec.checks.variants='PASS';await shot(p,'.demo-bag-section',name+'-after-bag');
    await load(p,candidate+product,'.detail-info');const favorite=p.locator('.detail-info [data-favorite]');
    const before=await favorite.innerText();await favorite.click();assert.notEqual(await favorite.innerText(),before);rec.checks.favorite='PASS';
    const toggle=p.locator('#themeToggle');await toggle.click();await p.waitForFunction(t=>document.documentElement.dataset.theme===t,theme==='dark'?'light':'dark',{timeout:10000});
    let f=await focus(toggle);assert.ok(!f.visible||f.outline==='none'||f.width==='0px','pointer theme focus rectangle');
    await p.keyboard.press('Tab');await toggle.focus();f=await focus(toggle);assert.ok(f.visible&&f.outline!=='none'&&f.width!=='0px','keyboard theme focus not visible');
    rec.checks.themeFocus='PASS';
    await p.keyboard.press('Tab');
    for(const selector of ['.site-header .logo-word--image','.site-footer .logo-word--footer']){
     const link=p.locator(selector).first();await link.focus();f=await focus(link);assert.ok(f.visible&&f.outline!=='none'&&f.width!=='0px','keyboard logo outline '+selector);
     // Only suppress navigation inside the QA page, to observe real pointer focus after activation.
     await link.evaluate(el=>el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation()},{capture:true,once:true}));
     await link.click();f=await focus(link);assert.ok(!f.visible||f.outline==='none'||f.width==='0px','pointer logo outline '+selector);
    }
    rec.checks.logoFocus='PASS';await shot(p,'.site-footer',name+'-after-footer');
    await load(p,candidate+'/artists-edit/','#artistWorktable');await p.waitForFunction(()=>document.body.dataset.worktableStatus==='ready',{timeout:20000});
    rec.after.palette=await rect(p,'.cc-worktable-palette');rec.after.stage=await rect(p,'.cc-worktable-stage');await check(p);
    if(viewport.width>=1200)assert.ok(rec.after.palette.width>rec.before.palette.width+40,'manual palette not widened');
    assert.ok(Math.abs(rec.before.stage.width-rec.after.stage.width)<=2&&Math.abs(rec.before.stage.height-rec.after.stage.height)<=2,'approved stage geometry changed');
    await shot(p,'.cc-worktable-palette',name+'-after-artist');rec.checks.artistGeometry='PASS';
    assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.bad,[]);assert.deepEqual(rec.external,[]);
    rec.status='PASS';
   }catch(e){rec.error=String(e.stack||e);console.log(name,rec.error);}
   finally{await c.close();results.push(rec);save();console.log(name,rec.status);}
  }}finally{await b.close();}
 }
}finally{server.kill();save();}
if(results.length!==12||results.some(r=>r.status!=='PASS'))process.exitCode=1;
