import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
const dir=resolve(import.meta.dirname,'..','dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=resolve(dir,'.'+pathname);
  if(!(target===dir||target.startsWith(dir+sep))){res.writeHead(403).end();return;}
  const file=(await stat(target)).isDirectory()?join(target,'index.html'):target;
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,()=>console.log('Local structural preview http://localhost:'+port));
