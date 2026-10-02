import {parseSequence} from './localParser';
import {canonicalSide,sportVocabulary} from './scoutVocabulary';
import {validationErrors} from './validation';
import type {ScoutEvent,SportType} from './types';
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const actors='(?:ทีม\\s*|ฝั่ง\\s*)?(?:A|B|เอ|บี)';
const badZones='(?:หน้าซ้าย|ซ้ายหน้า|หน้าขวา|ขวาหน้า|หน้ากลาง|หลังซ้าย|ซ้ายหลัง|หลังขวา|ขวาหลัง|หลังกลาง|กลางซ้าย|กลางขวา|กลางสนาม|กลางคอร์ด)';
const point='(?:\\+\\s*1|บวก\\s*(?:1|หนึ่ง)|ได้แต้ม|ได้หนึ่งแต้ม|ได้หนึ่ง)';
// A deliberately closed grammar. Anything extra, ambiguous, corrective or
// multi-event goes to AI; we never call a generic parser "confirmed".
export function fastVocabularyEvent(text:string,sport:SportType):Partial<ScoutEvent>|null{
 const aliases=Object.entries(sportVocabulary[sport]).flatMap(([action,words])=>[action,...words]).sort((a,b)=>b.length-a.length).map(escape).join('|');
 const zone=sport==='badminton'?badZones:'(?:โซน|zone)\\s*[1-6]';
 const spatial=`(?:\\s*(?:จาก|ตำแหน่ง|อยู่|ยืน)\\s*${zone})?(?:\\s*(?:ไป|ลง)\\s*${zone})?`;
 const pattern=new RegExp(`^\\s*${actors}\\s*(?:${aliases})${spatial}\\s*${point}(?:\\s*${point})*\\s*$`,'i');
 if(!pattern.test(text))return null;
 const events=parseSequence(text,sport);
 if(events.length!==1)return null;
 const event=events[0];
 // The parser can know the actor only from this explicit grammar.
 if(event.action==='Error'||!canonicalSide(event.actorSide)||validationErrors(event).length)return null;
 return {...event,status:'CONFIRMED'};
}
