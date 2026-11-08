import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../src/worktable-studio.css',import.meta.url),'utf8');
const js=await readFile(new URL('../src/worktable-studio.mjs',import.meta.url),'utf8');

test('approved nonselected illustrated hover choreography is unchanged',()=>{
 assert.ok(css.includes(`.cc-worktable-prop[data-group].is-hovered{
 transform:translate3d(0,-2px,0);
 filter:brightness(1.045) saturate(1.025) drop-shadow(1.8px 4px 1.6px rgb(31 24 17 / .41)) drop-shadow(0 0 1.5px rgb(252 240 211 / .32));
}`));
 assert.ok(css.includes('.cc-worktable-prop[data-group="size"].is-hovered{transform:translate3d(0,-1.5px,0)}'));
 assert.ok(css.includes("transition:transform .19s cubic-bezier(.23,.7,.3,1),filter .19s ease"));
});
test('persistent selection has per-group elevation; selected hover never falls to resting hover',()=>{
 const expected={garment:[4.5,4.9],size:[3.5,3.9],color:[5.5,5.9],printSize:[4,4.4]};
 for(const [group,[selected,hover]] of Object.entries(expected)){
  assert.ok(css.includes(`.cc-worktable-prop[data-group="${group}"]{--cc-selected-lift:-${selected}px;--cc-selected-hover-lift:-${hover}px}`),group);
  assert.ok(selected>2&&hover>=selected,group);
 }
 assert.ok(css.includes('translate3d(0,var(--cc-selected-lift),0)'));
 assert.ok(css.includes('translate3d(0,var(--cc-selected-hover-lift),0)'));
 assert.ok(css.includes('drop-shadow(0 0 1.9px rgb(255 249 232 / .66))'));
 assert.ok(css.includes('drop-shadow(0 0 4.6px rgb(248 237 214 / .32))'));
 assert.ok(css.includes('.is-selected.is-keyboard-focus'));
});
test('upload target alone has 3px hover and no persistent selected state',()=>{
 assert.ok(css.includes('.cc-worktable-prop[data-group="upload"].is-hovered{\n transform:translate3d(0,-3px,0)'));
 assert.ok(!js.includes("hitFor('Upload image notebook/Upload_image_notebook_1.png','upload','upload')"));
 assert.ok(js.includes("img.dataset.group!=='upload'"));
 assert.ok(css.includes('drop-shadow(2px 4.5px 1.7px rgb(31 24 17 / .43))'));
});
test('paint pot front panel and reduced motion are unchanged',()=>{
 assert.ok(css.includes('.cc-worktable-layer[data-source="Tshirt color/Tshirt_color_box_front_panel.png"]{z-index:auto}'));
 assert.ok(css.includes('.cc-worktable-prop[data-group]{transform:none!important}'));
 assert.ok(!css.includes('border-style:dashed'));
 assert.ok(!css.includes('.cc-worktable-hit[aria-pressed=true]::after'));
});
