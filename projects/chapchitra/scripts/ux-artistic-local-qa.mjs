import { chromium,webkit } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';import assert from 'node:assert/strict';
const app=path.resolve(import.meta.dirname,'..'),tools='G:/CHAPCHITRA-Local/tools',sha=process.env.CC_TEST_SHA||'uncommitted',out=path.join('F:/CHAPCHITRA-F-ARTIFACTS','UX-Artistic-'+sha.slice(0,12));
fs.mkdirSync(out,{recursive:true});
const old='http://127.0.0.1:4173',base='http://127.0.0.1:4174',token=randomBytes(24).toString('hex');
const server=spawn(process.execPath,[path.join(tools,'server.cjs'),path.join(app,'dist'),'4174',token,sha],{stdio:'ignore',windowsHide:true});
const report={sha,profiles:[],motion:[]},save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const fixture=await sharp({create:{width:300,height:300,channels:4,background:{r:34,g:119,b:82,alpha:1}}}).png().toBuffer();
const load=async(p,url,sel)=>{await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await p.locator(sel).first().waitFor({state:'visible',timeout:25000});await p.evaluate(()=>document.fonts.ready)};
const shot=async(p,sel,name)=>{await p.locator(sel).first().screenshot({path:path.join(out,name+'.png'),timeout:20000,animations:'allow'})};
const focus=async(l)=>l.evaluate(e=>({active:document.activeElement===e,style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth,modality:document.documentElement.dataset.ccFocusModality,visible:e.matches(':focus-visible')}));
const ready=async(p)=>p.waitForFunction(()=>document.body.dataset.worktableStatus==='ready',null,{timeout:25000});
const rect=async(p,s)=>p.locator(s).first().evaluate(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height}});
const noOutline=f=>!f.active||f.style==='none'||f.width==='0px';
const navSel='.site-header .logo-word--image',footSel='.site-footer .logo-word--footer';
async function keyboardTo(p,loc){await p.keyboard.press('Tab');await loc.focus();return focus(loc)}
async function clickReal(p,loc,touch){if(touch)await loc.tap();else await loc.click()}
try{
 let healthy=false;for(let i=0;i<40;i++){try{const h=await (await fetch(base+'/_cc_local_health')).json();if(h.token===token&&h.sha===sha){healthy=true;break}}catch{}await wait(250)}assert.ok(healthy);
 for(const [engine,bt] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await bt.launch({headless:true});
  try{
   for(const width of [1440,834,390])for(const theme of ['light','dark']){
    const name=engine+'-'+width+'-'+theme,touch=width===390,viewport={width,height:width===1440?900:width===834?1112:844},rec={name,checks:{},status:'FAIL',errors:[],external:[]};
    const ctx=await browser.newContext({viewport,colorScheme:theme,hasTouch:touch,reducedMotion:'reduce',serviceWorkers:'block'});
    try{
     await ctx.route('**/*',async r=>{const u=new URL(r.request().url());if(/^https?:$/.test(u.protocol)&&![old,base].includes(u.origin)){rec.external.push(u.href);return r.abort()}await r.continue()});
     const p=await ctx.newPage();p.on('pageerror',e=>rec.errors.push(e.message));
     await load(p,old+'/artists-edit/','#artistWorktable');await ready(p);
     rec.beforeStage=await rect(p,'.cc-worktable-stage');
     await shot(p,'.cc-worktable-palette',name+'-before-artist');
     await load(p,base+'/artists-edit/','#artistWorktable');await ready(p);
     await p.evaluate(()=>document.fonts.ready);rec.afterStage=await rect(p,'.cc-worktable-stage');
     assert.deepEqual(rec.afterStage,rec.beforeStage,'stage geometry changed');
     rec.fonts=await p.evaluate(()=>({ui:getComputedStyle(document.querySelector('#worktableAddDemoBag')).fontFamily,heading:getComputedStyle(document.querySelector('#worktableCustomizeHeading')).fontFamily,uiLoaded:document.fonts.check('600 13px "DM Sans"'),serifLoaded:document.fonts.check('550 22px "Fraunces"')}));
     assert.match(rec.fonts.ui,/DM Sans/);assert.match(rec.fonts.heading,/Fraunces/);assert.ok(rec.fonts.uiLoaded&&rec.fonts.serifLoaded);
     for(const id of ['worktableUploadArt','worktableResetArt','worktableRemoveArt','worktableAddDemoBag'])assert.equal(await p.locator('#'+id+'.cc-sketch :is(.cc-long-art,.cc-compact-art)').count(),1);
     assert.equal(await p.locator('.cc-worktable-choice.cc-manual-choice').count(),11);
     assert.equal(await p.locator('.cc-worktable-swatch').count(),6);
     assert.ok(await p.locator('#worktableResetArt').isDisabled());assert.ok(await p.locator('#worktableRemoveArt').isDisabled());
     if(!touch){
      const choose=p.locator('.cc-worktable-choice[data-group="size"][data-value="XL"]');await choose.click();assert.equal(await choose.getAttribute('aria-pressed'),'true');
      await p.locator('.cc-worktable-choice[data-group="printSize"][data-value="A4"]').click();
      assert.equal(await p.locator('.cc-worktable-choice[data-group="printSize"][data-value="A4"]').getAttribute('aria-pressed'),'true');
     }
     rec.colors=await p.evaluate(()=>{
      const get=s=>getComputedStyle(document.querySelector(s));
      return {panel:get('.cc-worktable-palette').backgroundColor,helper:get('.cc-worktable-panel-subtitle').color,scale:get('.cc-worktable-scale-label').color,selected:get('.cc-manual-choice[aria-pressed="true"] .cc-sketch-label').color,selectedArt:getComputedStyle(document.querySelector('.cc-manual-choice[aria-pressed="true"]'),'::before').backgroundImage};
     });
     assert.match(rec.colors.selectedArt,/compact-button-terracotta/);
     if(theme==='dark'){assert.equal(rec.colors.helper,'rgb(216, 206, 194)');assert.equal(rec.colors.scale,'rgb(216, 206, 194)')}
     await shot(p,'.cc-worktable-palette',name+'-after-artist');rec.checks.editor='PASS';
     await p.locator('#worktableFile').setInputFiles({name:'qa-test.png',mimeType:'image/png',buffer:fixture});
     // A valid 300px RGBA PNG generated by the installed build dependency; no user files.
     await p.waitForFunction(()=>!document.querySelector('#worktableResetArt').disabled,null,{timeout:12000});
     if(!touch){await p.locator('#worktableResetArt').click();await p.locator('#worktableRemoveArt').click();assert.ok(await p.locator('#worktableRemoveArt').isDisabled())}
     rec.checks.upload='PASS';
     await load(p,base+'/product/?id=study-001','.detail-info');
     const toggle=p.locator('#themeToggle');await clickReal(p,toggle,touch);await p.waitForFunction(t=>document.documentElement.dataset.theme===t,theme==='light'?'dark':'light',{timeout:10000});
     assert.ok(noOutline(await focus(toggle)),'pointer toggle outline');await shot(p,'.site-header',name+'-toggle-pointer');
     const k=await keyboardTo(p,toggle);assert.ok(k.active&&k.style!=='none'&&k.width!=='0px','keyboard toggle indicator');
     await shot(p,'.site-header',name+'-toggle-keyboard');
     const nav=p.locator(navSel);
     if(touch){assert.equal(await nav.isVisible(),false);await p.locator('#menuButton').tap();await nav.waitFor({state:'visible'});}
     const n=await keyboardTo(p,nav);assert.ok(n.active&&n.style!=='none'&&n.width!=='0px','keyboard logo outline '+JSON.stringify(n));
     await shot(p,'.site-header',name+'-nav-keyboard');
     // Capture actual activation before the C02 navigation or page replacement.
     await p.evaluate(sel=>{const el=document.querySelector(sel);el.addEventListener('click',()=>{const c=getComputedStyle(el);sessionStorage.setItem('qa-pointer-nav',JSON.stringify({active:document.activeElement===el,style:c.outlineStyle,width:c.outlineWidth}));},{once:true})},navSel);
     await Promise.all([p.waitForURL(u=>u.pathname==='/',{timeout:30000}),clickReal(p,nav,touch)]);
     assert.ok(noOutline(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('qa-pointer-nav')))),'pointer navbar outline');
     await load(p,base+'/product/?id=study-001','.detail-info');const foot=p.locator(footSel);
     await foot.scrollIntoViewIfNeeded();const f=await keyboardTo(p,foot);assert.ok(f.active&&f.style!=='none'&&f.width!=='0px','keyboard footer indicator');
     await p.evaluate(sel=>{const el=document.querySelector(sel);el.addEventListener('click',()=>{const c=getComputedStyle(el);sessionStorage.setItem('qa-pointer-foot',JSON.stringify({active:document.activeElement===el,style:c.outlineStyle,width:c.outlineWidth}));},{once:true})},footSel);
     await Promise.all([p.waitForURL(u=>u.pathname==='/',{timeout:30000}),clickReal(p,foot,touch)]);
     assert.ok(noOutline(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('qa-pointer-foot')))),'pointer footer outline');
     rec.checks.focus='PASS';
     await load(p,base+'/product/?id=study-001','.detail-info');
     await p.locator('input[name=detailSize][value=M]').check();await p.locator('input[name=detailColor][value=red]').check();await p.locator('.detail-info [data-add-to-bag]').click();
     assert.deepEqual(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('chapchitra-session-demo-bag-v1'))),[['study-001~M~red',1]]);
     rec.checks.variant='PASS';assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.external,[]);rec.status='PASS';
    }catch(e){rec.error=String(e.stack||e);console.log(name,rec.error)}finally{await ctx.close();report.profiles.push(rec);save();console.log(name,rec.status)}
   }
   for(const theme of ['light','dark']){
    const name=engine+'-'+theme+'-navbar',rec={name,status:'FAIL'};
    const ctx=await browser.newContext({viewport:{width:1440,height:900},colorScheme:theme,recordVideo:{dir:out,size:{width:1440,height:900}}});
    try{
     const p=await ctx.newPage();await load(p,base+'/shop/',navSel);await p.waitForFunction(()=>!!window.__chapchitraNavbarC08);
     const nav=p.locator(navSel),before=await rect(p,navSel);await shot(p,'.site-header',name+'-before');
     await nav.hover();await p.waitForFunction(()=>window.__chapchitraNavbarC08.state.playing,null,{timeout:25000});
     assert.equal(await nav.locator('img').evaluate(e=>getComputedStyle(e).visibility),'hidden');
     await p.waitForFunction(()=>window.__chapchitraNavbarC08.state.frame>=80,null,{timeout:15000});
     await shot(p,'.site-header',name+'-during');
     rec.during=await p.evaluate(()=>window.__chapchitraNavbarC08.state);assert.equal(rec.during.theme,theme);assert.deepEqual(await rect(p,navSel),before);
     await p.waitForFunction(()=>window.__chapchitraNavbarC08.state.completed===1,null,{timeout:15000});
     assert.equal(await nav.locator('img').evaluate(e=>getComputedStyle(e).visibility),'visible');
     await shot(p,'.site-header',name+'-complete');assert.equal(await p.locator('.site-footer .cc-nav-native-stage').count(),0);
     rec.status='PASS';
    }catch(e){rec.error=String(e.stack||e);console.log(name,rec.error)}finally{await ctx.close();report.motion.push(rec);save();console.log(name,rec.status)}
   }
  }finally{await browser.close()}
 }
}finally{server.kill();save()}
if(report.profiles.length!==12||report.motion.length!==4||[...report.profiles,...report.motion].some(r=>r.status!=='PASS'))process.exitCode=1;
