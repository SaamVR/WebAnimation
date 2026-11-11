import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const css = read('../src/styles.css');
const artistPage = read('../src/artists-edit/index.html');
const homePage = read('../src/index.html');
const app = read('../src/app.mjs');
const guard = read('../src/nav-sticky-guard.mjs');

test('Artist Edit alone opts out of sticky header with static normal flow', () => {
  const rule = css.match(/body\[data-page="artists-edit"\]\s+#app\s*>\s*\.site-header\s*\{([^}]*)\}/);
  assert.ok(rule, 'route-scoped header override');
  assert.match(rule[1], /position\s*:\s*static\s*;/);
  assert.match(rule[1], /top\s*:\s*auto\s*;/);
  assert.match(rule[1], /inset-block-start\s*:\s*auto\s*;/);
  assert.doesNotMatch(rule[1], /margin|padding|height|transform|translate|fixed/);
});
test('Every other page still inherits existing sticky CSS', () => {
  assert.match(css, /#app\s*>\s*\.site-header\s*\{\s*position:-webkit-sticky;\s*position:sticky;/);
  assert.doesNotMatch(css, /body\[data-page="(?:home|shop|journal|about)"\][^}]*position\s*:\s*static/);
  assert.match(artistPage, /<body data-page="artists-edit">/);
  assert.match(homePage, /<body data-page="home">/);
  assert.match(app, /app\.innerHTML=announcement\(\)\+header\(\)/);
  assert.match(guard, /if \(!new URLSearchParams\(view.location\?\.search \?\? ''\).has\('navdebug'\)\) return/);
});
