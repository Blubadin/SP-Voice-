import {ScoutEvent} from './types';
// Match time remains on timestamp. Score replay uses the explicit acceptance
// time when a reviewed point is confirmed after an intervening score baseline.
export function scoreReplayOrder<T extends ScoutEvent>(events:T[]){return [...events].reverse().sort((a,b)=>{const left=Date.parse(a.confirmedAt||a.timestamp),right=Date.parse(b.confirmedAt||b.timestamp);return Number.isFinite(left)&&Number.isFinite(right)?left-right:0;});}
