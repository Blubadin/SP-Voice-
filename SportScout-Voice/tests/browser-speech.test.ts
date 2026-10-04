import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {BrowserTranscriptAssembler} from '../src/domain/browserTranscript';
import {getVocabulary,aliasConflict} from '../src/domain/scoutVocabulary';
import {extractLiveSequence} from '../src/domain/liveGrammar';
import {speechNeedsReview} from '../src/services/speech/speechReview';
import {ScoutProvider,useScout} from '../src/stores/ScoutContext';
const row=(text:string,isFinal=false,confidence=0.9)=>Object.assign([{transcript:text,confidence}],{isFinal});
const packet=(...results:any[])=>({resultIndex:0,results});

test('Browser indexed hypotheses replace interim text and never append repeated finals',()=>{
 const a=new BrowserTranscriptAssembler();const id=a.accept(packet(row('เอ ตบออก')))!.id;
 assert.equal(a.accept(packet(row('เอ ตบได้แต้ม')))!.id,id);
 assert.equal(a.flush(),null);
 a.accept(packet(row('เอ ตบได้แต้ม',true)));assert.equal(a.flush()!.text,'เอ ตบได้แต้ม');
 assert.equal(a.accept(packet(row('เอ ตบได้แต้ม',true))),null);
 const next=a.accept({resultIndex:1,results:[row('เอ ตบได้แต้ม',true),row('บี หยอดได้แต้ม',true)]})!;
 assert.notEqual(next.id,id);assert.equal(a.flush()!.text,'บี หยอดได้แต้ม');
});
test('Removed interim results do not survive as invented contacts',()=>{
 const a=new BrowserTranscriptAssembler();a.accept(packet(row('เอ ตบ',true),row('ได้แต้ม')));
 a.accept({resultIndex:1,results:[row('เอ ตบ',true)]});assert.equal(a.flush()!.text,'เอ ตบ');
});
test('Thai ASR whitespace preserves actions, negation, origin and point evidence',()=>{
 const raw='เอ ตบ จาก หลัง ขวา บวก หนึ่ง ได้ แต้ม';const r=extractLiveSequence(raw,'badminton');
 assert.equal(r.needsReview,false);assert.equal(r.events[0].originZone,'Rear Right');assert.equal(r.events[0].scoreImpact?.sideAwarded,'A');assert.equal(r.events[0].rawTranscript,raw);
 const negative=extractLiveSequence('เอ ตบ ไม่ ได้ แต้ม','badminton');assert.equal(negative.events[0].scoreImpact?.points,0);assert.equal(negative.needsReview,true);
});
test('Normalized Thai aliases remain extensible and detect collisions',()=>{
 const skills=[{id:'custom',name:'Drop',sport:'badminton',enabled:true,aliases:['ลูก วาง'],count:0}] as any;
 const r=extractLiveSequence('เอ ลูก วาง ได้ แต้ม','badminton','','',undefined,getVocabulary('badminton',skills));assert.equal(r.needsReview,false);assert.equal(r.events[0].action,'Drop');assert.equal(aliasConflict('badminton','Smash','ลูกวาง',skills),'Drop');
});
test('User quick-spike phrase works locally, unknown placement and wrong sport require review',()=>{
 const exact=extractLiveSequence('A quick spike+1point','volleyball');assert.equal(exact.needsReview,false);assert.equal(exact.events[0].action,'Attack');assert.equal(exact.events[0].outcome,'KILL');
 const screenshot=extractLiveSequence('เอ ตี เร็ว บ น ขวา บวก หนึ่ง ได้ แต้ม','volleyball');assert.equal(screenshot.events[0].action,'Attack');assert.equal(screenshot.needsReview,true);assert.equal(screenshot.events[0].originZone,undefined);assert.equal(screenshot.unrecognized,'บนขวา');
 assert.equal(extractLiveSequence('เอ ตี เร็ว ได้ แต้ม','badminton').needsReview,true);
});

