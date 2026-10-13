import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.CAMPAIGN_BASE_URL || 'http://127.0.0.1:8799';
mkdirSync('qa-artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200);
  assert.equal(await page.locator('.works .work').count(), 9);
  assert.equal(await page.locator('.works iframe[data-preview-src]').count(), 9);
  assert.equal(await page.locator('.hero-art iframe[src]').count(), 1, 'Featured AER hero is preserved');
  assert.equal(await page.locator('.works iframe[src]').count(), 0, 'No eager gallery previews before entry into viewport');

  await page.locator('.works').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('.works iframe[src]').length === 1);
  assert.equal(await page.locator('.works iframe[src]').count(), 1, 'Only one preview may load');
  await page.screenshot({ path: 'qa-artifacts/gallery-preview-desktop.png', fullPage: true });

  await page.locator('[data-filter="software"]').click();
  await page.locator('.work[data-kind="software"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const items = [...document.querySelectorAll('.works iframe[src]')];
    return items.length === 1 && items[0].getAttribute('src') === '/Project6/?preview=1';
  });
  assert.equal(await page.locator('.works .work[hidden] iframe[src]').count(), 0);
  await page.screenshot({ path: 'qa-artifacts/gallery-preview-filtered.png', fullPage: true });
  await page.locator('.work[data-kind="software"]').click();
  assert.match(page.url(), /\/product6\/$/, 'Existing commercial route must remain navigable');

  for (let n = 1; n <= 9; n++) {
    const route = await page.request.get(base + '/Project' + n + '/');
    assert.equal(route.status(), 200, 'Legacy /Project' + n + '/ preserved');
  }
  assert.deepEqual(errors, [], 'No homepage JavaScript errors');

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce'
  });
  const merrors = [];
  mobile.on('pageerror', error => merrors.push(error.message));
  await mobile.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await mobile.locator('.works').scrollIntoViewIfNeeded();
  await mobile.waitForFunction(() => document.querySelectorAll('.works iframe[src]').length === 1);
  const view = await mobile.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    active: document.querySelectorAll('.works iframe[src]').length
  }));
  assert.ok(view.width <= view.viewport + 2, 'Mobile horizontal overflow: ' + JSON.stringify(view));
  assert.equal(view.active, 1);
  await mobile.screenshot({ path: 'qa-artifacts/gallery-preview-mobile-reduced.png', fullPage: true });
  assert.deepEqual(merrors, [], 'No mobile JavaScript errors');
  await mobile.close();
  await page.close();
  console.log('GALLERY PREVIEW PASS: 9 routes, bounded preview, filter, mobile and reduced motion');
} finally {
  await browser.close();
}
