import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const out=resolve('checkout-review-artifacts'),host='http://127.0.0.1:4173';
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/preview.mjs'],{stdio:'inherit',env:{...process.env,PORT:'4173'}});
let browser;const report=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(host+'/bag/')).ok)break}catch{}await new Promise(r=>setTimeout(r,150))}
 assert.ok((await fetch(host+'/bag/')).ok);
 browser=await chromium.launch({headless:true});
 for(const [device,width,height] of [['desktop',1440,900],['tablet-portrait',834,1194],['tablet-landscape',1194,834],['mobile',390,844]]){
  for(const payment of ['cod','bkash','online']){
   const context=await browser.newContext({viewport:{width,height},colorScheme:'light',reducedMotion:'reduce',hasTouch:device!=='desktop',serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.method()+' '+new URL(r.url()).pathname)});
   const name=device+'-'+payment;
   try{
    await page.goto(host+'/product/?id=study-001');
    const add=page.locator('[data-add-to-bag="study-001"]').first();
    await add.waitFor({state:'visible'});await add.click();
    await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('chapchitra-session-demo-bag-v1')||'[]').length>0);
    await page.goto(host+'/bag/');await page.locator('#bagItems [data-bag-row]').waitFor();
    assert.equal(await page.locator('#bagItems [data-bag-row]').count(),1);
    await page.reload();await page.locator('#bagItems [data-bag-row]').waitFor();
    if(payment==='cod')await page.screenshot({path:out+'/'+device+'-bag.png',fullPage:true});
    await page.getByRole('link',{name:'Proceed to checkout',exact:true}).click();
    await page.waitForURL('**/checkout/');
    const form=page.locator('#purchaseCheckout'),submit=form.locator('button[type="submit"]');
    await form.locator('[name="first"]').waitFor();
    await submit.click();
    await page.waitForFunction(()=>document.activeElement?.name==='first');
    assert.equal(await form.locator('[name="first"]').getAttribute('aria-invalid'),'true');
    assert.equal(await form.locator('#checkout-error-first').innerText(),'Enter your first name.');
    assert.ok(await form.locator('#checkout-error-phone').isVisible());
    for(const [n,v] of Object.entries({first:'Demo',last:'Customer',phone:'123',email:'demo@example.test',area:'Demo area',address:'Fictional demo address',postcode:'1200'}))await form.locator('[name="'+n+'"]').fill(v);
    await form.locator('[name="district"]').selectOption('Dhaka');
    await form.locator('[name="payment"][value="'+payment+'"]').check();
    await form.locator('[name="terms"]').check();
    if(payment==='online'){
     await form.locator('[name="billing"][value="different"]').check();
     await form.locator('[name="billingAddress"]').fill('Fictional billing address');
    }
    await submit.click();
    await page.waitForFunction(()=>document.activeElement?.name==='phone');
    assert.equal(await form.locator('[name="phone"]').getAttribute('aria-invalid'),'true');
    assert.match(await form.locator('#checkout-error-phone').innerText(),/valid Bangladesh mobile/);
    await form.locator('[name="phone"]').fill(payment==='cod'?'01712345678':payment==='bkash'?'+8801712345678':'+880 1712-345678');
    assert.equal(await form.locator('[name="phone"]').getAttribute('aria-invalid'),null);
    if(payment==='cod'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/'+device+'-checkout.png',fullPage:true})}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'checkout viewport overflow');
    await submit.click();await page.waitForURL('**/order-confirmation/',{timeout:20000});
    await page.getByRole('heading',{name:'Order Placed Successfully!',exact:true}).waitFor();
    assert.ok(await page.getByText('Thank you for shopping with CHAPCHITRA.',{exact:true}).isVisible());
    assert.ok(await page.locator('[data-animation-slot="order-confirmation"] svg circle').isVisible());
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('chapchitra-demo-order-v1')).payment),payment);
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('chapchitra-session-demo-bag-v1')||'[]').length),0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'confirmation viewport overflow');
    await page.reload();await page.getByRole('heading',{name:'Order Placed Successfully!',exact:true}).waitFor();
    if(payment==='cod')await page.screenshot({path:out+'/'+device+'-confirmation.png',fullPage:true});
    assert.deepEqual(writes,[],'demo checkout must not send write requests');
    assert.deepEqual(errors,[],'unexpected JavaScript errors');
    await page.getByRole('link',{name:'Continue shopping',exact:true}).click();await page.waitForURL('**/shop/');
    report.push({device,width,height,payment,result:'PASS'});console.log('PASS',name);
   }catch(error){
    await page.screenshot({path:out+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});
    report.push({device,width,height,payment,result:'FAIL',error:String(error.stack||error),pageErrors:errors});console.error('FAIL',name,String(error.stack||error));
   }finally{await context.close()}
   await writeFile(out+'/report.json',JSON.stringify(report,null,2));
  }
 }
 assert.equal(report.length,12);assert.ok(report.every(x=>x.result==='PASS'),'Checkout browser gate failed');
}finally{await browser?.close();server.kill()}
