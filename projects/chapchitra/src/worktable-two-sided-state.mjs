/**
 * Independent local-only print layouts for front and back garment views.
 * Shared garment, size and dye remain in the existing worktable reducer.
 * Records own their object URLs until that exact side is replaced/removed.
 */
const DEFAULT_EDITOR=()=>({x:0,y:0,frameX:0,frameY:0,adjustment:0,rotation:0,selected:false,mode:'move'});
const side=initialPreset=>({url:null,bitmap:null,preset:initialPreset,editor:DEFAULT_EDITOR()});
const assertSide=(records,key)=>{
 if(!records||!Object.prototype.hasOwnProperty.call(records,key))
  throw new RangeError('Unsupported garment side: '+String(key));
};
export function createSideRecords(initialPreset='A4'){
 if(initialPreset!=='A3'&&initialPreset!=='A4')throw new RangeError('Unknown print preset');
 return {front:side(initialPreset),back:side(initialPreset)};
}
export function storeSide(records,key,{url=null,bitmap=null,preset,editor}){
 assertSide(records,key);
 if(preset!=='A3'&&preset!=='A4')throw new RangeError('Unknown print preset');
 if(!editor||typeof editor!=='object')throw new TypeError('Editor position required');
 records[key]={url,bitmap,preset,editor:{...editor}};
}
export function loadSide(records,key){
 assertSide(records,key);
 const saved=records[key];
 return {...saved,editor:{...saved.editor}};
}
export function disposeSideRecords(records,revoke){
 if(typeof revoke!=='function')throw new TypeError('URL disposer required');
 const done=new Set();
 for(const key of ['front','back']){
  assertSide(records,key);
  const item=records[key];
  if(item.url&&!done.has(item.url)){revoke(item.url);done.add(item.url)}
  item.url=null;item.bitmap=null;item.editor=DEFAULT_EDITOR();
 }
}
