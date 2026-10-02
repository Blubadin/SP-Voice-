import {useLocale} from '../../i18n/LocaleContext';
import React,{useState,useId} from 'react';
import {SportType,ParsedEvent} from '../../types/scout';
import {courts,zonePosition} from '../../domain/geometry';
import {zones,actions} from '../../domain/validation';
import {aggregateMode,HeatMode} from '../../domain/heatmap';
interface Props{sport:SportType;events:ParsedEvent[];activeEvent?:ParsedEvent|null;onSelectZone?:(zone:string)=>void}
export const CourtHeatmapPanel:React.FC<Props>=({sport,events,onSelectZone})=>{
  const {t}=useLocale();

 const [view,setView]=useState('heatmap');const [badMode,setBadMode]=useState<HeatMode>('origin');const [volleyMode,setVolleyMode]=useState<HeatMode>('attack_origin');
 const [perspective,setPerspective]=useState('scout');const [overlay,setOverlay]=useState(false);const [side,setSide]=useState('all');const [skill,setSkill]=useState('all');const [outcome,setOutcome]=useState('all');const [segment,setSegment]=useState('all');
 const c=courts[sport],bad=sport==='badminton',mode=bad?badMode:volleyMode;
 const filtered=events.filter(e=>(side==='all'||e.actorSide===side)&&(skill==='all'||e.action===skill)&&(outcome==='all'||e.outcome===outcome)&&(segment==='all'||String(e.segmentIndex||1)===segment));
 const data=aggregateMode(filtered,sport,mode);const max=Math.max(1,...data.cells.map(c=>c.eventIds.length));const id=useId().replace(/:/g,'');
 const choices=bad?[['origin','Origin Position'],['target','Shot Target']]:[['serve_target','Serve Target'],['attack_origin','Attack Origin'],['attack_target','Attack Target'],['reception_location','Reception Location']];
 const selectClass='bg-[#18212e] border border-white/15 rounded-lg px-3 py-2 text-sm text-white';
 return <section className="bg-[#131923] border border-white/10 rounded-2xl p-4 space-y-4">
 <div className="flex flex-wrap gap-2">{[['court','Court View'],['heatmap','Heatmap'],['shots','Shot Trajectory']].map(([key,label])=><button key={key} onClick={()=>setView(key)} className={`${selectClass} ${view===key?'!border-sky-400':''}`}>{t(label)}</button>)}</div>
 <div className="flex flex-wrap gap-2">
 <select aria-label={t("Analysis mode")} className={selectClass} value={mode} onChange={e=>(bad?setBadMode:setVolleyMode)(e.target.value as HeatMode)}>{choices.map(([v,l])=><option key={v} value={v}>{t(l)}</option>)}</select>
 <select aria-label={t("Court perspective")} className={selectClass} value={perspective} onChange={e=>setPerspective(e.target.value)}><option value="scout">{t("Scout view")}</option><option value="A">{t("Side A perspective")}</option><option value="B">{t("Side B perspective")}</option></select>
 <select aria-label={t("Side filter")} className={selectClass} value={side} onChange={e=>setSide(e.target.value)}><option value="all">{t("Both sides")}</option><option>A</option><option>B</option></select>
 <select aria-label={t("Action filter")} className={selectClass} value={skill} onChange={e=>setSkill(e.target.value)}><option value="all">{t("All actions")}</option>{actions[sport].map(a=><option key={a} value={a}>{typeof a === "number" ? a : t(a)}</option>)}</select>
 <select aria-label={t("Outcome filter")} className={selectClass} value={outcome} onChange={e=>setOutcome(e.target.value)}><option value="all">{t("All outcomes")}</option>{['IN_PLAY','WINNER','ERROR','ACE','KILL','BLOCKED'].map(a=><option key={a} value={a}>{typeof a === "number" ? a : t(a)}</option>)}</select>
 <select aria-label={t("Game or set filter")} className={selectClass} value={segment} onChange={e=>setSegment(e.target.value)}><option value="all">{t("All games / sets")}</option>{Array.from(new Set(events.map(e=>e.segmentIndex||1))).sort().map(a=><option key={a} value={a}>{typeof a === "number" ? a : t(a)}</option>)}</select>
 {view!=='court'&&<label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={overlay} onChange={e=>setOverlay(e.target.checked)}/>{t("Scouting Zones")}</label>}
 </div>
 <p className="text-sm text-gray-300">{t("Mapped Events:")}{data.mapped} / {data.eligible.length} {t("· CONFIRMED only")}</p>
 <div style={{aspectRatio:`${c.length}/${c.width}`}} className="w-full overflow-hidden rounded-lg">
 <svg role="img" aria-label={`${sport} regulation court, ${perspective} perspective`} viewBox={`0 0 ${c.length} ${c.width}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
 <defs>{data.cells.map((cell,i)=><radialGradient key={i} id={`${id}-${i}`}><stop stopColor="#fb923c" stopOpacity={0.25+0.7*cell.eventIds.length/max}/><stop offset="1" stopColor="#f97316" stopOpacity="0"/></radialGradient>)}</defs>
 <rect width={c.length} height={c.width} fill="#16384b"/>
 <g transform={perspective==='B'?`translate(${c.length} ${c.width}) rotate(180)`:undefined}>
 {view==='heatmap'&&data.cells.map((cell,i)=><ellipse key={`${cell.side}:${cell.zone}`} data-event-ids={cell.eventIds.join(',')} cx={cell.x} cy={cell.y} rx={bad?c.length/6:225} ry={c.width/6} fill={`url(#${id}-${i})`}><title>{cell.side} {cell.zone}: {cell.eventIds.length} {t("confirmed zone observations; IDs")}{cell.eventIds.join(', ')}</title></ellipse>)}
 <g stroke="white" strokeWidth={c.line} fill="none">
 <rect x={c.line/2} y={c.line/2} width={c.length-c.line} height={c.width-c.line}/>
 {bad?<><path d="M 0 46 H 1340 M 0 564 H 1340 M 76 0 V 610 M 1264 0 V 610 M 472 0 V 610 M 868 0 V 610 M 0 305 H 472 M 868 305 H 1340"/></>:<path d="M 602.5 0 V 900 M 1197.5 0 V 900"/>}
 <path d={`M ${c.length/2} 0 V ${c.width}`} stroke={bad?'#8ed8fa':'white'} strokeDasharray={bad?'12 8':undefined}/>
 </g>
 {view!=='court'&&overlay&&<g stroke="#b8d8ec" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="10 10" fill="none">{(bad?[c.length/6,c.length/3,c.length*2/3,c.length*5/6]:[]).map(x=><path key={x} d={`M ${x} 0 V ${c.width}`}/>)}{[c.width/3,c.width*2/3].map(y=><path key={y} d={`M 0 ${y} H ${c.length}`}/>)}</g>}
 {view!=='court'&&overlay&&(['A','B'] as const).flatMap(s=>zones[sport].map(z=>{const p=zonePosition(sport,z,s)!;return <text key={`${s}:${t(z)}`} x={p.x} y={p.y} fill="#c0dbea" fontSize={bad?20:26} textAnchor="middle" onClick={()=>onSelectZone?.(z)} transform={perspective==='B'?`rotate(180 ${p.x} ${p.y})`:undefined}>{s} {t(z)}</text>;}))}
 {view==='shots'&&data.trajectories.map(trajectory=><g key={trajectory.eventId} data-event-id={trajectory.eventId}><title>{t("Event")} {trajectory.eventId}: {t(trajectory.action)} {t("· zone-to-zone evidence")}</title><line x1={trajectory.from.x} y1={trajectory.from.y} x2={trajectory.to.x} y2={trajectory.to.y} stroke="#fbbf24" strokeWidth="4" strokeOpacity="0.6"/><circle cx={trajectory.to.x} cy={trajectory.to.y} r="8" fill="#fbbf24"/></g>)}
 </g></svg></div>
 <p className="text-sm text-gray-400">{bad?t("13.40 × 6.10 m · singles 5.18 m · 40 mm markings"):t("18 × 9 m · attack lines 3 m from centre · 50 mm markings")}. {view==='court'?t("Regulation lines only."):t("Voice observations describe zones, not exact measured positions. Dashed guides are analytical overlays.")}</p>
 {!data.eligible.length&&view!=='court'&&<p className="text-sm text-sky-200">{t("No confirmed events match these filters. Record and review an observation to begin.")}</p>}
 {view==='heatmap'&&data.cells.length>0&&<details className="text-sm text-gray-300"><summary>{t("Zone evidence and source events")}</summary>{data.cells.map(cell=><p key={`${cell.side}:${cell.zone}`}>{cell.side} {cell.zone} · {cell.eventIds.length}: {cell.eventIds.join(', ')}</p>)}</details>}
 </section>;
};
