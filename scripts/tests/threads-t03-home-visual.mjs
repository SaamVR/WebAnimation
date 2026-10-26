import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.T03_HOME_URL || 'http://127.0.0.1:8765/';
const output='artifacts/threads-t03-home';
mkdirSync(output,{recursive:true});
const key='threads-t03-backpack-reward-v1';
const rewards=['reward-free-delivery','reward-5','reward-7','reward-10','reward-30','reward-50'];
const devices=[
 {name:'desktop',width:1280,height:900,touch:false},
 {name:'ipad-touch',width:834,height:1194,touch:true},
 {name:'mobile-touch',width:390,height:844,touch:true},
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const records=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const root=page=>page.frameLocator('#t03-home-backpack').locator('#backpack-svg');
async function ready(page) {
 await page.goto(base,{waitUntil:'load'});
 await root(page).waitFor({state:'visible',timeout:20000});
}
async function tap(page){
 await page.locator('#t03-home-backpack').scrollIntoViewIfNeeded();
 const box=await page.locator('#t03-home-backpack').boundingBox();
 assert.ok(box?.width>90 && box?.height>90,'SVG object is not visible');
 await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
}
try{
 for(const device of devices){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},hasTouch:device.touch,isMobile:device.name==='mobile-touch',deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  const panel=page.locator('#deal .threads-deal__panel path');
  const path=await panel.getAttribute('d');
  assert.ok(path.startsWith('M 93 0 L 1755 152'),'Original angled path changed');
  assert.equal(await page.locator('#deal .threads-deal__panel').count(),1);
  assert.equal(await page.locator('#deal img[src*="deal-backpack-static"]').count(),0);
  assert.equal(await page.locator('#deal object').count(),1);
  assert.equal(await root(page).getAttribute('class'),'is-closed','Fresh page must start closed');
  assert.ok((await page.locator('#deal').boundingBox())?.width>100,'Section missing');
  await page.locator('#deal').screenshot({path:`${output}/${device.name}-closed.png`});
  await tap(page);
  await wait(1650);
  const opened=await root(page).getAttribute('class');
  assert.match(opened,/is-opening/,'First click should open');
  const assigned=await page.evaluate(k=>localStorage.getItem(k),key);
  assert.ok(rewards.includes(assigned),'A valid reward should be persisted');
  await page.locator('#deal').screenshot({path:`${output}/${device.name}-opened.png`});
  await tap(page);
  await wait(1650);
  assert.match(await root(page).getAttribute('class'),/is-closing/,'Second click should close');
  await tap(page);
  await wait(1650);
  assert.match(await root(page).getAttribute('class'),/is-opening/,'Third click should reopen');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),assigned,'Reward should not change on repeat');
  await page.reload({waitUntil:'load'});
  await root(page).waitFor({state:'visible',timeout:20000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),assigned,'Reward should survive reload');
  await tap(page);
  await wait(1650);
  assert.match(await root(page).getAttribute('class'),/is-opening/);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),assigned,'Same reward on revisit');
  assert.equal(await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth)),0,'Horizontal overflow');
  assert.deepEqual(errors,[],'Browser runtime exceptions');
  records.push({device:device.name,result:'PASS',reward:assigned,screenshots:[`${device.name}-closed.png`,`${device.name}-opened.png`]});
  await context.close();
 }
 // Reviewer snapshots are isolated fresh browser contexts. They do not update any real visitor.
 for(const reward of rewards){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage();
  await ready(page);
  await page.evaluate(({key,reward})=>localStorage.setItem(key,reward),{key,reward});
  await page.reload({waitUntil:'load'});
  await root(page).waitFor({state:'visible',timeout:20000});
  await tap(page);
  await wait(1650);
  assert.match(await root(page).getAttribute('class'),/is-opening/);
  const visible=await page.frameLocator('#t03-home-backpack').locator('#'+reward).getAttribute('display');
  assert.notEqual(visible,'none','Expected reward artwork must be visible');
  await page.locator('#deal').screenshot({path:`${output}/reward-${reward}.png`});
  records.push({reward,result:'PASS',reviewOnly:true});
  await context.close();
 }
 writeFileSync(`${output}/results.json`,JSON.stringify(records,null,2));
 console.log('T03 homepage visual, storage and six-reward QA PASS:',JSON.stringify(records));
}finally{await browser.close();}
