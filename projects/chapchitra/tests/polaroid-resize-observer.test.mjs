import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {polaroidInkPath} from '../src/polaroid-outline.mjs';

test('Polaroid owner outline keeps its exact dimension-derived vector path',()=>{
 const d=polaroidInkPath(280,360);
 assert.ok(d.startsWith('M 10.4 0.85 C '));
 assert.ok(d.endsWith(' Z'));
 assert.equal(d,polaroidInkPath(280,360));
 assert.equal(polaroidInkPath(0,360),'');
});
test('Polaroid WebKit ResizeObserver performs no synchronous geometry writes',async()=>{
 const src=await readFile(new URL('../src/polaroid-outline.mjs',import.meta.url),'utf8');
 const observer=src.slice(src.indexOf('const resize=new ResizeObserver(entries=>{'));
 const body=observer.slice(0,observer.indexOf('});')+3);
 assert.match(body,/pending\.add\(target\)/);
 assert.match(body,/requestAnimationFrame\(paint\)/);
 assert.doesNotMatch(body,/setAttribute\(|getBoundingClientRect|offsetWidth|offsetHeight/);
 assert.match(src,/const paint=\(\)=>\{/);
 assert.match(src,/const width=target\.offsetWidth,height=target\.offsetHeight/);
 assert.match(src,/if\(svg\.getAttribute\('viewBox'\)!==box\)svg\.setAttribute\('viewBox',box\)/);
 assert.match(src,/if\(path\.getAttribute\('d'\)!==d\)path\.setAttribute\('d',d\)/);
 assert.match(src,/if\(raf\)cancelAnimationFrame\(raf\);pending\.clear\(\)/);
});
