import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {ScoutProvider,useScout} from '../src/stores/ScoutContext';
import {ContinuousSpeechProvider} from '../src/services/speech/ContinuousSpeechProvider';
import {speechNeedsReview} from '../src/services/speech/speechReview';
import {extractLiveSequence} from '../src/domain/liveGrammar';
import {getVocabulary,aliasConflict} from '../src/domain/scoutVocabulary';
import {INITIAL_SKILLS} from '../src/sports/skillData';
import {replayScore} from '../src/domain/scoreReplay';
import {StreamTranscriptAssembler} from '../src/domain/streamTranscript';
import {handleApi} from '../src/server/api';
import type {ParsedEvent} from '../src/types/scout';

for(const [text,sport,side,outcome] of [
 ['เอ ตบออก เอ้ย ได้แต้ม','badminton','A','WINNER'],
 ['เอ ตบได้แต้ม เอ้ย ออก','badminton','B','ERROR'],
 ['ทีมเอ บล็อกแต้ม','volleyball','A','WINNER'],
 ['ทีมเอ ตบผิดพลาด','volleyball','B','ERROR'],
 ['A spike kill','volleyball','A','KILL'],
 ['A Smash Winner','badminton','A','WINNER']
] as const)test(`Local outcome: ${text}`,()=>{const r=extractLiveSequence(text,sport);assert.equal(r.needsReview,false,r.unrecognized);assert.equal(r.events.length,1);assert.equal(r.events[0].scoreImpact?.sideAwarded,side);assert.equal(r.events[0].outcome,outcome);});

test('Target followed by corrected origin keeps both explicit endpoints',()=>{const r=extractLiveSequence('เอ ตบไปหน้าซ้าย จากหลังขวาได้แต้ม','badminton');assert.equal(r.needsReview,false);assert.equal(r.events[0].originZone,'Rear Right');assert.equal(r.events[0].targetZone,'Front Left');});
test('Player role is not a second Set contact',()=>{const r=extractLiveSequence('ทีมเอ เซ็ตเตอร์ เบอร์ 7 เซ็ตไปโซน 4','volleyball');assert.equal(r.events.length,1);assert.equal(r.needsReview,false,r.unrecognized);});
test('Conflicting outcome or negation requires review',()=>{for(const text of ['เอ ตบไม่ได้แต้ม','เอ ตบออกได้แต้ม'])assert.equal(extractLiveSequence(text,'badminton').needsReview,true);});
test('Custom enabled aliases and disabled skills reach the live parser',()=>{const skills=INITIAL_SKILLS.map(s=>s.sport==='badminton'&&s.name==='Smash'?{...s,aliases:[...s.aliases,'กระแทกลูก']}:s);const r=extractLiveSequence('เอ กระแทกลูกได้แต้ม','badminton','','',undefined,getVocabulary('badminton',skills));assert.equal(r.needsReview,false);assert.equal(r.events[0].action,'Smash');const disabled=skills.map(s=>s.name==='Smash'?{...s,enabled:false}:s);assert.equal(extractLiveSequence('เอ กระแทกลูกได้แต้ม','badminton','','',undefined,getVocabulary('badminton',disabled)).needsReview,true);assert.ok(aliasConflict('badminton','Drop','ตบ',skills));});
const point=(n:number,sport:'badminton'|'volleyball'='badminton',side:'A'|'B'='A'):ParsedEvent=>({id:String(n),sessionId:'s',sport,rallyId:String(n),timestamp:new Date(n*1000).toISOString(),actorSide:side,action:'Manual Point',outcome:'WINNER',scoreImpact:{points:1,sideAwarded:side},recordType:'MANUAL_POINT',source:'manual',status:'CONFIRMED'});
test('Manual points use set transitions and chosen match format',()=>{const events=Array.from({length:21},(_,i)=>point(i)).reverse();assert.equal(replayScore(events,'badminton').state.setsA,1);assert.equal(replayScore(events,'badminton').state.currentSet,2);assert.equal(replayScore(events.slice(-11),'badminton','11 pts (Best of 3)').state.setsA,1);const single=Array.from({length:30},(_,i)=>point(i)).reverse();assert.equal(replayScore(single,'badminton','1 Set (30 pts)').state.isMatchFinished,true);const vb=Array.from({length:50},(_,i)=>point(i,'volleyball')).reverse();assert.equal(replayScore(vb,'volleyball','25 pts (Best of 3)').state.isMatchFinished,true);assert.equal(replayScore(vb,'volleyball','25 pts (Best of 5)').state.isMatchFinished,false);});
test('Replay returns every snapshot and never mutates input',()=>{const events=Array.from({length:2000},(_,i)=>point(i,'badminton',i%2?'B':'A')).reverse();const saved=JSON.stringify(events);const r=replayScore(events,'badminton');assert.equal(r.snapshots.size,2000);assert.equal(JSON.stringify(events),saved);assert.equal(r.events[0].scoreAfterA,r.state.scoreA);});
test('Stream assembler preserves word confidence and timings',()=>{const a=new StreamTranscriptAssembler();const r=a.accept({type:'Results',start:0,duration:1,is_final:true,speech_final:true,channel:{alternatives:[{transcript:'เอ ตบ',words:[{word:'เอ',confidence:0.3,start:0,end:0.2},{word:'ตบ',confidence:0.99,start:0.2,end:1}]}]}});assert.equal(r?.words?.length,2);assert.equal(speechNeedsReview({utteranceId:'u',provider:'deepgram',receivedAt:1,words:r?.words}),true);assert.equal(speechNeedsReview({utteranceId:'u',provider:'deepgram',receivedAt:1,gap:true}),true);});

