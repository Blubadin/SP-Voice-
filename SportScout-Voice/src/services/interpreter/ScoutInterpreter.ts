import {extractLiveSequence} from '../../domain/liveGrammar';
import {validationErrors} from '../../domain/validation';
import {parseSequence} from '../../domain/localParser';
import {
  ParsedEvent,
  ScoreState,
  SportType,
  Side,
  EventStatus,
} from '../../types/scout';
import { getSportDefinition } from '../../sports/registry';
import { getBadmintonZoneCoords } from '../../sports/badminton';
import { getVolleyballZoneCoords } from '../../sports/volleyball';

export interface InterpretationContext {
  inheritedTeam?:{side:Side;action:string};
  sport: SportType;
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  currentSet: number;
  scoreState: ScoreState;
  recentEvents: Array<{
    action: string;
    player: string;
    outcome: string;
  }>;
}

export interface InterpretationResult {
  events: ParsedEvent[];
  corrections: string[];
  unknownFields: string[];
  controlIntent?: 'UNDO' | 'CANCEL' | null;
  needsReview: boolean;
  confidence: number;
  summaryTh?: string;
  summaryEn?: string;
  latencies: {
    speechMs: number;
    aiMs: number;
    totalMs: number;
  };
  model: string;
  rawTranscript: string;
  rawRequest?: any;
  rawResponse?: any;
  validationErrors?: string[];
  provider?: string;
}

export interface ScoutInterpreterProvider {
  interpret(
    utterance: string,
    context: InterpretationContext,
    speechDurationMs?: number
  ): Promise<InterpretationResult>;
}

export class GeminiServerInterpreter implements ScoutInterpreterProvider {
 async interpret(utterance:string,context:InterpretationContext,speechDurationMs=0):Promise<InterpretationResult>{
 const start=performance.now();
 const grammar=extractLiveSequence(utterance,context.sport,context.playerAName,context.playerBName,context.inheritedTeam);
 if(!grammar.needsReview){const timestamp=new Date().toISOString();const rallyId=crypto.randomUUID();const events:ParsedEvent[]=grammar.events.map(e=>({...e,id:crypto.randomUUID(),sessionId:'current',rallyId,sport:context.sport,timestamp,confirmedAt:timestamp,source:'voice',action:e.action!,outcome:e.outcome!,scoreImpact:e.scoreImpact!,status:'CONFIRMED',needsReview:false,player:e.actorSide,segmentIndex:context.currentSet}));const aiMs=performance.now()-start;return {events,corrections:grammar.corrections,unknownFields:[],needsReview:false,confidence:0,model:'SCOUT_VOCABULARY_RULES',provider:'RULES (no AI request)',latencies:{speechMs:speechDurationMs,aiMs,totalMs:speechDurationMs+aiMs},rawTranscript:utterance};}
 try{
 const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({utterance,sport:context.sport,context})});
 if(!response.ok)throw Error(`AI unavailable (HTTP ${response.status})`);
 const body=await response.json();if(!body.success||!Array.isArray(body.data?.events))throw Error('AI unavailable');
 const rallyId=crypto.randomUUID();const errors:string[]=[];
 const events:ParsedEvent[]=body.data.events.map((raw:any)=>{
 const ev:ParsedEvent={actorSide:raw.actorSide??undefined,actorPlayer:raw.actorPlayer??undefined,action:raw.action??'',originZone:raw.originZone??undefined,targetZone:raw.targetZone??undefined,outcome:raw.outcome??'',receptionQuality:raw.receptionQuality??undefined,subtype:raw.subtype??undefined,errorType:raw.errorType??undefined,id:crypto.randomUUID(),sessionId:'current',rallyId,sport:context.sport,timestamp:new Date().toISOString(),source:'voice',rawTranscript:utterance,status:'INTERPRETED',scoreImpact:{points:raw.scoreImpact?.points,sideAwarded:raw.scoreImpact?.sideAwarded??undefined}};
 const invalid=validationErrors(ev);errors.push(...invalid);
 ev.status=invalid.length||body.data.needsReview?'REVIEW_REQUIRED':'CONFIRMED';ev.needsReview=ev.status==='REVIEW_REQUIRED';ev.player=ev.actorSide;ev.pointDelta=ev.scoreImpact.points;return ev;
 });
 // Multiple scored endpoints in one utterance must be reviewed rather than award multiple points.
 if(events.filter(e=>e.scoreImpact.points===1).length>1){errors.push('Multiple scoring events in one rally');events.forEach(e=>{e.status='REVIEW_REQUIRED';e.needsReview=true;});}
 const aiMs=performance.now()-start;
 return {events,corrections:body.data.corrections||[],unknownFields:body.data.unknownFields||[],controlIntent:body.data.controlIntent,needsReview:events.some(e=>e.status!=='CONFIRMED'),confidence:typeof body.data.confidence==='number'?body.data.confidence:0,latencies:{speechMs:speechDurationMs,aiMs,totalMs:speechDurationMs+aiMs},model:body.model||'NOT VERIFIED',rawTranscript:utterance,validationErrors:errors,provider:'SERVER AI',rawResponse:body.data};
 }catch(err){return new FallbackLocalInterpreter().interpret(utterance,context,speechDurationMs,String(err));}
 }
}
export class FallbackLocalInterpreter implements ScoutInterpreterProvider {
 async interpret(utterance:string,context:InterpretationContext,speechDurationMs=0,serverErrorMsg?:string):Promise<InterpretationResult>{
 const start=performance.now();const rallyId=crypto.randomUUID();
 const events:ParsedEvent[]=parseSequence(utterance,context.sport,context.playerAName,context.playerBName).map(partial=>({...partial,id:crypto.randomUUID(),sessionId:'current',rallyId,sport:context.sport,timestamp:new Date().toISOString(),source:'voice',action:partial.action||'',outcome:partial.outcome||'IN_PLAY',scoreImpact:partial.scoreImpact||{points:0},status:'REVIEW_REQUIRED',needsReview:true,player:partial.actorSide,segmentIndex:context.currentSet}));
 const aiMs=performance.now()-start;
 return {events,corrections:[],unknownFields:events.flatMap(e=>validationErrors(e)),controlIntent:/^(undo|ยกเลิก|เอาแต้มเมื่อกี้ออก)$/i.test(utterance.trim())?'UNDO':/^(cancel|ยกเลิกคำสั่ง)$/i.test(utterance.trim())?'CANCEL':null,needsReview:true,confidence:0,latencies:{speechMs:speechDurationMs,aiMs,totalMs:speechDurationMs+aiMs},model:'EXPERIMENTAL local rules — confidence not measured',rawTranscript:utterance,provider:'LOCAL_FALLBACK',validationErrors:[serverErrorMsg||'AI NOT AVAILABLE; verify extracted events',...events.flatMap(validationErrors)]};
 }
}
