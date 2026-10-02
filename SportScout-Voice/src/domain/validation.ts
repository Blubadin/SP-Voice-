import {ScoutEvent, SportType} from './types';
export const actions = {badminton:['Serve','Return','Clear','Drop','Smash','Drive','Lift','Net Shot','Net Kill','Block'],volleyball:['Serve','Reception','Set','Attack','Block','Dig','Free Ball','Cover','Overpass','Error']};
export const zones = {badminton:['Front Left','Front Center','Front Right','Mid Left','Mid Center','Mid Right','Rear Left','Rear Center','Rear Right'],volleyball:['Zone 1','Zone 2','Zone 3','Zone 4','Zone 5','Zone 6']};
export function validationErrors(e: Partial<ScoutEvent>): string[] {
 const errors:string[]=[];
 if(e.recordType==='SCORE_CORRECTION') {if(!e.scoreCorrection || ![e.scoreCorrection.scoreA,e.scoreCorrection.scoreB,e.scoreCorrection.setsA,e.scoreCorrection.setsB,e.scoreCorrection.currentSet].every(Number.isInteger)||Object.values(e.scoreCorrection).some(v=>typeof v==='number'&&v<0)||e.scoreCorrection.currentSet<1) errors.push('Invalid score correction');return errors;}
 if(e.actorSide!=='A'&&e.actorSide!=='B') errors.push('Actor unknown');
 if(!e.sport||!actions[e.sport]?.includes(e.action!)) errors.push('Invalid action');
 for(const field of ['originZone','targetZone'] as const) if(e[field] && !zones[e.sport!]?.includes(e[field]!)) errors.push(`Invalid ${field}`);
 if(e.receptionQuality!==undefined&&(!Number.isInteger(e.receptionQuality)||e.receptionQuality<0||e.receptionQuality>3||e.sport!=='volleyball'||e.action!=='Reception')) errors.push('Invalid reception quality');
 if(!['IN_PLAY','WINNER','ERROR','ACE','KILL','BLOCKED'].includes(e.outcome!)) errors.push('Invalid outcome');
 if(e.sport==='badminton'&&['ACE','KILL','BLOCKED'].includes(e.outcome!)) errors.push('Invalid badminton outcome');
 const winner=['WINNER','ACE','KILL'].includes(e.outcome!); const loss=['ERROR','BLOCKED'].includes(e.outcome!);
 const expected=winner?e.actorSide:loss?(e.actorSide==='A'?'B':e.actorSide==='B'?'A':undefined):undefined;
 if(e.scoreImpact?.points!==(winner||loss?1:0)||e.scoreImpact?.sideAwarded!==expected) errors.push('Score conflicts with outcome');
 return errors;
}
export const officialEvents=(events:ScoutEvent[])=>events.filter(e=>e.status==='CONFIRMED'&&e.recordType!=='SCORE_CORRECTION'&&!validationErrors(e).length);
