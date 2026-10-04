import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';

// tsx resolves extensionless imports; production Node ESM does not. Test emitted JS.
const root=fileURLToPath(new URL('../',import.meta.url));
const output=await mkdtemp(join(tmpdir(),'spvoice-api-smoke-'));
let server;
try {
  const compiled=spawnSync(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),'-p',join(root,'tsconfig.api-smoke.json'),'--outDir',output],{cwd:root,stdio:'inherit'});
  if(compiled.status!==0)throw Error('Native API compilation failed');
  await writeFile(join(output,'package.json'),'{"type":"module"}');
  const {default:handler}=await import(pathToFileURL(join(output,'api/[...path].js')).href);
  server=createServer((req,res)=>{void handler(req,res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const health=await fetch(`${base}/api/health`);assert.equal(health.status,200);assert.equal((await health.json()).status,'ok');
  const token=await fetch(`${base}/api/deepgram-token`,{method:'POST',body:'{}'});assert.equal(token.status,503);assert.equal((await token.json()).code,'DEEPGRAM_NOT_CONFIGURED');
  const summary=await fetch(`${base}/api/coach-summary`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sport:'badminton',metrics:{confirmedEvents:0,totalRallies:0}})});assert.equal(summary.status,200);assert.equal((await summary.json()).provider,'LOCAL_METRICS');
  console.log('Native Node ESM API smoke check passed: health, unconfigured token, local summary.');
} finally {
  if(server)await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  await rm(output,{recursive:true,force:true});
}
