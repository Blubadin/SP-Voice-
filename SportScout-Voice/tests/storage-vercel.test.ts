import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {storageService,createFreshSession} from '../src/services/storageService';
import handler from '../api/[...path]';
import {createServer} from 'node:http';

test('Independent IDB saves recover newer data when localStorage fails and prune deleted sessions',async()=>{
 const previousWindow=(globalThis as any).window,previousLocal=(globalThis as any).localStorage;
 const values=new Map<string,string>();let fail=false;
 (globalThis as any).window={indexedDB};(globalThis as any).indexedDB=indexedDB;
 (globalThis as any).localStorage={getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>{if(fail)throw Error('QuotaExceededError');values.set(key,value);},removeItem:(key:string)=>values.delete(key)};
 try{
  const first={...createFreshSession(),id:'first'},second={...createFreshSession(),id:'second'};
  await storageService.saveSessions([first]);
  await new Promise(resolve=>setTimeout(resolve,5));
  fail=true;await storageService.saveSessions([second]);
  assert.deepEqual((await storageService.hydrateSessions()).map(s=>s.id),['second']);
  values.clear();assert.deepEqual((await storageService.hydrateSessions()).map(s=>s.id),['second']);
  await storageService.saveSessions([]);assert.deepEqual(await storageService.hydrateSessions(),[]);
 }finally{(globalThis as any).window=previousWindow;(globalThis as any).localStorage=previousLocal;delete (globalThis as any).indexedDB;}
});
test('Vercel Node adapter returns real API JSON for a live HTTP request',async()=>{
 const server=createServer((req,res)=>{void handler(req,res);});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address() as {port:number};
 try{const response=await fetch(`http://127.0.0.1:${address.port}/api/health`);assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',/application\/json/);assert.equal((await response.json()).status,'ok');const token=await fetch(`http://127.0.0.1:${address.port}/api/deepgram-token`,{method:'POST',body:'{}'});assert.equal(token.status,503);assert.equal((await token.json()).code,'DEEPGRAM_NOT_CONFIGURED');}finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
