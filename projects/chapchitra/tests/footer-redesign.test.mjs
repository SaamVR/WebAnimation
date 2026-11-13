import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('src/app.mjs',root),'utf8');
const css=readFileSync(new URL('src/styles.css',root),'utf8');
const footer=source.split(' function footer(){')[1]?.split(' function home(){')[0];
test('one shared footer retains original brand assets, tagline and copyright',()=>{
 assert.ok(footer);
 assert.match(footer,/chapchitra-wordmark-cream-terra\.webp/);
 assert.match(footer,/PEOPLE · PLACES · PRINTS/);
 assert.match(footer,/© 2026 CHAPCHITRA · V3 architectural prototype/);
 assert.match(footer,/No orders, payments or subscriptions are processed/);
 assert.match(source,/mainPage\(\)\+'<\/main>'\+footer\(\)/);
});
test('Discover has only the three actual routes; Help labels never invent links',()=>{
 assert.match(footer,/\['Artist’s Edit','\/artists-edit\/'\]/);
 assert.match(footer,/\['Journal','\/journal\/'\]/);
 assert.match(footer,/\['About Us','\/about\/'\]/);
 assert.match(footer,/const help=\['Support','Terms & Conditions','Contact Us'\]/);
 assert.match(footer,/footer-help-pending/);
 assert.doesNotMatch(footer,/href="\/(?:support|terms|contact|bag|account|checkout|favorites|shop)\//);
 assert.doesNotMatch(footer,/<h2>Shop<\/h2>|All Samples|Regular Tees|Drop Shoulder|Tie-Dye/);
});
test('social icons are accessible and no imaginary profile destination or WhatsApp',()=>{
 const socials=source.split('const footerSocialProfiles=[')[1]?.split(' ];')[0];
 assert.ok(socials);
 for(const name of ['Instagram','Facebook','TikTok'])assert.match(socials,new RegExp("\\['"+name+"', '',"));
 assert.equal((socials.match(/<svg /g)||[]).length,3);
 assert.doesNotMatch(socials,/WhatsApp|https?:\/\//i);
 assert.match(source,/footer-social-unlinked/);
 assert.match(source,/profile link unavailable/);
 assert.match(source,/rel="noopener noreferrer"/);
});
test('illustration is structurally empty; newsletter and demo copy removed',()=>{
 assert.match(footer,/<div class="footer-illustration-space" aria-hidden="true"><\/div>/);
 assert.doesNotMatch(footer,/Art-led print and apparel demo|Pricing and sample imagery remain provisional/);
 assert.doesNotMatch(footer,/newsletterForm|footer-newsletter|Join the print studio/);
 assert.doesNotMatch(source,/newsletter\.addEventListener/);
});
test('four-area CSS grid and responsive reflow preserve approved dark olive',()=>{
 assert.match(css,/\.site-footer\s*\.footer-grid\{\s*display:grid;\s*grid-template-columns:minmax\(0,1\.65fr\)/);
 assert.match(css,/\.site-footer\{\s*padding:clamp\(38px,4vw,58px\) 0 22px;\s*background:var\(--olive\)/);
 assert.match(css,/@media\(max-width:1070px\)/);
 assert.match(css,/@media\(max-width:690px\)/);
 assert.match(css,/\.site-footer \.footer-illustration-space\{[\s\S]*?min-height:190px/);
 assert.match(css,/\.site-footer \.footer-help-pending/);
});
