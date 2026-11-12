import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.C05_BASE_URL || 'http://127.0.0.1:8123/animation-prototypes/chapchitra/c05/icon01/V3/';
const output = path.resolve('c05-v3-browser-evidence');
await fs.mkdir(output, { recursive: true });

for (const [browserName, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await browserType.launch({ headless: true });
  for (const [viewportName, viewport] of Object.entries({
    desktop: { width: 1360, height: 920 },
    mobile: { width: 390, height: 844 },
    ipad: { width: 820, height: 1180 },
  })) {
    const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__c05V3 && window.__c05V3.engine() === 'lottie', { timeout: 30000 });
    await page.evaluate(() => window.__c05V3.pause());
    for (const frame of [0, 35, 78, 115, 150]) {
      await page.evaluate(f => window.__c05V3.seek(f), frame);
      await page.waitForTimeout(100);
      if ([0, 78, 150].includes(frame)) {
        const pngBytes = await page.locator('#animated').screenshot({ path: path.join(output, `${browserName}-${viewportName}-${frame}.png`) });
        if (frame === 150) {
          const image = PNG.sync.read(pngBytes);
          const ix = (Math.floor(image.height/2) * image.width + Math.floor(image.width/2)) * 4;
          assert.ok(image.data[ix] < 150 && image.data[ix+1] < 150,
            `${browserName} ${viewportName} blank final frame: ${Array.from(image.data.slice(ix,ix+3))}`);
        }
      }
    }
    assert.equal(errors.length, 0, `${browserName} ${viewportName}: ${errors.join('; ')}`);
    assert.equal(await page.evaluate(() => window.__c05V3.engine()), 'lottie');
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 }, reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__c05V3 && window.__c05V3.engine() === 'lottie', { timeout: 30000 });
  assert.equal(await page.evaluate(() => window.__c05V3.state().frame), 150, `${browserName} reduced motion did not show final pose`);
  await page.close();
  await browser.close();
}
console.log('C05 Icon 01 V3 official lottie-web native SVG playback verified in Chromium and WebKit.');
