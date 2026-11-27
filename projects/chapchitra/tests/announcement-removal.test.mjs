import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
test('shared storefront shell starts with header and no promotional bar',()=>{const app=read('app.mjs');assert.match(app,/app\.innerHTML=header\(\)\+/);assert.doesNotMatch(app,/function announcement\(|Free delivery on orders over|Store announcement/);for(const f of ['styles.css','theme.css'])assert.doesNotMatch(read(f),/\.announcement\s*\{/)});
