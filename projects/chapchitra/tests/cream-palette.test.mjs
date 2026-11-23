import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const project=resolve(import.meta.dirname,'..');
const read=p=>readFile(join(project,p),'utf8');
const expected=Object.freeze({
 'gallery-white':'#F6F7F5','silver-mist':'#E9EDEB',
 'warm-beige':'#D8CEC2','cream':'#F4EBE4',
 'soft-gray':'#D9DCD7','mushroom-gray':'#A6A29B',
 'deep-forest':'#172419','press-green':'#293D2D',
 'dark-olive':'#1F2216','walnut':'#6E523F',
 'terracotta':'#8A503B','graphite':'#232323'
});

test('global Cream update leaves the other eleven canonical colors unchanged',async()=>{
 const css=await read('src/styles.css');
 const root=css.match(/:root\s*\{([\s\S]*?)\}/)?.[1];
 assert.ok(root,'canonical root palette exists');
 const tokens=Object.fromEntries([...root.matchAll(/--color-([a-z-]+):(#[0-9A-F]{6});/g)].map(m=>[m[1],m[2]]));
 assert.deepEqual(tokens,expected);
 assert.match(css,/--surface-paper:var\(--color-cream\)/);
 assert.match(css,/--cream:var\(--surface-paper\)/);
});

test('light, dark, and Artist Edit Cream roles inherit the same canonical token',async()=>{
 const [light,dark,artist]=await Promise.all([
  read('src/styles.css'),read('src/theme.css'),read('src/worktable-studio.css')
 ]);
 assert.match(light,/--color-cream:#F4EBE4;/);
 assert.match(dark,/--theme-text:var\(--color-cream\)/);
 assert.match(dark,/--theme-focus:var\(--color-cream\)/);
 assert.match(dark,/--cream:var\(--theme-text\)/);
 assert.match(artist,/--cc-paper:var\(--color-cream\)/);
});

test('no obsolete Cream hex remains in active source code (artwork preserved)',async()=>{
 const matches=[];
 async function visit(dir){
  for(const e of await readdir(join(project,dir),{withFileTypes:true})){
   const rel=join(dir,e.name);
   if(e.isDirectory()){
    if(rel===join('src','assets')||rel===join('src','qa')||e.name==='vendor')continue;
    await visit(rel);
   }else if(/\.(?:css|mjs|cjs|js|html)$/.test(rel)){
    const source=await read(rel);
    if(/#E4E3DE\b/i.test(source))matches.push(rel);
   }
  }
 }
 await visit('src');
 assert.deepEqual(matches,[],'old Cream is prohibited in runtime source, not approved original artwork');
});

const luminance=hex=>{
 const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4));
 return v[0]*0.2126+v[1]*0.7152+v[2]*0.0722;
};
const contrast=(a,b)=>{
 const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
 return (hi+0.05)/(lo+0.05);
};
test('new Cream passes WCAG AA normal-text contrast on approved dark surfaces',()=>{
 for(const name of ['deep-forest','dark-olive','walnut','press-green','terracotta']){
  assert.ok(contrast(expected.cream,expected[name])>=4.5,name+' foreground contrast is insufficient');
 }
});
