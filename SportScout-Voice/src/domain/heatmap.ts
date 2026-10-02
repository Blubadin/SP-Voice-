import {ScoutEvent,SportType,Side} from './types';
import {officialEvents} from './validation';
import {zonePosition} from './geometry';
export type HeatMode='origin'|'target'|'serve_target'|'attack_origin'|'attack_target'|'reception_location';
export function aggregateMode(events:ScoutEvent[],sport:SportType,mode:HeatMode){
 const eligible=officialEvents(events).filter(e=>e.sport===sport && (sport==='badminton'||e.action===(mode==='serve_target'?'Serve':mode==='reception_location'?'Reception':'Attack')));
 const target=mode==='target'||mode==='serve_target'||mode==='attack_target';
 const cells=new Map<string,{zone:string;side:Side;x:number;y:number;eventIds:string[]}>();let mapped=0;
 for(const e of eligible){const side=target?(e.actorSide==='A'?'B':'A'):e.actorSide;const zone=target?e.targetZone:e.originZone;const p=zonePosition(sport,zone,side);if(!p||!side||!zone)continue;mapped++;const key=`${side}:${zone}`;const cell=cells.get(key)||{zone,side,...p,eventIds:[]};cell.eventIds.push(e.id);cells.set(key,cell);}
 const trajectories=eligible.flatMap(e=>{const from=zonePosition(sport,e.originZone,e.actorSide);const to=zonePosition(sport,e.targetZone,e.actorSide==='A'?'B':'A');return from&&to?[{eventId:e.id,from,to,action:e.action}]:[];});
 return {eligible,mapped,cells:[...cells.values()],trajectories};
}
