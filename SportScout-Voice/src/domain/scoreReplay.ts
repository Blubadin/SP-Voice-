import type {ScoutEvent,ScoreState,SportType} from './types';
import {validationErrors} from './validation';
import {scoreReplayOrder} from './scoreOrder';

export function matchRules(sport:SportType,format='') {
  if(sport==='badminton') return {setsToWin:/1 Set/i.test(format)?1:2,points:/11 pts/i.test(format)?11:/1 Set.*30 pts/i.test(format)?30:21,decidingPoints:0,cap:/11 pts/i.test(format)?Infinity:30};
  return {setsToWin:/Best of 3/i.test(format)?2:3,points:25,decidingPoints:15,cap:Infinity};
}

// Sort once and replay once. Snapshots and the board share the same transitions.
export function replayScore<T extends ScoutEvent>(events:T[],sport:SportType,format='') {
  const rules=matchRules(sport,format);
  const state:ScoreState={scoreA:0,scoreB:0,setsA:0,setsB:0,currentSet:1,segments:[],isMatchFinished:false};
  const snapshots=new Map<string,T>();
  const scoredRallies=new Set<string>();
  for(const event of scoreReplayOrder(events)) {
    const segmentIndex=state.currentSet;
    if(event.status==='CONFIRMED'&&event.sport===sport&&!validationErrors(event).length) {
      if(event.recordType==='SCORE_CORRECTION'&&event.scoreCorrection) {
        const c=event.scoreCorrection;
        Object.assign(state,{scoreA:c.scoreA,scoreB:c.scoreB,setsA:c.setsA,setsB:c.setsB,currentSet:c.currentSet});
        state.segments=state.segments.filter(s=>s.segmentIndex<c.currentSet);
        state.isMatchFinished=c.setsA>=rules.setsToWin||c.setsB>=rules.setsToWin;
        state.matchWinner=state.isMatchFinished?(c.setsA>=rules.setsToWin?'A':'B'):undefined;
      } else if(!state.isMatchFinished&&event.scoreImpact.points===1&&event.scoreImpact.sideAwarded&&(!event.rallyId||!scoredRallies.has(event.rallyId))) {
        if(event.rallyId)scoredRallies.add(event.rallyId);
        state[event.scoreImpact.sideAwarded==='A'?'scoreA':'scoreB']++;
        const target=sport==='volleyball'&&state.currentSet===rules.setsToWin*2-1?rules.decidingPoints:rules.points;
        const wonA=state.scoreA>=rules.cap||state.scoreA>=target&&state.scoreA-state.scoreB>=2;
        const wonB=state.scoreB>=rules.cap||state.scoreB>=target&&state.scoreB-state.scoreA>=2;
        if(wonA||wonB) {
          const winner=wonA?'A':'B';state[wonA?'setsA':'setsB']++;
          state.segments.push({segmentIndex:state.currentSet,scoreA:state.scoreA,scoreB:state.scoreB,isCompleted:true,winnerSide:winner});
          if(state[wonA?'setsA':'setsB']>=rules.setsToWin){state.isMatchFinished=true;state.matchWinner=winner;}
          else {state.currentSet++;state.scoreA=0;state.scoreB=0;}
        }
      }
    }
    snapshots.set(event.id,{...event,segmentIndex,scoreAfterA:state.scoreA,scoreAfterB:state.scoreB,setsAfterA:state.setsA,setsAfterB:state.setsB});
  }
  if(!state.isMatchFinished)state.segments.push({segmentIndex:state.currentSet,scoreA:state.scoreA,scoreB:state.scoreB,isCompleted:false});
  return {state,events:events.map(e=>snapshots.get(e.id)!),snapshots};
}
