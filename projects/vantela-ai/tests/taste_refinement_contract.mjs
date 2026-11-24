// Pass 2 supersedes the previous tab and decorative contracts. Preserve shared invariants.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const cards=html.slice(html.indexOf('<!-- 2'),html.indexOf('<!-- 3'));
assert.deepEqual([...cards.matchAll(/flex:1 1 240px;min-width:0;background:(#[A-F0-9]+);color:/g)].map(m=>m[1]),['#006BE0','#03DDB3','#F15A24','#F6BC17']);
const motif=label=>html.match(new RegExp('<div aria-hidden="true"[^\\n]*data-replaces="'+label+'"[^\\n]*'))?.[0];
assert(motif('hero cyan circle').includes('fill-rule="evenodd"'));
assert(motif('hero yellow triangle').includes('width:112px;height:112px'));
assert(motif('hero orange ring').includes('fill="#03DDB3"'));
assert(motif('capabilities orange ring').includes('fill-rule="evenodd"'));
assert(motif('capabilities yellow circle').includes('fill="#F15A24"'));
assert(!html.includes('data-replaces="capabilities cyan circle"'));
assert.equal((html.match(/padding:clamp\(12px,2\.1vw,28px\)/g)||[]).length,7);
for(const asset of ['preview-white.mp4','preview.mp4','preview-web.mp4'])assert(existsSync(resolve(root,'assets/animations/ai04',asset)));
console.log('PASS shared Taste design invariants; owner-pass2-contract covers new interaction and motifs.');
