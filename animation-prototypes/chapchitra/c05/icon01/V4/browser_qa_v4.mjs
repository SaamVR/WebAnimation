import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.C05_BASE_URL || 'http://127.0.0.1:8123/animation-prototypes/chapchitra/c05/icon01/V3/';
const output = path.resolve('c05-v4-browser-evidence');
await fs.mkdir(output, { recursive: true });

function inkPixels(png) {
  const {width, height, data}=PNG.sync.read(png);
  let count=0;
  for(let y=0;y<height;y+=4) for(let x=0;x<width;x+=4) {
    const i=(y*width+x)*4;
    if(data[i+3]>50 && data[i]<205 && data[i+1]<205 && data[i+2]<205) count++;
  }
  return count;
}
for (const [name, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await browserType.launch({ headless: true });
  try {
    for (const [screen, viewport] of Object.entries({
      desktop:{width:1360,height:920},
      mobile:{width:390,height:844},
      ipad:{width:820,height:1180},
    })) {
      const page=await browser.newPage({viewport, reducedMotion:'no-preference'});
      const errors=[];
      page.on('pageerror', e=>errors.push(e.message));
      await page.goto(base, {waitUntil:'load', timeout:60000});
      await page.waitForFunction(() => window.__c05V4?.engine() === 'lottie', { timeout: 30000 });
      await page.evaluate(() => window.__c05V4.pause());
      const nativeSvg=await page.locator('#native svg').count();
      assert.ok(nativeSvg>0, `${name}/${screen} native SVG missing`);
      for(const f of [0,10,28,48,65,78,110,135,150]){
        await page.evaluate(f=>window.__c05V4.seek(f), f);
        await page.waitForTimeout(125);
        if([0,28,48,65,78,110,150].includes(f)){
          const buf=await page.locator('#animated').screenshot({path:path.join(output,`${name}-${screen}-${f}.png`)});
          assert.ok(inkPixels(buf)>100, `${name}/${screen}/${f}: native Lottie blank/too little artwork`);
        }
      }
      assert.equal(errors.length,0,`${name}/${screen}: ${errors.join('; ')}`);
      assert.equal(await page.evaluate(()=>window.__c05V4.engine()),'lottie');
      await page.close();
    }
    const reduced=await browser.newPage({viewport:{width:820,height:1180}, reducedMotion:'reduce'});
    await reduced.goto(base,{waitUntil:'load'});
    await reduced.waitForFunction(()=>window.__c05V4?.engine()==='lottie',{timeout:30000});
    const st=await reduced.evaluate(()=>window.__c05V4.state());
    assert.equal(st.frame,150,`${name} reduced-motion should show final pose`);
    assert.equal(st.playing,false,`${name} reduced-motion should not autoplay`);
    await reduced.close();
  } finally {
    await browser.close();
  }
}
console.log('C05 V4 native Lottie validated in Chromium and WebKit at desktop/mobile/iPad and reduced-motion states.');
