import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const base=resolve(root,'src/assets/brand');
const read=p=>readFileSync(resolve(base,p),'utf8');
const sha=p=>createHash('sha256').update(readFileSync(resolve(base,p))).digest('hex');
const vectorAttributes=(source,tag,attr)=>
 [...source.matchAll(new RegExp(`<${tag}\\b[^>]*?\\b${attr}="([^"]*)"[^>]*>`, 'g'))].map(m=>m[1]);
const normalizeVectorSpacing=value=>value.replace(/\s+/g,' ').trim();
const style=source=>source.match(/<style\s+type="text\/css">([\s\S]*?)<\/style>/)?.[1];

const originals={
 light:{name:'Logo.svg',sha:'7643634548c0cae82bb20777d85b07bd91bc4cce5f54311f1eadd72c564130a7',box:'0 0 2400 2020',wordBox:'0 1520 2400 542'},
 dark:{name:'Inverted Logo.svg',sha:'f38349767f1b2872c9c204259d855388c52f02fb3d37062f04b31f75dc01b9aa',box:'-2516.9 -1 2400 2020',wordBox:'-2516.9 1519 2400 542'}
};

for(const [theme,meta] of Object.entries(originals)){
 test(`${theme} Illustrator master unchanged`,()=>{
  assert.equal(sha('masters/'+meta.name),meta.sha);
  assert.match(read('masters/'+meta.name),/viewBox="0 0 2400 2400"/);
 });
 test(`${theme} full SVG: 3,066 identical path d, 55 polygons and untouched paint classes`,()=>{
  const original=read('masters/'+meta.name),derived=read(`chapchitra-${theme}-full.svg`);
  const a=vectorAttributes(original,'path','d'),b=vectorAttributes(derived,'path','d');
  const pa=vectorAttributes(original,'polygon','points'),pb=vectorAttributes(derived,'polygon','points');
  assert.equal(a.length,3066);assert.deepEqual(b.map(normalizeVectorSpacing),a.map(normalizeVectorSpacing));
  assert.equal(pa.length,55);assert.deepEqual(pb.map(normalizeVectorSpacing),pa.map(normalizeVectorSpacing));
  assert.equal(normalizeVectorSpacing(style(derived)),normalizeVectorSpacing(style(original)));
  assert.match(derived,new RegExp('viewBox="'+meta.box.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"'));
  assert.match(derived,/id="Cloth_patch"/);
  assert.match(derived,/id="Wordmark"/);
 });
 test(`${theme} cloth overlay is original group only; wordmark is isolated`,()=>{
  const cloth=read(`chapchitra-${theme}-cloth.svg`);
  const word=read(`chapchitra-${theme}-wordmark.svg`);
  assert.match(cloth,/id="Cloth_patch"/);
  assert.doesNotMatch(cloth,/id="Wordmark"/);
  assert.match(word,/id="Wordmark"/);
  assert.doesNotMatch(word,/id="Cloth_patch"/);
  assert.match(word,new RegExp('viewBox="'+meta.wordBox.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"'));
  assert.equal(normalizeVectorSpacing(style(cloth)),normalizeVectorSpacing(style(read('masters/'+meta.name))));
 });
}

test('C08 remains 240 frames / 60 FPS and original six-layer hierarchy',()=>{
 const old=JSON.parse(readFileSync(resolve(base,'../c08/wordmark-reprint-original.json'),'utf8'));
 assert.equal(old.fr,60);assert.equal(old.op,240);assert.equal(old.layers.length,6);
 assert.deepEqual(old.layers.map(x=>x.nm),[
  'ROLLER_ASSEMBLY_MASTER','ROLLER_HANDLE_ROD','ROLLER_CYLINDER',
  'HIDDEN_T','PRINT_REVEAL','BASE_WORDMARK'
 ]);
});