test('Real continuous queue: delayed AI, rule point, split outcome, confidence review and manual set point',async()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 const proto=ContinuousSpeechProvider.prototype,oldStart=proto.start,oldStop=proto.stop,oldCapturing=proto.isCapturing,oldFetch=globalThis.fetch;let cb:any;
 proto.start=async function(callbacks){cb=callbacks;cb.onStatus('listening');return true;};proto.stop=async function(){cb?.onStatus('stopped');};proto.isCapturing=()=>true;
 let requests=0;globalThis.fetch=async(url)=>{if(String(url).endsWith('/health'))return new Response('{"hasApiKey":true,"hasDeepgramKey":true}');requests++;await new Promise(resolve=>setTimeout(resolve,15));return new Response(JSON.stringify({success:true,data:{needsReview:false,events:[{actorSide:'A',action:'Smash',outcome:'WINNER',scoreImpact:{points:1,sideAwarded:'A'}}]}}));};
 let ctx!:ReturnType<typeof useScout>;function Harness(){ctx=useScout();return null;}let renderer:any;
 try{
  await act(async()=>{renderer=create(React.createElement(ScoutProvider,null,React.createElement(Harness)));});
  await act(async()=>ctx.startListening());
  await act(async()=>{cb.onTranscript('ai','เอ เฆี่ยนได้แต้ม',true);cb.onTranscript('rule','บี หยอดได้แต้ม',true);await new Promise(resolve=>setTimeout(resolve,80));});
  assert.equal(requests,1);assert.equal(ctx.scoreState.scoreA,1);assert.equal(ctx.scoreState.scoreB,1);assert.notEqual(ctx.currentSession.events[0].rallyId,ctx.currentSession.events[1].rallyId);
  await act(async()=>{cb.onTranscript('contact','เอ ตบจากหลังขวา',true);cb.onTranscript('result','ได้แต้ม',true);await new Promise(resolve=>setTimeout(resolve,30));});
  assert.equal(ctx.scoreState.scoreA,2);assert.equal(ctx.currentSession.events.length,3);assert.equal(ctx.currentSession.events[0].originZone,'Rear Right');
  await act(async()=>{cb.onTranscript('uncertain','บี หยอดได้แต้ม',true,{utteranceId:'uncertain',provider:'deepgram',receivedAt:Date.now(),words:[{word:'บี',confidence:0.3}]});});
  assert.equal(ctx.scoreState.scoreB,1);assert.equal(ctx.currentSession.events[0].status,'REVIEW_REQUIRED');assert.equal(ctx.currentSession.events[0].speechEvidence?.words?.[0].confidence,0.3);
  const beforeUndo=ctx.currentSession.events.length;
  await act(async()=>{cb.onTranscript('unsafe-undo','undo',true,{utteranceId:'unsafe-undo',provider:'deepgram',receivedAt:Date.now(),gap:true});});
  assert.equal(ctx.currentSession.events.length,beforeUndo);
  await act(async()=>{for(let i=0;i<19;i++)ctx.adjustScore('A',1);});
  assert.equal(ctx.scoreState.setsA,1);assert.equal(ctx.scoreState.currentSet,2);
  await act(async()=>{cb.onTranscript('multiple','เอ หยอดได้แต้ม แรลลี่ใหม่ บี ตบได้แต้ม',true);});
  assert.equal(ctx.scoreState.scoreA,1);assert.equal(ctx.scoreState.scoreB,1);
  assert.notEqual(ctx.currentSession.events[0].rallyId,ctx.currentSession.events[1].rallyId);
 }finally{if(renderer)await act(async()=>renderer.unmount());proto.start=oldStart;proto.stop=oldStop;proto.isCapturing=oldCapturing;globalThis.fetch=oldFetch;}
});
test('Vercel shared secrets require access; session key cannot unlock another provider',async()=>{const oldFetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Must not spend shared key');};try{const env={VERCEL:'1',GEMINI_API_KEY:'shared-gemini',DEEPGRAM_API_KEY:'shared-deepgram'};const health=await handleApi(new Request('https://app.example/api/health'),env);assert.equal((await health.json()).hasApiKey,false);const req=new Request('https://app.example/api/deepgram-token',{method:'POST',headers:{'x-scout-gemini-key':'user-gemini'},body:'{}'});assert.equal((await handleApi(req,env)).status,503);assert.equal(calls,0);}finally{globalThis.fetch=oldFetch;}});
test('Without a database key verification uses session storage and never returns the key',async()=>{const oldFetch=globalThis.fetch;const key='test-user-key-more-than-twenty-chars';globalThis.fetch=async()=>new Response('{"candidates":[{"content":{"parts":[{"text":"{\\"ok\\":true}"}]}}]}');try{const res=await handleApi(new Request('https://app.example/api/provider-key',{method:'POST',body:JSON.stringify({apiKey:key}),headers:{'x-scout-client-id':'session-test'}}),{});assert.equal(res.status,200);const text=await res.text();assert.equal(text.includes(key),false);assert.equal(JSON.parse(text).storage,'SESSION_ONLY');}finally{globalThis.fetch=oldFetch;}});

test('Worklet drains partial PCM tail before acknowledging finalization',async()=>{
 const {readFile}=await import('node:fs/promises');const {runInNewContext}=await import('node:vm');let Processor:any;const messages:any[]=[];
 class Base{port={onmessage:null as any,postMessage:(message:any)=>messages.push(message)};}
 runInNewContext(await readFile('public/scout-pcm-worklet.js','utf8'),{AudioWorkletProcessor:Base,Int16Array,Math,registerProcessor:(_name:string,p:any)=>{Processor=p;}});
 const processor=new Processor();processor.process([[new Float32Array(128).fill(0.5)]]);assert.equal(messages.length,0);processor.port.onmessage({data:{type:'flush'}});assert.equal(new Int16Array(messages[0].pcm).length,128);assert.equal(messages[1].flushed,true);assert.equal(processor.offset,0);
});
