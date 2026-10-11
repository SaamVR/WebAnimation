import { readFileSync, existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(join(root,p),'utf8');
const js=read('site/campaign/campaign.js');
const css=read('site/campaign/campaign.css');
const poster=read('site/assets/solecraft-actual-shoe-poster.js');
const home=read('site/index.html');

assert.ok(js.includes('class="primary-media'), 'Campaign must include media section');
assert.ok(js.indexOf("'+mediaMarkup+'") >= 0, 'media content must be injected into the campaign page');
assert.match(js,/SolecraftHeroPoster/,'Solecraft requires actual uploaded shoe poster');
assert.ok(js.includes('src="/Project\'+id+\'/?preview=1'), 'Other projects need working preview routes');
assert.match(js,/case-study-use/,'Commercial use case must be visible');
assert.match(js,/currentOutcome\.deliverable/,'Deliverable needs to be described');
assert.match(js,/CampaignTest/,'Existing timeline API must remain available');
assert.match(css,/\.primary-media/);
assert.match(css,/\.case-study-use/);

const match=poster.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
assert.ok(match,'Shoe poster must be embedded from the source-model image');
const bytes=Buffer.from(match[1],'base64');
assert.ok(bytes.length>2500,'Shoe poster should contain real image data');
assert.equal(bytes.toString('ascii',0,4),'RIFF');
assert.equal(bytes.toString('ascii',8,12),'WEBP');
assert.ok(!poster.includes('https://'),'Shoe asset must not rely on an unverified third-party URL');

for(let n=1;n<=9;n++){
 const page=read('site/product'+n+'/index.html');
 assert.match(page,/campaign\.js/,'Product '+n+' requires motion presentation script');
 assert.match(page,new RegExp('data-product="'+n+'"'),'Product page ID mismatch');
 assert.match(home,new RegExp('href="/product'+n+'/"'),'Homepage must retain campaign path '+n);
 assert.ok(existsSync(join(root,'site/Project'+n+'/index.html')),'Original project alias must remain available '+n);
}
const shoePage=read('site/product7/index.html');
assert.ok(shoePage.indexOf('solecraft-actual-shoe-poster.js')<shoePage.indexOf('campaign.js'),'Solecraft poster must be registered before campaign module');
assert.ok(js.includes('not hosted on this page yet'), 'Must not imply unhosted director film is already online');
console.log('PASS: 9 routes, working-media embedding, real shoe poster integrity, buyer stories, legacy preservation.');
