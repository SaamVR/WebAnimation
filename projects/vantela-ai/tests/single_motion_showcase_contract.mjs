// Structural contract for the Vantela single-motion showcase (Node.js, no dependencies).
// Run: node projects/vantela-ai/tests/single_motion_showcase_contract.mjs
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const ids=['ai01','ai02','ai03','ai04','ai05','ai06','ai07'];
const media=['hero','voice','face','image','cube','cms','search',...ids];
for(const id of media){
  const matches=html.match(new RegExp('data-vantela-motion="'+id+'"','g'))||[];
  assert.equal(matches.length,1,id+' needs exactly one motion host');
}
assert.equal((html.match(/data-vantela-motion="/g)||[]).length,14,'14 media hosts');
assert.equal((html.match(/data-vantela-story="true"/g)||[]).length,7,'seven full-frame stories');
assert(!html.includes('01 / 07'),'obsolete numbered rail');
assert(!html.includes('16:10 slot'),'technical slot badge');
assert(!html.includes('>BEFORE<')&&!html.includes('>AFTER<'),'comparison labels removed');
assert(!html.includes('Plays on scroll'),'static playback labels removed');
assert(!/<img[^>]+data-vantela-motion/.test(html),'no animation image mockups remain');
assert(!/>AI0[1-8](?:\s|<)/.test(html),'technical IDs not visible to visitors');
for(const id of ids){
  const marker='data-vantela-motion="'+id+'"';
  const pos=html.indexOf(marker);
  const stageStart=html.lastIndexOf('<div style="position:relative;aspect-ratio:16/10;',pos);
  const stageEnd=html.indexOf('</button>',pos);
  assert(stageStart>=0&&stageEnd>pos&&stageEnd-pos<5000,id+' stage exists');
  const stage=html.slice(stageStart,stageEnd+9);
  assert.equal((stage.match(/<img\b/g)||[]).length,0,id+' has no legacy screenshot');
  assert(stage.includes('data-vantela-replay="'+id+'"'),id+' replay button wired');
  assert(stage.includes('padding:0'),id+' uses entire inner stage');
}
const script=(html.match(/<script id="vantela-local-animation-integration">([\s\S]*?)<\/script>/)||[])[1];
assert(script,'player script present');
// Syntax-only parse: this test does not claim browser playback or visual certification.
new Function(script);
assert(script.includes("createElement('video')"),'videos created');
assert(script.includes('playVideo(o)'), 'video activation');
assert(script.includes("if(FORCE_LOTTIE)"),'optional native Lottie mode');
assert(script.includes('addEventListener(\'click\''),'real replay click handlers');
console.log('PASS Vantela static showcase contract: 14 motion slots, 7 full-frame stories, 7 replay controls, zero embedded story screenshots, script syntax valid.');