for(const mode of ['final-on-endpoint','interim-only','no-onend','stop-with-interim'] as const)test('Actual browser provider → React event/score flow: '+mode,async t=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;t.mock.timers.enable({apis:['setTimeout']});
 const names=['navigator','window','AudioWorkletNode'];const old=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));const oldFetch=globalThis.fetch;
 let rec:any;let started=0,released=0,requests=0;
 class Rec {
   onresult:any;onend:any;onerror:any;spoken=false;constructor(){rec=this;}
   start(){started++;}
   stop(){if(mode==='final-on-endpoint'&&this.spoken)this.onresult?.(packet(row('เอ ตบ จาก หลัง ขวา ได้ แต้ม',true)));if(mode!=='no-onend')this.onend?.();}
   abort(){}
 }
 class Node{port={onmessage:null as any,postMessage(){}};connect(){return {connect(){}};}disconnect(){}}
 class Context{state='running';destination={};audioWorklet={addModule:async()=>{}};async resume(){}createMediaStreamSource(){return {connect(){}};}createGain(){return {gain:{value:1}};}async close(){this.state='closed';}}
 for(const[name,value]of Object.entries({navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){released++;}}]})}},window:{AudioContext:Context,SpeechRecognition:Rec},AudioWorkletNode:Node}))Object.defineProperty(globalThis,name,{configurable:true,value});
 globalThis.fetch=async url=>{if(String(url).endsWith('/health'))return new Response('{"hasApiKey":false,"hasDeepgramKey":false}');requests++;throw Error('No configured AI: must not fetch');};
 let context!:ReturnType<typeof useScout>;let renderer:any;const stopCapture=async()=>{const stop=context.stopListening();t.mock.timers.tick(100);await Promise.resolve();await Promise.resolve();t.mock.timers.tick(800);await stop;};function Harness(){context=useScout();return null;}
 try{
   await act(async()=>{renderer=create(React.createElement(ScoutProvider,null,React.createElement(Harness)));});
   await act(async()=>context.startListening());assert.equal(context.isRealMicActive,true);
   await act(async()=>{rec.spoken=true;rec.onresult(packet(row('เอ ตบ จาก หลัง ขวา ได้ แต้ม')));});
   assert.equal(context.currentParsedEvent?.status,'DRAFT');assert.equal(context.currentParsedEvent?.action,'Smash');assert.equal(context.currentSession.events.length,0);
   const oldRec=rec;
   if(mode==='stop-with-interim')await act(stopCapture);
   else await act(async()=>{if(mode==='interim-only'){t.mock.timers.tick(750);rec.onresult(packet(row('เอ ตบ จาก หลัง ขวา ได้ แต้ม')));t.mock.timers.tick(750);}else t.mock.timers.tick(1500);if(mode==='no-onend')t.mock.timers.tick(800);});
   assert.equal(context.currentSession.events.length,1);const event=context.currentSession.events[0];
   assert.equal(event.status,mode==='final-on-endpoint'?'CONFIRMED':'REVIEW_REQUIRED');assert.equal(context.scoreState.scoreA,mode==='final-on-endpoint'?1:0);
   assert.equal(requests,0);
   if(mode!=='final-on-endpoint')await act(async()=>{assert.equal(context.updateEvent({...event,status:'CONFIRMED',needsReview:false}).success,true);});
   assert.equal(context.scoreState.scoreA,1);
   oldRec.onresult?.(packet(row('เอ ตบ จาก หลัง ขวา ได้ แต้ม',true)));assert.equal(context.currentSession.events.length,1);
   if(mode!=='stop-with-interim'){
     await act(async()=>t.mock.timers.tick(300));assert.equal(started,2);assert.equal(context.isRealMicActive,true);
     await act(stopCapture);
   }
   assert.equal(released,1);assert.equal(context.isRealMicActive,false);assert.equal(context.currentSession.events.length,1);
 }finally{if(renderer){await act(stopCapture);await act(async()=>renderer.unmount());}globalThis.fetch=oldFetch;for(const[name,descriptor]of old){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete(globalThis as any)[name];}t.mock.timers.reset();}
});
test('Provisional and genuinely low confidence browser evidence require review',()=>{
 assert.equal(speechNeedsReview({utteranceId:'u',provider:'browser',receivedAt:0,provisional:true}),true);
 assert.equal(speechNeedsReview({utteranceId:'u',provider:'browser',receivedAt:0,confidence:0.4}),true);
 assert.equal(speechNeedsReview({utteranceId:'u',provider:'browser',receivedAt:0,confidence:0}),false);
});
