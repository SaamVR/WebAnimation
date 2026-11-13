// Only install project dependencies on hosts whose static build skips npm ci.
// Render's repository-root static service runs "cd projects/chapchitra && npm run build",
// so C02 source tests need the declared devDependencies (including sharp).
// This prebuild hook is a no-op in CI/local installs that already have sharp.
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
let installed=false;
try{
 require.resolve('sharp');
 installed=true;
}catch(error){
 if(error?.code!=='MODULE_NOT_FOUND')throw error;
}
if(!installed){
 console.log('CHAPCHITRA: installing missing project build dependencies.');
 const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',
  ['ci','--include=dev','--no-audit','--no-fund'],
  {cwd:fileURLToPath(new URL('..',import.meta.url)),
   stdio:'inherit',shell:process.platform==='win32'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
 require.resolve('sharp');
}
