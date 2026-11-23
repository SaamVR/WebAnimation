import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('PR154 viewport hero changes are strictly desktop-scoped, with no global wrap modification',()=>{
 const css=read('src/styles.css');
 const marker=css.indexOf('/* CHAPCHITRA PR154: viewport-bound desktop hero only.');
 assert.ok(marker>0,'a traceable, isolated desktop correction is required');
 const segment=css.slice(marker);
 assert.match(segment,/@media \(min-width:1024px\)/);
 assert.match(segment,/#app > \.site-header \.header-line\.wrap\{/);
 assert.match(segment,/#hero \.hero-split-inner\.wrap\{/);
 assert.match(segment,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(segment,/height:calc\(100dvh - 99px\)/);
 assert.match(segment,/height:calc\(100dvh - 98px\)/);
 assert.doesNotMatch(segment,/(?:^|\n)\s*\.wrap\s*\{/,'do not alter unrelated sections');
 assert.doesNotMatch(segment,/@media\s*\(max-width/,'do not override approved tablet/mobile sizing');
});

test('dark navbar has canonical Cream circles with original paint and controls unchanged',()=>{
 const theme=read('src/theme.css');
 const block=theme.match(/:root\[data-theme="dark"\] #app > \.site-header \.nav-actions \.nav-icon:not\(\.cc-theme-toggle\)\{([^}]+)\}/)?.[1];
 assert.ok(block,'dark four-icon circle selector exists');
 assert.match(block,/background:var\(--color-cream\)/);
 assert.doesNotMatch(block,/background:var\(--color-press-green\)/);
 const artwork=read('src/assets/illustrator/nav-owner-favorites-outline.svg');
 assert.match(artwork,/\.st0\{fill:#293D2D;\}/);
 assert.match(artwork,/\.st1\{fill:#8A503B;\}/);
 assert.match(artwork,/Favourite_x5F_Icon_x5F_Fill/);
 assert.match(artwork,/Favourite_x5F_Icon_x5F_Outline/);
});

test('long Add to Bag hover restores original graphite SVG face wipe without new clip geometry',()=>{
 const css=read('src/button-system.css');
 assert.match(css,/\[data-add-to-bag\]:hover:not\(:disabled\):not\(\.added\)/);
 assert.match(css,/\.cc-long-ink-graphite\{\s*transform:scaleX\(1\)/);
 assert.match(css,/\.cc-long-ink-graphite\{\s*fill:#232323;opacity:\.94/);
 assert.match(css,/transition:transform 300ms cubic-bezier\(\.45,0,\.55,1\)/);
 assert.match(css,/\.long-returning \.cc-long-ink-green\{/);
 const runtime=read('src/long-button-runtime.mjs');
 assert.match(runtime,/if\(body\.querySelectorAll\('\.st2'\)\.length!==431/);
 assert.match(runtime,/if\(button\.matches\('\[data-add-to-bag\]'\)\)wireConfirmation\(button\)/);
 assert.match(runtime,/const clipId='long-face-ink-'/);
 assert.match(runtime,/window\.setTimeout\(\(\)=>\{/);
});

test('C02 derives two atomic composed SVGs, preserving the exact owner texture',()=>{
 const master=readFileSync(new URL('../src/assets/c02/texture.svg',import.meta.url));
 const asset=read('src/motion/c02/ink-asset.mjs');
 const expected=asset.match(/sourceSHA256:'([0-9a-f]{64})'/)?.[1];
 assert.equal(createHash('sha256').update(master).digest('hex'),expected);
 const build=read('scripts/build.mjs');
 assert.match(build,/inkComposed\('#F6F7F5'\)/);
 assert.match(build,/inkComposed\('#6E523F'\)/);
 assert.match(build,/texture-composed-dark\.svg/);
 assert.match(build,/length!==728/);
 assert.match(asset,/composedDarkPath:'\/assets\/c02\/texture-composed-dark\.svg'/);
 const runtime=read('src/motion/c02/ink-sweep.mjs');
 assert.match(runtime,/darkInk\?C02_INK_ASSET\.composedDarkPath:C02_INK_ASSET\.composedPath/);
 assert.match(runtime,/const backing=sealed\?c02Backing:'transparent'/);
 assert.match(runtime,/inkBacking=darkInk\?'walnut-source-envelope':'gallery-white-source-envelope'/);
 const early=read('src/motion/c02/early-head.html');
 assert.match(early,/html\[data-theme="dark"\]\.c02-pending\.c02-asset-arrival::after/);
 assert.match(early,/texture-composed-dark\.svg/);
 assert.match(early,/background-color:#6E523F/);
 assert.match(early,/background-color:#F6F7F5/);
 assert.match(early,/chapchitra-color-theme-v1/);
});