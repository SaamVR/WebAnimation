import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../src/worktable-studio.css',import.meta.url),'utf8');
function block(start){
 const pos=css.indexOf(start);
 assert.notEqual(pos,-1,'missing CSS selector: '+start);
 const opening=css.indexOf('{',pos);
 return css.slice(opening+1,css.indexOf('}',opening));
}
test('persistent selected highlight matches existing selected+hover visual filter',()=>{
 const selected=block('.cc-worktable-prop[data-group]:not([data-group="upload"]).is-selected{');
 const hover=block('.cc-worktable-prop[data-group]:not([data-group="upload"]).is-selected.is-hovered{');
 const visual=b=>b.match(/filter:[\s\S]*?;/)?.[0].replace(/\s+/g,' ').trim();
 assert.equal(visual(selected),visual(hover),'selected after pointer exit must have same approved hover glow');
 assert.match(selected,/transform:translate3d\(0,var\(--cc-selected-lift\),0\)/);
 assert.match(selected,/drop-shadow\(0 0 2\.4px rgb\(248 235 204 \/ \.52\)\)/);
 assert.doesNotMatch(selected,/border:|outline:|box-shadow:/);
});

test('resting artwork and ALL approved hover/selected-hover remain unchanged',()=>{
 const rest=block('.cc-worktable-prop[data-group]{');
 assert.ok(rest.includes('filter:drop-shadow(1.25px 2.5px 1.2px rgb(33 25 17 / .31))'));
 assert.ok(rest.includes('transition:transform .19s cubic-bezier(.23,.7,.3,1),filter .19s ease'));
 const hover=block('.cc-worktable-prop[data-group].is-hovered{');
 assert.ok(hover.includes('transform:translate3d(0,-2px,0)'));
 assert.ok(hover.includes('drop-shadow(1.8px 4px 1.6px rgb(31 24 17 / .41))'));
 assert.ok(hover.includes('drop-shadow(0 0 1.5px rgb(252 240 211 / .32))'));
 const selectedHover=block('.cc-worktable-prop[data-group]:not([data-group="upload"]).is-selected.is-hovered{');
 assert.ok(selectedHover.includes('drop-shadow(0 0 2.4px rgb(248 235 204 / .52))'));
 assert.ok(!selectedHover.includes('4.6px rgb(248 237 214'));
 const upload=block('.cc-worktable-prop[data-group="upload"].is-hovered{');
 assert.ok(upload.includes('transform:translate3d(0,-3px,0)'));
});
test('all four approved group lifts and paint-tray occlusion remain exactly unchanged',()=>{
 for(const [group,selected,hover] of [['garment',4.5,4.9],['size',3.5,3.9],['color',5.5,5.9],['printSize',4,4.4]]){
  assert.ok(css.includes('.cc-worktable-prop[data-group="'+group+'"]{--cc-selected-lift:-'+selected+'px;--cc-selected-hover-lift:-'+hover+'px}'));
 }
 assert.ok(css.includes('.cc-worktable-layer[data-source="Tshirt color/Tshirt_color_box_front_panel.png"]{z-index:auto}'));
 assert.ok(css.includes('.cc-worktable-prop[data-group]{transform:none!important}'));
 assert.ok(css.includes('.cc-worktable-hit::after{content:none}'));
});
