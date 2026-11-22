import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const src=join(root,'src');
const read=path=>readFile(join(src,path),'utf8');
const otherTokens={
  'gallery-white':'#F6F7F5','silver-mist':'#E9EDEB',
  'warm-beige':'#D8CEC2','soft-gray':'#D9DCD7',
  'mushroom-gray':'#A6A29B','deep-forest':'#172419',
  'press-green':'#293D2D','dark-olive':'#1F2216',
  'walnut':'#6E523F','terracotta':'#8A503B','graphite':'#232323'
};

test('owner-approved Cream is a single canonical CSS token; all eleven other colors stay exact',async()=>{
 const css=await read('styles.css');
 assert.match(css,/--color-cream:\s*#F7EBDF\s*;/i);
 assert.equal((css.match(/--color-cream\s*:/g)||[]).length,1);
 for(const [key,value] of Object.entries(otherTokens)){
  assert.ok(css.includes('--color-'+key+':'+value+';'),key+' token changed');
 }
 assert.match(css,/--surface-paper:var\(--color-cream\)/);
});

test('worktable, light and dark semantic roles inherit Cream without a separate literal',async()=>{
 const [worktable,theme,styles,compact,long]=await Promise.all([
  read('worktable-studio.css'),read('theme.css'),read('styles.css'),
  read('buttons/compact/index.html'),read('buttons/long/index.html')
 ]);
 assert.match(worktable,/--cc-paper:var\(--color-cream\)/);
 assert.match(theme,/--theme-text:var\(--color-cream\)/);
 assert.match(theme,/--theme-focus:var\(--color-cream\)/);
 assert.match(styles,/--cream:var\(--surface-paper\)/);
 for(const markup of [compact,long])assert.match(markup,/var\(--color-cream\)/);
});

async function walk(dir){
 const output=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  // Original SVGs, raster files and Lottie are owner-approved artwork.
  if(entry.name==='assets'||entry.name==='qa'||entry.name==='vendor')continue;
  if(entry.isDirectory())output.push(...await walk(path));
  else if(/\.(?:css|js|mjs|html)$/.test(entry.name))output.push(path);
 }
 return output;
}
test('no old Cream literal survives in active UI source; artwork masters are not targeted',async()=>{
 const bad=[];
 for(const path of await walk(src)){
  const data=await readFile(path,'utf8');
  if(/#E4E3DE|\brgb\(\s*228\s*,\s*227\s*,\s*222\s*\)/i.test(data))
   bad.push(relative(src,path));
 }
 assert.deepEqual(bad,[],'Old brand Cream remains hard-coded in UI files');
});

const luminance=hex=>{
 const channels=hex.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)/255);
 return channels.map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4)
  .reduce((sum,x,i)=>sum+x*[0.2126,0.7152,0.0722][i],0);
};
const contrast=(a,b)=>{
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
};
test('Cream text exceeds WCAG AA normal-size contrast against every approved dark background',()=>{
 for(const [name,color] of [
  ['Deep Forest','#172419'],['Dark Olive','#1F2216'],['Walnut','#6E523F']
 ]){
  const value=contrast('#F7EBDF',color);
  assert.ok(value>=4.5,name+' has only '+value.toFixed(2)+':1 contrast');
 }
});
