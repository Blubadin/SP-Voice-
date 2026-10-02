import {canonicalSide} from './scoutVocabulary';
import {ScoutEvent,Side,SportType} from './types';
import {validationErrors} from './validation';
const badminton=/net kill|net shot|serve|return|clear|drop|smash|drive|lift|block|เน็ตกิล|ซ้ำหน้าเน็ต|วางหน้าเน็ต|รับเสิร์ฟ|เสิร์ฟ|เคลียร์|หยอด|ตบ|ไดรฟ์|ดาด|ยก|บล็อก/gi;
const volleyball=/free ball|overpass|reception|serve|attack|spike|block|cover|error|dig|set|รับเสิร์ฟ|รับบอลแรก|เสิร์ฟ|ฟรีบอล|บอลล้น|เซ็ต|จ่ายบอล|ตบ|บล็อก|ขุด|คัฟเวอร์|ผิดพลาด|รับ(?=[ศูนย์หนึ่งสองสาม0-3])/gi;
const dictionary:Record<string,string>={'เน็ตกิล':'Net Kill','ซ้ำหน้าเน็ต':'Net Kill','วางหน้าเน็ต':'Net Shot','รับเสิร์ฟ':'Return','เสิร์ฟ':'Serve','เคลียร์':'Clear','หยอด':'Drop','ตบ':'Smash','ไดรฟ์':'Drive','ดาด':'Drive','ยก':'Lift','บล็อก':'Block','รับบอลแรก':'Reception','รับ':'Reception','ฟรีบอล':'Free Ball','บอลล้น':'Overpass','เซ็ต':'Set','จ่ายบอล':'Set','ขุด':'Dig','คัฟเวอร์':'Cover','ผิดพลาด':'Error'};
function identifySide(text:string,a:string,b:string):Side|undefined {const explicit=[...text.matchAll(/(?:^|\s|ทีม\s*|team\s*|ฝั่ง\s*)(เอ|บี|[ab])(?=\s|$|เบอร์|หมายเลข|#)/gi)];if(explicit.length)return canonicalSide(explicit.at(-1)![1]);if(a&&text.includes(a))return 'A';if(b&&text.includes(b))return 'B';}
function badZone(text:string){const m=[...text.matchAll(/หน้าซ้าย|ซ้ายหน้า|หน้าขวา|ขวาหน้า|หน้ากลาง|หลังซ้าย|ซ้ายหลัง|หลังขวา|ขวาหลัง|หลังกลาง|กลางซ้าย|กลางขวา|กลางคอร์ด|กลางสนาม|front (?:left|center|right)|mid (?:left|center|right)|rear (?:left|center|right)/gi)].at(-1);if(!m)return undefined;const s=m[0].toLowerCase();if(/[a-z]/.test(s))return s.replace(/\b\w/g,c=>c.toUpperCase());return `${s.includes('หน้า')?'Front':s.includes('หลัง')?'Rear':'Mid'} ${s.includes('ซ้าย')?'Left':s.includes('ขวา')?'Right':'Center'}`;}
export function parseSequence(text:string,sport:SportType,nameA='',nameB=''):Partial<ScoutEvent>[] {
 const matches=[...text.matchAll(sport==='badminton'?badminton:volleyball)];if(!matches.length)return [{sport,action:'',outcome:'IN_PLAY',scoreImpact:{points:0},rawTranscript:text,status:'REVIEW_REQUIRED'}];
 let side:Side|undefined;let jersey:string|undefined;
 return matches.map((m,i)=>{
 const previousEnd=i?matches[i-1].index!+matches[i-1][0].length:0;
 const prefix=text.slice(previousEnd,m.index);const next=i+1<matches.length?matches[i+1].index!:text.length;
 let suffix=text.slice(m.index!+m[0].length,next);
 // A new explicitly named actor belongs to the following action.
 suffix=suffix.split(/\s+(?:ทีม\s*)?[AB]\s|\s+เบอร์\s*\d/i)[0];
 const explicit=identifySide(prefix,nameA,nameB);if(explicit){side=explicit;jersey=undefined;}
 const number=prefix.match(/(?:เบอร์|#|หมายเลข)\s*(\d+)/);if(number)jersey=number[1];
 const word=m[0].toLowerCase();let action=dictionary[word]||word.replace(/\b\w/g,c=>c.toUpperCase());if(sport==='volleyball'){if(action==='Smash'||action==='Spike')action='Attack';if(word==='รับเสิร์ฟ')action='Reception';}
 const outcome=/ได้แต้ม|ได้หนึ่ง|ได้หนึ่งแต้ม|\+\s*1|บวก\s*(?:1|หนึ่ง)|winner|kill|คิล|เอซ|ace/i.test(suffix)?(sport==='volleyball'&&action==='Attack'?'KILL':/เอซ|ace/i.test(suffix)?'ACE':'WINNER'):/ติดบล็อก|blocked/i.test(suffix)?'BLOCKED':/ติดเน็ต|เสียแต้ม|ออก|error/i.test(suffix)?'ERROR':'IN_PLAY';
 let originZone:string|undefined,targetZone:string|undefined;
 if(sport==='badminton') {originZone=badZone(prefix.replace(/^.*(?:\s[AB]\s)/i,''));const target=suffix.match(/(?:ไป|ลง)\s*(.*)/);if(target)targetZone=badZone(target[1]);else if(action==='Drop')targetZone=badZone(suffix);const from=suffix.match(/(?:จาก|ตำแหน่ง|อยู่|ยืน)\s*(.*?)(?:ไป|ลง|$)/);if(from)originZone=badZone(from[1]);}
 else{const z=suffix.match(/(?:โซน|zone)\s*(\d+)/i);if(z){if(/ไป|ลง|to/i.test(suffix))targetZone=`Zone ${z[1]}`;else originZone=`Zone ${z[1]}`;}}
 const quality=action==='Reception'?(suffix.match(/^\s*([0-9]|ศูนย์|หนึ่ง|สอง|สาม)/)||suffix.match(/(?:คุณภาพ|เกรด)\s*([0-9]|ศูนย์|หนึ่ง|สอง|สาม)/))?.[1]:undefined;
 const receptionQuality=quality===undefined?undefined:({'ศูนย์':0,'หนึ่ง':1,'สอง':2,'สาม':3}[quality]??Number(quality)) as 0|1|2|3;
 const scoring=outcome!=='IN_PLAY';const sideAwarded=scoring&&side?(['ERROR','BLOCKED'].includes(outcome)?(side==='A'?'B':'A'):side):undefined;
 const e:Partial<ScoutEvent>={sport,actorSide:side,actorPlayer:jersey?{jerseyNumber:jersey}:undefined,action,originZone,targetZone,outcome,receptionQuality,scoreImpact:{points:scoring?1:0,sideAwarded},rawTranscript:text,status:'REVIEW_REQUIRED'};
 // Rule extraction is experimental and requires human confirmation even when structurally valid.
 return e;
 });
}
