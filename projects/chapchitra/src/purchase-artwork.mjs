// Browser-local Blob store; no uploaded artwork or payment information is transmitted.
const DB='chapchitra-demo-artwork-v1',STORE='artwork',TTL=24*60*60*1000;
let pending;function open(){return pending||=(new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=r.onblocked=()=>reject(Error('Local artwork storage unavailable'))}).catch(e=>{pending=null;throw e}))}
async function tx(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode),r=fn(t.objectStore(STORE));let value;if(r)r.onsuccess=()=>{value=r.result};t.oncomplete=()=>resolve(value);t.onerror=t.onabort=()=>reject(Error('Local artwork storage failed'))})}
const valid=id=>/^custom_[A-Za-z0-9_-]{8,100}$/.test(id);
export async function saveArtwork(id,data){if(!valid(id))throw Error('Invalid customization ID');await tx('readwrite',s=>s.put({...data,expires:Date.now()+TTL},id))}
export async function readArtwork(id){if(!valid(id))return null;const data=await tx('readonly',s=>s.get(id));if(!data||data.expires<Date.now()){if(data)await removeArtwork(id);return null}return data}
export async function removeArtwork(id){if(valid(id))await tx('readwrite',s=>s.delete(id))}
export async function pruneArtwork(){const db=await open();await new Promise((resolve,reject)=>{const t=db.transaction(STORE,'readwrite'),r=t.objectStore(STORE).openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.expires<Date.now())c.delete();c.continue()}};t.oncomplete=resolve;t.onerror=reject})}
