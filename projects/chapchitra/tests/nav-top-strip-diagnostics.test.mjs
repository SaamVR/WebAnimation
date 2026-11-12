import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {navGeometry} from '../src/nav-sticky-guard.mjs';

function element(top,bottom){
 return {getBoundingClientRect(){return {top,bottom,height:bottom-top}}};
}
test('iPad sticky diagnosis distinguishes document gap from visual viewport offset',()=>{
 const header=element(34,100),announcement=element(0,34);
 const view={scrollY:0,innerHeight:1112,
  visualViewport:{offsetTop:43,pageTop:43,height:1069,scale:1}};
 const report=navGeometry(header,announcement,view);
 assert.equal(report.headerTop,34);
 assert.equal(report.announcementBottom,34);
 assert.equal(report.layoutGap,0);
 assert.equal(report.visualOffsetTop,43);
 assert.equal(report.visualPageTop,43);
 assert.equal(report.visualRelativeTop,-9);
});
test('layout and native toolbar instrumentation is read-only and complete',async()=>{
 const file=await readFile(new URL('../src/nav-sticky-guard.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
 for(const label of ['html:root.documentElement','body:root.body',
  'app, announcement, siteHeader:header, main',
  'elementFromPoint(cx,cy)','visualViewport?.offsetTop',
  'visualPageTop','scrollRestoration','marginTop:css.marginTop',
  'paddingTop:css.paddingTop','topDiagnosis','rectangles']){
  assert.ok(file.includes(label),'required probe '+label);
 }
 assert.match(file,/if \(!new URLSearchParams/);
 assert.match(file,/tintButton\.addEventListener\('click'/);
 assert.match(file,/restoreBackground\(\)/);
 assert.match(file,/initialHtmlBackground/);
 assert.match(file,/initialBodyBackground/);
 assert.match(file,/browserEdgeColorProbeActive:tintProbeActive/);
 assert.match(file,/const state = capture\(\)/);
 assert.doesNotMatch(file,/scrollTo\(|scrollBy\(|style\.top\s*=|style\.transform\s*=/);
 assert.match(css,/body\{margin:0;/);
 assert.match(css,/#app\{overflow:visible\}/);
 assert.match(css,/#app > \.site-header\{[\s\S]*?top:0;/);
});
