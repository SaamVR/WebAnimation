import test from 'node:test';
import assert from 'node:assert/strict';
import {createSideRecords,storeSide,loadSide,disposeSideRecords}
 from '../src/worktable-two-sided-state.mjs';

const pos=(x,y,adjustment,rotation,mode='move')=>
 ({x,y,adjustment,rotation,selected:true,mode});

test('front and back artwork objects, locations and A3/A4 choices remain independent',()=>{
 const records=createSideRecords('A4');
 const a={id:'art-A'},b={id:'art-B'};
 storeSide(records,'front',{url:'blob:art-A',bitmap:a,preset:'A3',
  editor:pos(43,-12,22,90,'resize')});
 storeSide(records,'back',{url:'blob:art-B',bitmap:b,preset:'A4',
  editor:pos(-17,64,-14,270,'rotate')});
 assert.equal(loadSide(records,'front').url,'blob:art-A');
 assert.equal(loadSide(records,'back').url,'blob:art-B');
 assert.strictEqual(loadSide(records,'front').bitmap,a);
 assert.strictEqual(loadSide(records,'back').bitmap,b);
 assert.deepEqual(loadSide(records,'front').editor,pos(43,-12,22,90,'resize'));
 assert.deepEqual(loadSide(records,'back').editor,pos(-17,64,-14,270,'rotate'));
 assert.equal(loadSide(records,'front').preset,'A3');
 assert.equal(loadSide(records,'back').preset,'A4');
 const edited=loadSide(records,'back');edited.editor.x=999;
 assert.equal(loadSide(records,'back').editor.x,-17);
});
test('reset/remove applies to only one side and does not revoke opposite bitmap',()=>{
 const records=createSideRecords();
 storeSide(records,'front',{url:'blob:front',bitmap:{},preset:'A4',editor:pos(20,35,15,90)});
 storeSide(records,'back',{url:'blob:back',bitmap:{},preset:'A3',editor:pos(-20,-25,-5,180)});
 storeSide(records,'back',{url:null,bitmap:null,preset:'A3',editor:pos(0,0,0,0)});
 assert.equal(loadSide(records,'front').url,'blob:front');
 assert.equal(loadSide(records,'back').url,null);
 const revoked=[];disposeSideRecords(records,url=>revoked.push(url));
 assert.deepEqual(revoked,['blob:front']);
});
test('page disposal revokes both surviving URLs once',()=>{
 const records=createSideRecords();
 for(const key of ['front','back'])
  storeSide(records,key,{url:'blob:shared',bitmap:{},preset:'A4',editor:pos(0,0,0,0)});
 const disposed=[];disposeSideRecords(records,u=>disposed.push(u));
 assert.deepEqual(disposed,['blob:shared']);
 assert.equal(loadSide(records,'front').url,null);
 assert.equal(loadSide(records,'back').bitmap,null);
});
test('invalid side and print format fail closed',()=>{
 assert.throws(()=>createSideRecords('A2'),RangeError);
 const records=createSideRecords();
 assert.throws(()=>loadSide(records,'sideways'),RangeError);
 assert.throws(()=>storeSide(records,'front',{preset:'A2',editor:{}}),RangeError);
});
