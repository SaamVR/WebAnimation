import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../../site/threads/',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const html=read('index.html');
const source=readFileSync(new URL('t03-v2-preview/assets/backpack_animated(2).svg',root));

test('homepage retains the precise preapproved angled panel geometry',()=>{
 const section=html.split('<section class="content-wrap threads-deal')[1]?.split('</section>')[0];
 assert.ok(section,'T03 section missing');
 assert.match(section,/<svg class="threads-deal__panel" viewBox="0 0 1803 693" preserveAspectRatio="none"/);
 assert.match(section,/<path d="M 93 0 L 1755 152 C 1785 156 1802 179 1802 210 L 1802 631 C 1802 667 1773 693 1735 693 L 116 693 C 48 693 0 663 0 612 L 0 61 C 0 26 42 0 93 0 Z" fill="#EEECE8"/);
 assert.equal((section.match(/<svg /g)||[]).length,1);
 assert.equal((section.match(/<path /g)||[]).length,1);
 assert.equal((section.match(/<object /g)||[]).length,1);
 assert.equal((section.match(/<img /g)||[]).length,0);
 assert.doesNotMatch(section,/deal-backpack-static|t03-bag-trigger|t03-discount-card|t03-preview\/t03-preview|t03\.mjs/);
});

test('one same-origin object loads the approved exact SVG with no reanimated host',()=>{
 assert.match(html,/<object id="t03-home-backpack" class="threads-deal__backpack"/);
 assert.match(html,/data="\.\/t03-v2-preview\/assets\/backpack_animated\(2\)\.svg" type="image\/svg\+xml"/);
 assert.equal((html.match(/id="t03-home-backpack"/g)||[]).length,1);
 assert.match(html,/Unpack Your Luck/);
 assert.match(html,/Tap the backpack\. Discover your surprise\./);
 assert.match(html,/✦ Up to 50% OFF/);
 assert.ok(html.includes('threads-t03-home.css'));
 assert.ok(!html.includes('t03-v2-preview/t03.css'));
 const css=read('threads-t03-home.css');
 assert.match(css,/#deal \.threads-deal__art \.threads-deal__backpack/);
 assert.doesNotMatch(css,/@keyframes|animation-play-state|animation-timeline|\.threads-deal__panel|background-image|border-radius:\s*30px/);
 assert.doesNotMatch(html,/deal-backpack-static-20261020\.png/);
});

test('integrated SVG bytes match the approved final postcard source',()=>{
 const gitBlobHash=createHash('sha1').update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
 assert.equal(gitBlobHash,'006ee30ac5b1a197fd743d87168f65782d9551fd',
  'Approved SVG artwork/script/keyframes must not be edited during integration');
 const svg=source.toString('utf8');
 assert.equal((svg.match(/@keyframes\s+[\w-]+/g)||[]).length,16);
 assert.match(svg,/--dur:\s*1\.55s/);
 assert.match(svg,/localStorage\.setItem\(storageKey, selectedReward\)/);
 assert.match(svg,/var thresholds = \[0\.5, 0\.8, 0\.92, 0\.989, 0\.999, 1\]/);
 for(const id of ['reward-free-delivery','reward-5','reward-7','reward-10','reward-30','reward-50'])
  assert.ok(svg.includes('id="'+id+'"'),id);
});
