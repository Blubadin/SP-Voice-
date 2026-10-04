import {normalizeSpeechText} from './speechText';
import type {SportType} from './types';

export const correctionPattern=/(?:เฮ้ย\s*ไม่ใช่|เอ้ย|เอ๊ย|ไม่ใช่|ขอแก้|แก้เป็น|เปลี่ยนเป็น|หมายถึง|sorry\s+actually|actually|correction)/i;
const outcomeRx=/(ไม่ได้แต้ม|ไม่เอาแต้ม|ยังเล่นต่อ|เล่นต่อ|in[ -]?play|ติดบล็อก|โดนบล็อก|ถูกบล็อก|blocked|ติดเน็ต|เสียแต้ม|เสียเอง|ตีออก|เสิร์ฟเสีย|เสิร์ฟออก|ผิดพลาด|error|out\b|ออก(?=ได้|บวก|[\s,.!]|$)|ได้แต้ม|ได้หนึ่ง(?:แต้ม)?|บวก\s*(?:หนึ่ง|1)|\+\s*1|เป็นแต้ม|winner|เอซ|ace\b|คิล|kill\b)/gi;
export function outcomeFields(text:string,action:string,sport:SportType,implied=false) {
  const clauses=normalizeSpeechText(text).split(correctionPattern);
  let tokens:string[]=[];
  for(const clause of clauses){const found=[...clause.matchAll(outcomeRx)].map(m=>m[0]);if(found.length)tokens=found;}
  const loss=tokens.some(t=>/ติด|เสีย|ออก|ผิดพลาด|error|out|blocked|โดน|ถูก/i.test(t));
  const noPoint=tokens.some(t=>/ไม่ได้|ไม่เอา|เล่นต่อ|in[ -]?play/i.test(t));
  const win=tokens.some(t=>/ได้แต้ม|ได้หนึ่ง|บวก|\+|เป็นแต้ม|winner|เอซ|ace|คิล|kill/i.test(t)&&!/ไม่ได้/.test(t));
  const conflict=(loss&&win)||(noPoint&&(win||loss));
  const blocked=tokens.some(t=>/บล็อก|blocked/i.test(t));
  const ace=tokens.some(t=>/เอซ|ace/i.test(t));
  const outcome=noPoint?'IN_PLAY':blocked?(sport==='badminton'?'ERROR':'BLOCKED'):loss?'ERROR':ace&&action==='Serve'&&sport==='volleyball'?'ACE':win||implied?(sport==='volleyball'&&action==='Attack'?'KILL':'WINNER'):action==='Error'?'ERROR':'IN_PLAY';
  return {outcome,conflict,recognized:tokens.length>0};
}

export function spatialFields(text:string,getZone:(s:string)=>string|undefined) {
  const intents=[...text.matchAll(/จาก|ตำแหน่ง|อยู่|ยืน|ที่|ไป|ลง|เป้าหมาย|ตก|\bfrom\b|\bto\b/gi)];
  let originZone:string|undefined,targetZone:string|undefined;
  let dangling=false;
  for(let i=0;i<intents.length;i++){
    const intent=intents[i];const fragment=text.slice(intent.index!+intent[0].length,intents[i+1]?.index);
    const zone=getZone(fragment);if(!zone){dangling=true;continue;}
    if(/^(ไป|ลง|เป้าหมาย|ตก|to)$/i.test(intent[0]))targetZone=zone;else originZone=zone;
  }
  return {originZone,targetZone,dangling};
}

// Only complete outcome phrases can attach to a single pending contact.
export function isOutcomeOnly(raw:string) {
  raw=normalizeSpeechText(raw);
  const clean=raw.replace(outcomeRx,' ').replace(/เอ่อ|อ่า|ครับ|ค่ะ|นะ|เลย/g,' ').replace(/[\s,.!?ๆ]/g,'');
  return !clean&&outcomeFields(raw,'Smash','badminton').recognized;
}
