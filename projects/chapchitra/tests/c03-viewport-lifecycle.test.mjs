import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('C03 keeps original GSAP choreography but cancels on measured viewport or scroll changes',()=>{
 const s=get('../src/motion/c03/fly-to-bag.mjs');
 assert.match(s,/function watchFlightGeometry\(version\)/);
 assert.match(s,/watchFlightGeometry\(version\);\s*\/\/ THREADS T02 V3/);
 assert.match(s,/innerWidth!==start\.width\|\|innerHeight!==start\.height/);
 assert.match(s,/visualViewport\?\.width/);
 assert.match(s,/Math\.abs\(scrollY-start\.scroll\)>4/);
 assert.match(s,/if\(resized\|\|moved\)\{cancelC03\(\);return;\}/);
 assert.match(s,/function cleanup\(\)\{\s*stopFlightWatch\(\)/);
 assert.match(s,/window\.addEventListener\('resize',cancelC03/);
 assert.match(s,/window\.addEventListener\('scroll'/);
 assert.match(s,/duration:\.91,ease:'power2\.inOut'/,'approved flight cadence not changed');
 assert.match(s,/duration:\.24,ease:'power2\.out'/,'approved bag catch not changed');
});

test('C03 browser QA still requires actual resize and full overlay cleanup on all profiles',()=>{
 const q=get('../scripts/perf/c03-browser-qa.cjs');
 assert.match(q,/Math\.abs\(resizedViewport\.width-beforeResize\.width\)>=16/);
 assert.match(q,/Math\.abs\(resizedViewport\.documentWidth-beforeResize\.documentWidth\)>=16/);
 assert.match(q,/resized\.overlayCount===0&&resized\.count===5/);
 assert.match(q,/interrupted\.overlayCount===0&&interrupted\.count===4/);
 assert.match(q,/\'ipad-webkit\'/);
 assert.match(q,/\'mobile-webkit\'/);
});
