import {Side,SportType} from './types';
import {zones} from './validation';
export const courts={badminton:{length:1340,width:610,line:4},volleyball:{length:1800,width:900,line:5}};
// Voice positions are zone centroids, never measured locations. Left/right is actor-facing-net.
export function zonePosition(sport:SportType,zone:string|undefined,side:Side|undefined){
 if(!side||!zone||!zones[sport].includes(zone))return null;
 const c=courts[sport];let x:number,y:number;
 if(sport==='badminton'){const [depth,lateral]=zone.split(' ');x=depth==='Rear'?c.length/12:depth==='Mid'?c.length/4:c.length*5/12;y=lateral==='Left'?c.width/6:lateral==='Center'?c.width/2:c.width*5/6;}
 else{const n=Number(zone.slice(-1));x=[1,5,6].includes(n)?300:750;y=[4,5].includes(n)?150:[3,6].includes(n)?450:750;}
 return side==='A'?{x,y}:{x:c.length-x,y:c.width-y};
}
