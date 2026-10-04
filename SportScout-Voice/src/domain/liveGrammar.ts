import {normalizeSpeechText} from './speechText';
import {correctionPattern,outcomeFields,spatialFields} from './speechFields';
import type {Vocabulary} from './scoutVocabulary';
import {getVocabulary,vocabularyCategories,canonicalSide} from './scoutVocabulary';
import {validationErrors} from './validation';
import type {ScoutEvent,Side,SportType} from './types';
const esc=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const matcherCache=new Map<string,{aliases:Array<{word:string;action:string}>;lookup:Map<string,string>;pattern:RegExp}>();
const numberMap:Record<string,string>={'ศูนย์':'0','หนึ่ง':'1','สอง':'2','สาม':'3','สี่':'4','ห้า':'5','หก':'6','เจ็ด':'7','แปด':'8','เก้า':'9','สิบ':'10'};
export interface GrammarResult {events:Partial<ScoutEvent>[];needsReview:boolean;corrections:string[];unrecognized:string}
export function extractLiveSequence(raw:string,sport:SportType,nameA='',nameB='',inherited?:{side:Side;action:string},vocabulary:Vocabulary=getVocabulary(sport)):GrammarResult{
 nameA=normalizeSpeechText(nameA);nameB=normalizeSpeechText(nameB);
 const thaiNumber=(value:string)=>{if(value.includes('สิบ')){const [tens,ones]=value.split('สิบ');const t=tens==='ยี่'?2:tens?Number(numberMap[tens]):1;const u=ones?Number(numberMap[ones]):0;return Number.isFinite(t)&&Number.isFinite(u)?String(t*10+u):value;}const digits=value.match(/ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า/g);return digits?.join('')===value?digits.map(w=>numberMap[w]).join(''):value;};
 let text=normalizeSpeechText(raw).replace(/(เบอร์|หมายเลข|โซน|คุณภาพ|เกรด|รับ)\s*((?:ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|ยี่)+)/g,(_,prefix,value)=>prefix+' '+thaiNumber(value)).replace(/([0-9])\s*แต้ม/g,'$1 แต้ม');
 const corrections=[...text.matchAll(/เอ้ย|เอ๊ย|ไม่ใช่|แก้เป็น|เปลี่ยนเป็น|ขอแก้|หมายถึง/g)].map(m=>m[0]);
 const cacheKey=JSON.stringify(vocabulary);
 let compiled=matcherCache.get(cacheKey);
 if(!compiled){const aliases=Object.entries(vocabulary).flatMap(([action,words])=>[action,...words].map(word=>({word:normalizeSpeechText(word),action}))).sort((a,b)=>b.word.length-a.word.length);compiled={aliases,lookup:new Map(aliases.map(a=>[a.word.toLowerCase(),a.action])),pattern:new RegExp(aliases.map(a=>esc(a.word)).join('|')||'(?!)','gi')};if(matcherCache.size>=8)matcherCache.delete(matcherCache.keys().next().value!);matcherCache.set(cacheKey,compiled);}
 const {aliases,lookup,pattern}=compiled;
 // Roles and embedded English words must not become contacts.
 const roleSpans=vocabularyCategories.identity.roles.flatMap(role=>[...text.matchAll(new RegExp(esc(role),'gi'))].map(m=>({start:m.index!,end:m.index!+m[0].length})));
 const all=[...text.matchAll(pattern)].filter(hit=>!/(?:ติด|โดน|ถูก)$/.test(text.slice(0,hit.index))&&!roleSpans.some(r=>hit.index!>=r.start&&hit.index!<r.end&&['ตัวเซ็ต','เซ็ตเตอร์','ลิเบอโร','ตัวรับอิสระ'].includes(text.slice(r.start,r.end)))&&(!/^[a-z ]+$/i.test(hit[0])||!/[a-z]/i.test(text[hit.index!-1]||'')&&!/[a-z]/i.test(text[hit.index!+hit[0].length]||'')));const contacts:typeof all=[];
 for(const hit of all){
 const previous=contacts.at(-1);const gap=previous?text.slice(previous.index!+previous[0].length,hit.index):'';
 if(previous&&lookup.get(hit[0].toLowerCase())==='Error'&&/^[\s,.!]*$/.test(gap))continue;
 if(previous&&lookup.get(previous[0].toLowerCase())===lookup.get(hit[0].toLowerCase())&&/^[\s,!.ๆ]*(?:(?:เอ่อ|อ่า|เอ้ย|เอ๊ย|ไม่ใช่)[\s,!.ๆ]*)*$/.test(gap)){contacts[contacts.length-1]=hit;continue;}
 if(previous&&/เอ้ย|เอ๊ย|ไม่ใช่|แก้เป็น|เปลี่ยนเป็น/.test(gap)&&!/ทีม|ฝั่ง|เบอร์|แล้ว|จากนั้น|[AB]/i.test(gap)){contacts[contacts.length-1]=hit;continue;}
 contacts.push(hit);
 }
 const actorRx=new RegExp('(?:ทีม\\s*|ฝั่ง\\s*|team\\s*)?(เอ|บี|[AB])(?=\\s|$|เบอร์|หมายเลข|#|จาก|ตำแหน่ง|อยู่|ยืน|ที่|เอ้ย|เอ๊ย|ไม่ใช่|'+aliases.map(a=>esc(a.word)).join('|')+')','gi');
 let side:Side|undefined;let jersey:string|undefined;const events:Partial<ScoutEvent>[]=[];let dangling=false;let conflictingOutcome=false;
 let covered=text;
 const erase=(value:string)=>{covered=covered.replace(value,' '.repeat(value.length));};
 const getZone=(fragment:string)=>{
 if(sport==='volleyball'){const m=[...fragment.matchAll(/(?:โซน|zone)\s*(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก)/gi)].at(-1);return m?`Zone ${numberMap[m[1]]??m[1]}`:undefined;}
 const options=Object.entries(vocabularyCategories.spatial.badminton).flatMap(([zone,words])=>[zone,...words].map(word=>({zone,word}))).sort((a,b)=>b.word.length-a.word.length);
 const rx=new RegExp(options.map(o=>esc(o.word)).join('|'),'gi');const m=[...fragment.matchAll(rx)].at(-1);return m?options.find(o=>o.word.toLowerCase()===m[0].toLowerCase())?.zone:undefined;
 };
 for(let i=0;i<contacts.length;i++){
 const hit=contacts[i],previousEnd=i?contacts[i-1].index!+contacts[i-1][0].length:0;
 let prefix=text.slice(previousEnd,hit.index),end=i+1<contacts.length?contacts[i+1].index!:text.length;
 let suffix=text.slice(hit.index!+hit[0].length,end);
 // An explicit next actor/jersey belongs to the next contact, not this contact's outcome.
 const nextActor=suffix.search(/(?:ทีม\s*|ฝั่ง\s*)?(?:[AB]|เอ|บี)(?=\s|เบอร์)|เบอร์\s*\d/);
 if(nextActor>=0&&i+1<contacts.length)suffix=suffix.slice(0,nextActor);
 const actorMatches=[...prefix.matchAll(actorRx)];const explicit=actorMatches.at(-1);if(explicit){side=canonicalSide(explicit[1]);jersey=undefined;}
 else if(nameA&&nameA!==nameB&&prefix.includes(nameA))side='A';else if(nameB&&nameA!==nameB&&prefix.includes(nameB))side='B';
 // Only volleyball retains explicitly named team across subsequent contacts. Badminton switches require an explicit actor.
 else if(i&&sport==='badminton'){side=undefined;jersey=undefined;}
 const number=prefix.match(/(?:เบอร์|หมายเลข|#)\s*(\d+|สิบ|เก้า|แปด|เจ็ด|หก|ห้า|สี่|สาม|สอง|หนึ่ง)/);jersey=number?(numberMap[number[1]]??number[1]):undefined;
 const action=lookup.get(hit[0].toLowerCase())!;
 if(explicit)erase(explicit[0]);
 if(i>0&&sport==='volleyball'&&!explicit){const prior=events.at(-1);if(!prior?.actorSide||!(['Reception','Dig'].includes(prior.action!)&&action==='Set'||prior.action==='Set'&&action==='Attack'||prior.action==='Attack'&&action==='Cover'))side=undefined;}
 if(i===0&&!side&&sport==='volleyball'&&inherited&&(['Reception','Dig'].includes(inherited.action)&&action==='Set'||inherited.action==='Set'&&action==='Attack'||inherited.action==='Attack'&&action==='Cover'))side=inherited.side;
 const spatialText=(i===0?prefix:'')+' '+suffix;
 const spatial=spatialFields(spatialText,getZone);
 let {originZone,targetZone}=spatial;
 if(spatial.dangling)dangling=true;
 if(!targetZone&&action==='Drop'&&!originZone)targetZone=getZone(suffix);
 const numeric=suffix.match(/^(?:\s|ๆ)*(\d+|ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก)(?!\d)/)||suffix.match(/(?:เกรด|คุณภาพ)\s*(\d+|ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก)/);
 const receptionQuality=action==='Reception'&&numeric?Number(numberMap[numeric[1]]??numeric[1]) as 0|1|2|3:undefined;
 const modifier=suffix.replace(/^(?:\s)*(?:ผิดพลาด|error)/i,'error');
 const result=outcomeFields(modifier,action,sport,/^(?:บล็อกแต้ม|บล็อคแต้ม|คิลบล็อก|kill block)$/i.test(hit[0]));
 const outcome=result.outcome;
 if(result.conflict)conflictingOutcome=true;
 const scoring=outcome!=='IN_PLAY';const awarded=scoring&&side?(['ERROR','BLOCKED'].includes(outcome)?(side==='A'?'B':'A'):side):undefined;
 const subtype=vocabularyCategories.subtypes[sport].filter(w=>(hit[0]+' '+suffix).includes(w)).join(' / ')||undefined;
 if(!originZone&&!targetZone&&/(?:จาก|ตำแหน่ง|โซน|เป้าหมาย)/.test(spatialText))dangling=true;
 const event:Partial<ScoutEvent>={sport,actorSide:side,actorPlayer:jersey?{jerseyNumber:jersey}:undefined,action,subtype,originZone,targetZone,receptionQuality,outcome,scoreImpact:{points:scoring?1:0,sideAwarded:awarded},rawTranscript:raw,status:'REVIEW_REQUIRED'};
 events.push(event);
 }
 // Closed vocabulary guard: recognized fields, modifiers and hesitation words may pass. Other text needs AI/review.
 if(sport==='volleyball')covered=covered.replace(/(?:รับบอลแรก|รับเสิร์ฟ|รับ|reception)\s*(?:คุณภาพ|เกรด)?\s*\d+/gi,' ').replace(/(?:คุณภาพ|เกรด)\s*\d+/g,' ');
 for(const w of Object.values(vocabularyCategories.outcome).flat().sort((a,b)=>b.length-a.length))covered=covered.replace(new RegExp(esc(w),'gi'),' ');
 for(const role of ['ตัวเซ็ต','เซ็ตเตอร์','ลิเบอโร','ตัวรับอิสระ'].sort((a,b)=>b.length-a.length))covered=covered.replace(new RegExp(esc(role),'gi'),' ');
 for(const {word} of aliases){covered=covered.replace(new RegExp(esc(word),'gi'),' ');}
 for(const words of Object.values(vocabularyCategories.spatial.badminton))for(const w of words)covered=covered.replace(new RegExp(esc(w),'gi'),' ');
 covered=covered.replace(actorRx,' ').replace(/(?:เบอร์|หมายเลข|#)\s*(?:\d+|สิบ|เก้า|แปด|เจ็ด|หก|ห้า|สี่|สาม|สอง|หนึ่ง)/g,' ').replace(/(?:โซน|zone)\s*(?:\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก)/gi,' ');
 for(const w of [...vocabularyCategories.correction,...vocabularyCategories.hesitation,...vocabularyCategories.sequence,...vocabularyCategories.subtypes[sport],...vocabularyCategories.identity.roles,'from','error','out','in play','เล่นต่อ','บล็อกแต้ม','บล็อคแต้ม',...Object.values(vocabularyCategories.outcome).flat(),...Object.values(vocabularyCategories.reception).flat(),...vocabularyCategories.spatial.origin,...vocabularyCategories.spatial.target,'คุณภาพ','เกรด','กลับ','สำเร็จ','ยังเล่นต่อ','บอล','ลูก','เร็ว','หนัก','สั้น','ยาว','ได้','ไป','ลง'].sort((a,b)=>b.length-a.length))covered=covered.replace(new RegExp(esc(w),'gi'),' ');
 if(nameA)covered=covered.replaceAll(nameA,' ');if(nameB)covered=covered.replaceAll(nameB,' ');
 covered=covered.replace(/[\s,.!?ๆ]/g,'');
 const badSpatial=sport==='volleyball'&&Object.values(vocabularyCategories.spatial.badminton).flat().some(w=>text.includes(w));
 const multiplePoints=events.filter(e=>e.scoreImpact?.points===1).length>1;
 // Contradictions and unsupported numeric evidence never receive automatic confirmation.
 const contradict=/ไม่แน่ใจ|น่าจะ|อาจจะ|หรือ|ไม่รู้|รับไม่ทัน/.test(text)||/ไม่ได้แต้ม|ยังไม่ได้แต้ม|ไม่เอาแต้ม/.test(text)&&!correctionPattern.test(text);

 const needsReview=!events.length||!!covered||badSpatial||contradict||dangling||conflictingOutcome||multiplePoints||events.some(e=>validationErrors(e).length>0);
 return {events:events.map(e=>({...e,status:needsReview?'REVIEW_REQUIRED':'CONFIRMED'})),needsReview,corrections,unrecognized:covered};
}

// A correction uttered just after a provider endpoint edits the existing contact.
// It is never another contact/point. Ambiguous field selection returns null for review.
export function extractLiveCorrection(raw:string,previous:ScoutEvent):ScoutEvent|null{
 const original=raw;raw=normalizeSpeechText(raw);
 if(!/^(?:\s|,)*(?:เอ้ย|เอ๊ย|ไม่ใช่|ขอแก้|แก้เป็น|เปลี่ยนเป็น|หมายถึง)/.test(raw))return null;
 let rest=raw;const patch:Partial<ScoutEvent>={};let changed=false;
 for(const w of vocabularyCategories.correction.slice().sort((a,b)=>b.length-a.length))rest=rest.replaceAll(w,' ');
 const sideText=rest.trim();const side=canonicalSide(sideText);if(side){patch.actorSide=side;rest='';changed=true;}
 if(/ไม่ได้แต้ม|ไม่เอาแต้ม/.test(rest)){patch.outcome='IN_PLAY';rest=rest.replace(/ไม่ได้แต้ม|ไม่เอาแต้ม/g,' ');changed=true;}
 const result=outcomeFields(rest,previous.action,previous.sport);
 if(result.recognized&&!result.conflict){patch.outcome=result.outcome;rest=rest.replace(/ไม่ได้แต้ม|ไม่เอาแต้ม|ยังเล่นต่อ|เล่นต่อ|ติดบล็อก|โดนบล็อก|ถูกบล็อก|ติดเน็ต|เสียแต้ม|เสียเอง|ตีออก|ออก|ได้แต้ม|ได้หนึ่ง(?:แต้ม)?|บวก\s*(?:หนึ่ง|1)|\+\s*1|เอซ|คิล|winner|ace|kill|error|blocked/gi,' ');changed=true;}
 if(previous.action==='Reception'){
 const m=rest.match(/(?:รับ|เกรด|คุณภาพ)?\s*(\d+|ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก)/);
 if(m){patch.receptionQuality=Number(numberMap[m[1]]??m[1]) as 0|1|2|3;rest=rest.replace(m[0],' ');changed=true;}
 }
 const choices=previous.sport==='badminton'?Object.entries(vocabularyCategories.spatial.badminton).flatMap(([zone,words])=>words.map(word=>({zone,word}))):Array.from({length:6},(_,i)=>({zone:`Zone ${i+1}`,word:`โซน ${i+1}`}));
 const zone=choices.sort((a,b)=>b.word.length-a.word.length).find(o=>rest.includes(o.word));
 if(zone){const target=/ไป|ลง|เป้าหมาย/.test(rest),origin=/จาก|ตำแหน่ง|อยู่|ยืน/.test(rest);const field=target?'targetZone':origin?'originZone':previous.originZone&&!previous.targetZone?'originZone':previous.targetZone&&!previous.originZone?'targetZone':undefined;if(!field)return null;patch[field]=zone.zone;rest=rest.replace(zone.word,' ');changed=true;}
 for(const w of [...vocabularyCategories.spatial.origin,...vocabularyCategories.spatial.target,...vocabularyCategories.hesitation])rest=rest.replaceAll(w,' ');
 if(!changed||rest.replace(/[\s,.!ๆ]/g,''))return null;
 const updated={...previous,...patch,rawTranscript:`${previous.rawTranscript||''} → ${original}`};
 const scoring=updated.outcome!=='IN_PLAY';updated.scoreImpact={points:scoring?1:0,sideAwarded:scoring&&updated.actorSide?(['ERROR','BLOCKED'].includes(updated.outcome)?updated.actorSide==='A'?'B':'A':updated.actorSide):undefined};
 return validationErrors(updated).length?null:updated;
}
