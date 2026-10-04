import {apiFetch} from '../services/apiClient';
import type {SpeechEvidence} from '../services/speech/ContinuousSpeechProvider';
import {speechNeedsReview} from '../services/speech/speechReview';
import {getVocabulary,aliasConflict,speechKeyterms} from '../domain/scoutVocabulary';
import {replayScore} from '../domain/scoreReplay';
import {isOutcomeOnly,outcomeFields} from '../domain/speechFields';
import {ContinuousSpeechProvider} from '../services/speech/ContinuousSpeechProvider';
import {extractLiveSequence,extractLiveCorrection} from '../domain/liveGrammar';
import {scoreReplayOrder} from '../domain/scoreOrder';
import {FailedRecording,transcribeAudio} from '../services/speech/SpeechProvider';
import {validationErrors, officialEvents} from '../domain/validation';
import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import {
  MatchSession,
  ParsedEvent,
  SkillItem,
  SportType,
  VoiceState,
  VoicePresetSample,
  ScoreState,
  SportStats,
  HeatmapData,
} from '../types/scout';
import { AppSettings, storageService } from '../services/storageService';
import { prepareAudioFeedback,playAudioFeedback } from '../services/mockVoiceEngine';
import { getSportDefinition } from '../sports/registry';
import { GeminiLiveTranscriptionProvider, SpeechError } from '../services/speech/SpeechProvider';
import {
  GeminiServerInterpreter,
  InterpretationContext,
  InterpretationResult,
} from '../services/interpreter/ScoutInterpreter';

const INITIAL_DIAGNOSTICS: InterpretationResult = {
  events: [],
  corrections: [],
  unknownFields: [],
  controlIntent: null,
  needsReview: false,
  confidence: 0,
  latencies: { speechMs: 0, aiMs: 0, totalMs: 0 },
  model: 'NOT VERIFIED',
  rawTranscript: '',
};

interface ScoutContextType {
  activeTab: 'scout' | 'sessions' | 'stats' | 'skills' | 'testlab' | 'settings';
  setActiveTab: (tab: 'scout' | 'sessions' | 'stats' | 'skills' | 'testlab' | 'settings') => void;
  sessions: MatchSession[];
  currentSession: MatchSession;
  scoreState: ScoreState;
  stats: SportStats;
  heatmapData: HeatmapData;
  voiceState: VoiceState;
  currentTranscript: string;
  currentParsedEvent: ParsedEvent | null;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  skills: SkillItem[];
  toggleSkill: (id: string) => void;
  addSkillAlias: (id: string, alias: string) => void;
  addCustomSkill: (skill: Omit<SkillItem, 'id' | 'count'>) => void;
  startListening: () => void;
  stopListening: () => void;
  processSamplePhrase: (sample: VoicePresetSample | string) => void;
  processUtterance: (text: string, durationMs?: number) => Promise<void>;
  undoLastEvent: () => void;
  editLastEvent: () => void;
  deleteEvent: (id: string) => void;
  updateEvent: (updated: ParsedEvent) => {success:boolean;errors:string[]};
  adjustScore: (player: 'A' | 'B', delta: number) => void;
  switchSession: (sessionId: string) => void;
  createSession: (
    sport: SportType,
    playerA: string,
    playerB: string,
    mode: 'singles' | 'doubles' | 'team',
    format: string
  ) => void;
  exportSessionJson: () => void;
  exportSessionCsv: () => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showNewSessionModal: boolean;
  setShowNewSessionModal: (show: boolean) => void;
  editingEvent: ParsedEvent | null;
  setEditingEvent: (event: ParsedEvent | null) => void;
  resetAllData: () => void;
  // Phase 3 Real Microphone & AI Interpreter Diagnostics
  apiStatus: {hasDeepgramKey?:boolean;hasApiKey:boolean;model?:string;status:string};
  refreshApiStatus: () => Promise<void>;
  liveTags: string[];
  queuedSequences:number;
  audioLevel: number;
  isRealMicActive: boolean;
  micError: string | null;
  hasPendingAudio:boolean;
  retryTranscription:()=>Promise<void>;
  downloadPendingAudio:()=>void;
  diagnostics: InterpretationResult;
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
}

const ScoutContext = createContext<ScoutContextType | undefined>(undefined);

// Providers
const speechProvider = new GeminiLiveTranscriptionProvider();
const continuousProvider=new ContinuousSpeechProvider();
const interpreter = new GeminiServerInterpreter();

export const ScoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessionsState] = useState<MatchSession[]>(() => storageService.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => storageService.getActiveSessionId());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [skills, setSkills] = useState<SkillItem[]>(() => storageService.getSkills());
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !storageService.isOnboarded());
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'scout' | 'sessions' | 'stats' | 'skills' | 'testlab' | 'settings'
  >('scout');

  // Voice engine & state
  const [liveTags,setLiveTags]=useState<string[]>([]);
  const [queuedSequences,setQueuedSequences]=useState(0);
  const streamQueue=useRef<Promise<void>>(Promise.resolve());
  const streamSeen=useRef(new Set<string>());
  const previewCues=useRef(new Set<string>());
  const streamRally=useRef<string>(crypto.randomUUID());
  const streamTeam=useRef<{side:'A'|'B';action:string}|undefined>(undefined);
  const captureSequence=useRef(0);
  const latestSkills=useRef(skills);latestSkills.current=skills;
  const latestSessions=useRef(sessions);
  // Queued finals need the preceding commit even before React paints the next frame.
  const setSessions:React.Dispatch<React.SetStateAction<MatchSession[]>>=(update)=>{const next=typeof update==='function'?update(latestSessions.current):update;latestSessions.current=next;setSessionsState(next);};
  const streamProcess=useRef<(text:string,id:string,rallyId:string,session:MatchSession,inheritedTeam?:{side:'A'|'B';action:string},evidence?:SpeechEvidence)=>Promise<void>>(async()=>{});
  const transcriptionRetryRef=useRef(false);
  const [pendingAudio,setPendingAudio]=useState<{audio:Blob;durationMs:number;sessionId:string;language:'th'|'en'}|null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [currentParsedEvent, setCurrentParsedEvent] = useState<ParsedEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<ParsedEvent | null>(null);

  // Real Microphone and Diagnostics State
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isRealMicActive, setIsRealMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<InterpretationResult>(INITIAL_DIAGNOSTICS);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  const [apiStatus,setApiStatus]=useState({hasDeepgramKey:false,hasApiKey:false,status:'checking',model:undefined as string|undefined});
  const listeningIntentRef=useRef(false);
  const refreshApiStatus=async()=>{try{const response=await apiFetch('/api/health');if(!response.ok)throw Error('Service unavailable');const data=await response.json();setApiStatus({hasDeepgramKey:!!data.hasDeepgramKey,hasApiKey:!!data.hasApiKey,status:'available',model:data.model});}catch{setApiStatus({hasDeepgramKey:false,hasApiKey:false,status:'unavailable',model:undefined});}};
  useEffect(()=>{void refreshApiStatus();return ()=>{void continuousProvider.stop();void speechProvider.stop().catch(()=>{});};},[]);
  const activeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listeningStartRef = useRef<number>(0);

  // Active session
  const currentSession = useMemo(() => {
    const session=sessions.find((s) => s.id === activeSessionId) || sessions[0];
    const replay=replayScore(session.events,session.sport,session.format);const score=replay.state;
    return {...session,playerA:{...session.playerA,score:score.scoreA},playerB:{...session.playerB,score:score.scoreB},setsA:score.setsA,setsB:score.setsB,currentSet:score.currentSet,segments:score.segments,events:replay.events};
  }, [sessions, activeSessionId]);

  // Compute sport definition dynamically
  const sportDef = useMemo(() => {
    return getSportDefinition(currentSession.sport,currentSession.format);
  }, [currentSession.sport,currentSession.format]);

  // Compute official score from confirmed events
  const scoreState = useMemo(() => {
    return sportDef.calculateScore(currentSession.events);
  }, [sportDef, currentSession.events]);

  // Compute official statistics strictly from confirmed events
  const stats = useMemo(() => {
    return sportDef.calculateStats(currentSession.events);
  }, [sportDef, currentSession.events]);

  // Compute heatmap dynamically from confirmed events
  const heatmapData = useMemo(() => {
    return sportDef.aggregateHeatmap(currentSession.events, 'all');
  }, [sportDef, currentSession.events]);

  const [storageReady,setStorageReady]=useState(false);
  useEffect(()=>{let alive=true;void storageService.hydrateSessions().then(loaded=>{if(!alive)return;if(loaded.length)setSessions(loaded);setStorageReady(true);});return()=>{alive=false;};},[]);
  useEffect(()=>{if(storageReady)void storageService.saveSessions(sessions).catch(()=>setMicError('บันทึกการแข่งขันไม่สำเร็จ กรุณาส่งออกข้อมูลก่อนปิดหน้านี้ / Saving failed; export before closing.'));},[sessions,storageReady]);

  useEffect(() => {
    storageService.setActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storageService.saveSkills(skills);
  }, [skills]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    if(listeningIntentRef.current&&(partial.captureMode!==undefined||partial.transcriptionMode!==undefined||partial.language!==undefined||partial.inputDeviceId!==undefined)){void stopListening();}

    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((sk) => (sk.id === id ? { ...sk, enabled: !sk.enabled } : sk))
    );
  };

  const addSkillAlias = (id: string, alias: string) => {
    if (!alias.trim()) return;
    const skill=skills.find(sk=>sk.id===id);
    if(skill){const conflict=aliasConflict(skill.sport,skill.name,alias,skills);if(conflict){setMicError(`คำนี้ใช้กับ ${conflict} อยู่แล้ว / Alias belongs to ${conflict}`);return;}}
    setSkills((prev) =>
      prev.map((sk) =>
        sk.id === id && !sk.aliases.includes(alias.trim())
          ? { ...sk, aliases: [...sk.aliases, alias.trim()] }
          : sk
      )
    );
  };

  const addCustomSkill = (skill: Omit<SkillItem, 'id' | 'count'>) => {
    const newId = `custom-${Date.now()}`;
    setSkills((prev) => [
      ...prev,
      {
        ...skill,
        id: newId,
        count: 0,
      },
    ]);
  };

  // Undo Last Event with full Score & Stats recalculation
  const undoLastEvent = () => {
    if (!currentSession.events.length) return;
    if (settings.feedbackSound) playAudioFeedback('undo');
    if (settings.haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    const remaining=currentSession.events.slice(1);
    setSessions(prev=>prev.map(s=>s.id===currentSession.id?{...s,events:s.events.slice(1)}:s));
    setCurrentParsedEvent(remaining[0] || null);
    if (remaining[0]) {
      setCurrentTranscript(remaining[0].rawTranscript || '');
    }
  };

  /**
   * Core AI Interpretation Pipeline.
   * Feeds the utterance to Gemini (or fallback), validates against legal sport schema,
   * updates sessions, rallies, scores, heatmaps, and audio feedback.
   */
  const processUtterance = async (text: string, durationMs = 0,forceReview=false,streamMeta?:{id:string;rallyId:string;session:MatchSession;inheritedTeam?:{side:'A'|'B';action:string};evidence?:SpeechEvidence}) => {
    const targetSession=latestSessions.current.find(s=>s.id===(streamMeta?.session.id||currentSession.id))||streamMeta?.session||currentSession;
    const targetDef=getSportDefinition(targetSession.sport,targetSession.format);
    if(streamMeta&&/(?:แรลลี่ใหม่|แต้มต่อไป|next rally)/i.test(text)){
      const parts=text.split(/(?:แรลลี่ใหม่|แต้มต่อไป|next rally)/i).filter(p=>p.trim());
      for(let i=0;i<parts.length;i++){if(i){streamRally.current=crypto.randomUUID();streamTeam.current=undefined;}await processUtterance(parts[i],durationMs,forceReview,{...streamMeta,id:`${streamMeta.id}:rally:${i}`});}return;
    }
    if(streamMeta&&!forceReview&&/^(?:\s|,)*(?:เอ้ย|เอ๊ย|ไม่ใช่|ขอแก้|แก้เป็น|เปลี่ยนเป็น|หมายถึง)/.test(text)){
      const previous=targetSession.events.find(e=>e.source==='voice'&&e.status==='CONFIRMED');
      const corrected=previous&&Date.now()-Date.parse(previous.timestamp)<8000?extractLiveCorrection(text,previous):null;
      if(corrected){setSessions(prev=>prev.map(s=>s.id===targetSession.id?{...s,events:s.events.map(e=>e.id===corrected.id?{...e,...corrected}:e)}:s));setCurrentParsedEvent(corrected);if(corrected.scoreImpact.points===0){streamRally.current=corrected.rallyId||crypto.randomUUID();streamTeam.current=corrected.actorSide?{side:corrected.actorSide,action:corrected.action}:undefined;}if(settings.feedbackSound)playAudioFeedback('ding');return;}
    }

    if (!text || !text.trim()) return;
    if(streamMeta&&!forceReview&&isOutcomeOnly(text)) {
      const pending=targetSession.events.find(e=>e.source==='voice'&&e.rallyId===streamRally.current&&e.status==='CONFIRMED');
      if(pending&&pending.outcome==='IN_PLAY'&&Date.now()-Date.parse(pending.timestamp)<8000) {
        const result=outcomeFields(text,pending.action,targetSession.sport);
        const side=pending.actorSide;
        const points=result.outcome==='IN_PLAY'?0:1;
        const sideAwarded=points&&side?(['ERROR','BLOCKED'].includes(result.outcome)?side==='A'?'B':'A':side):undefined;
        const updated={...pending,outcome:result.outcome,scoreImpact:{points,sideAwarded},rawTranscript:`${pending.rawTranscript} → ${text}`};
        if(!result.conflict&&!validationErrors(updated).length){setSessions(prev=>prev.map(s=>s.id===targetSession.id?{...s,events:s.events.map(e=>e.id===pending.id?updated:e)}:s));setCurrentParsedEvent(updated);if(points){streamRally.current=crypto.randomUUID();streamTeam.current=undefined;}return;}
      }
    }
    if (activeTimerRef.current) clearTimeout(activeTimerRef.current);

    setVoiceState('understanding');
    setCurrentTranscript(text);

    const context: InterpretationContext = {
      inheritedTeam:streamMeta?streamTeam.current:undefined,
      skills:latestSkills.current,
      pendingContact:targetSession.events.find(e=>e.rallyId===streamRally.current&&e.status==='CONFIRMED'),
      sport: targetSession.sport,
      playerAName: targetSession.playerA.name,
      playerBName: targetSession.playerB.name,
      scoreA: targetSession.playerA.score,
      scoreB: targetSession.playerB.score,
      currentSet: targetDef.calculateScore(targetSession.events).currentSet,
      scoreState:targetDef.calculateScore(targetSession.events),
      recentEvents: targetSession.events.slice(0, 3).map((e) => ({
        action: e.action,
        player: e.player || e.actorSide || 'Unknown',
        outcome: e.outcome,
      })),
    };

    try {
      const result = await interpreter.interpret(text, context, durationMs);
      if(streamMeta){const sequence=++captureSequence.current;result.events=result.events.map((e,i)=>({...e,id:`${streamMeta.id}:${i}`,rallyId:streamRally.current,captureSequence:sequence,speechEvidence:streamMeta.evidence}));}

      if(forceReview){result.needsReview=true;result.events=result.events.map(e=>({...e,status:'REVIEW_REQUIRED'}));}
      setDiagnostics(result);

      // 1. Control Intent: Undo Last
      if (result.controlIntent === 'UNDO'&&!forceReview) {
        setSessions(prev=>prev.map(s=>s.id===targetSession.id?{...s,events:s.events.slice(1)}:s));
        streamRally.current=crypto.randomUUID();streamTeam.current=undefined;
        setVoiceState('ready');
        return;
      }

      if (result.controlIntent === 'CANCEL'&&!forceReview) {setVoiceState('ready');return;}
      // 2. Parse & Commit Valid Events
      if (result.events && result.events.length > 0) {
        const newEvents = result.events.map((e) => ({
          ...e,
          sessionId: targetSession.id,
        }));

        setCurrentParsedEvent(newEvents.at(-1)!);
        if(streamMeta){const last=newEvents.at(-1);streamTeam.current=!result.needsReview&&last?.actorSide?{side:last.actorSide,action:last.action}:undefined;
          if(newEvents.some(e=>e.scoreImpact.points===1&&!validationErrors(e).length)){streamRally.current=crypto.randomUUID();streamTeam.current=undefined;}
        }

        if (result.needsReview) {
          // Flagged for Review
          setVoiceState('review_required');
          if (settings.feedbackSound) playAudioFeedback('review');

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== targetSession.id) return s;
              return {
                ...s,
                events: [...newEvents].reverse().filter(e=>!s.events.some(old=>old.id===e.id)).concat(s.events),
              };
            })
          );

          activeTimerRef.current = setTimeout(() => {
            setVoiceState('ready');
          }, 2400);
        } else {
          // Confirmed!
          setVoiceState('confirmed');
          if (settings.feedbackSound) playAudioFeedback('ding');
          if (settings.haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 30, 40]);
          }

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== targetSession.id) return s;
              const additions=[...newEvents].reverse().filter(e=>!s.events.some(old=>old.id===e.id)).map(e=>s.events.some(old=>old.rallyId===e.rallyId&&old.status==='CONFIRMED'&&old.scoreImpact.points===1)&&e.scoreImpact.points===1?{...e,status:'REVIEW_REQUIRED' as const,needsReview:true}:e);
              const updatedEvents = additions.concat(s.events);
              const newScore = targetDef.calculateScore(updatedEvents);
              return {
                ...s,
                playerA: { ...s.playerA, score: newScore.scoreA },
                playerB: { ...s.playerB, score: newScore.scoreB },
                setsA: newScore.setsA,
                setsB: newScore.setsB,
                currentSet: newScore.currentSet,
                segments: newScore.segments,
                events: updatedEvents,
              };
            })
          );

          // Return automatically to ready state (no OK button needed)
          activeTimerRef.current = setTimeout(() => {
            setVoiceState('ready');
          }, 1800);
        }
      } else {
        // No event interpreted from speech (e.g. irrelevant noise)
        setVoiceState('review_required');
        if (settings.feedbackSound) playAudioFeedback('review');
        activeTimerRef.current = setTimeout(() => {
          setVoiceState('ready');
        }, 1800);
      }
    } catch (err: any) {
      console.error('[ScoutContext] Pipeline failure:', err);
      setVoiceState('error');
      if (settings.feedbackSound) playAudioFeedback('error');
      setMicError(err.message || 'Interpretation failed');
      activeTimerRef.current = setTimeout(() => {
        setVoiceState('ready');
      }, 2500);
    }
  };

  /**
   * Start recording from physical microphone with live speech recognition & waveform levels
   */
  streamProcess.current=(text,id,rallyId,session,inheritedTeam,evidence)=>processUtterance(text,0,speechNeedsReview(evidence),{id,rallyId,session:latestSessions.current.find(s=>s.id===session.id)||session,inheritedTeam,evidence});
  const startListening = async () => {
    if(settings.feedbackSound)prepareAudioFeedback();
    if(settings.captureMode==='continuous'){
      if(listeningIntentRef.current)return;
      if(queuedSequences>0){setMicError('รอคิวเดิมเสร็จก่อนเริ่มรอบใหม่ / Wait for pending sequences before restarting');return;}
      const provider=settings.transcriptionMode==='deepgram'||settings.transcriptionMode==='auto'&&apiStatus.hasDeepgramKey?'deepgram':'browser';
      if(settings.transcriptionMode==='server'){setMicError('Gemini แบบไฟล์ใช้กับโหมดทีละคำพูด เลือก Deepgram หรือเบราว์เซอร์สำหรับฟังต่อเนื่อง');return;}
      const captureSession=currentSession;listeningIntentRef.current=true;setMicError(null);setCurrentTranscript('');setLiveTags([]);streamRally.current=crypto.randomUUID();streamSeen.current.clear();previewCues.current.clear();streamTeam.current=undefined;
      const started=await continuousProvider.start({onLevel:setAudioLevel,onStatus:status=>{setIsRealMicActive(status!=='stopped');setVoiceState(status==='connecting'||status==='reconnecting'?'preparing':status==='stopped'?'ready':'listening');if(status==='stopped')listeningIntentRef.current=false;},onError:setMicError,onTranscript:(id,text,final,evidence)=>{
        setCurrentTranscript(text);const extracted=extractLiveSequence(text,captureSession.sport,captureSession.playerA.name,captureSession.playerB.name,streamTeam.current,getVocabulary(captureSession.sport,latestSkills.current));
        setLiveTags(extracted.events.filter(e=>e.action).flatMap(e=>[e.actorSide||'?',e.actorPlayer?.jerseyNumber?'#'+e.actorPlayer.jerseyNumber:'',e.action!,e.originZone?'จาก '+e.originZone:'',e.targetZone?'ไป '+e.targetZone:'',e.receptionQuality!==undefined?'รับ '+e.receptionQuality:''].filter(Boolean)));
        if(!final&&settings.feedbackSound)extracted.events.forEach((e,i)=>{if(!e.action)return;const key=`${id}:${i}:${e.action}`;if(!previewCues.current.has(key)){previewCues.current.add(key);playAudioFeedback('beep');}});
        if(!final||streamSeen.current.has(id))return;
        for(const key of previewCues.current)if(key.startsWith(id+':'))previewCues.current.delete(key);streamSeen.current.add(id);if(streamSeen.current.size>1000)streamSeen.current.delete(streamSeen.current.values().next().value!);
        const rallyId=streamRally.current;const inheritedTeam=streamTeam.current;
        setQueuedSequences(n=>n+1);
        const work=()=>streamProcess.current(text,id,rallyId,captureSession,inheritedTeam,evidence).finally(()=>setQueuedSequences(n=>Math.max(0,n-1)));
        // Capture and preview stay live; all final mutations have one ordered commit path.
        streamQueue.current=streamQueue.current.then(work,work);
      }},{language:settings.language,sport:currentSession.sport,deviceId:settings.inputDeviceId,provider,keyterms:speechKeyterms(currentSession.sport,[currentSession.playerA.name,currentSession.playerB.name],skills)});
      if(!started){listeningIntentRef.current=false;setIsRealMicActive(false);setVoiceState('error');}return;
    }
    if(transcriptionRetryRef.current||listeningIntentRef.current||voiceState==='transcribing'||voiceState==='understanding')return;
    if(activeTimerRef.current)clearTimeout(activeTimerRef.current);
    listeningIntentRef.current=true;setPendingAudio(null);setMicError(null);setCurrentTranscript('');setVoiceState('preparing');
    speechProvider.setLanguage(settings.language);speechProvider.setSport(currentSession.sport);
    speechProvider.configure({serverAvailable:apiStatus.hasApiKey,mode:settings.transcriptionMode==='deepgram'?'auto':settings.transcriptionMode||'auto',sensitivity:settings.sensitivity});
    const started=await speechProvider.start({onInterimTranscript:setCurrentTranscript,onAudioLevel:setAudioLevel,onStart:()=>{setIsRealMicActive(true);setVoiceState('listening');listeningStartRef.current=Date.now();},onError:(error)=>{setMicError(error.message);},onNoSpeech:()=>setMicError('ไม่พบเสียงพูด กรุณาพูดใหม่ / No speech detected.')},settings.inputDeviceId||undefined);
    if(!started){listeningIntentRef.current=false;setIsRealMicActive(false);setVoiceState('error');return;}
    if(!listeningIntentRef.current){await speechProvider.stop().catch(()=>{});return;}
    if(settings.feedbackSound)playAudioFeedback('beep');
  };
  const stopListening = async () => {
    if(continuousProvider.isCapturing()){await continuousProvider.stop();listeningIntentRef.current=false;setIsRealMicActive(false);setVoiceState('ready');return;}
    if(!listeningIntentRef.current&&!speechProvider.isCapturing())return;
    listeningIntentRef.current=false;setVoiceState('transcribing');setIsRealMicActive(false);
    try{const result=await speechProvider.stop();setAudioLevel(0);if(result.finalTranscript.trim()){await processUtterance(result.finalTranscript,result.durationMs,result.needsReview);if(result.warning)setMicError(result.warning);}else{setVoiceState('ready');setMicError(result.durationMs===0?'ไมโครโฟนยังไม่พร้อม กรุณากดอีกครั้งหลังอนุญาต / Microphone was still starting; try again.':'ไม่พบเสียงพูด กรุณาพูดใหม่ / No speech detected.');}}
    catch(err:any){if(err instanceof FailedRecording)setPendingAudio({audio:err.audio,durationMs:err.durationMs,sessionId:currentSession.id,language:settings.language});setMicError(err.message||'ถอดเสียงไม่สำเร็จ / Transcription failed.');setVoiceState('error');setAudioLevel(0);}
  };

  const retryTranscription=async()=>{if(transcriptionRetryRef.current||!pendingAudio||voiceState==='transcribing'||voiceState==='understanding')return;if(pendingAudio.sessionId!==currentSession.id){setMicError('ไฟล์เสียงนี้เป็นของการแข่งขันก่อนหน้า กรุณาดาวน์โหลดหรือเริ่มบันทึกใหม่');return;}transcriptionRetryRef.current=true;setVoiceState('transcribing');setMicError(null);try{const text=await transcribeAudio(pendingAudio.audio,pendingAudio.language);if(!text.trim()){setVoiceState('ready');setMicError('ไม่พบเสียงพูดในไฟล์ที่บันทึก / No speech in recording');return;}await processUtterance(text,pendingAudio.durationMs,true);setPendingAudio(null);}catch(e:any){setVoiceState('error');setMicError(e.message||'ถอดเสียงซ้ำไม่สำเร็จ');}finally{transcriptionRetryRef.current=false;}};
  const downloadPendingAudio=()=>{if(!pendingAudio)return;const url=URL.createObjectURL(pendingAudio.audio);const a=document.createElement('a');a.href=url;a.download='scout-recording.'+(pendingAudio.audio.type.includes('mp4')?'m4a':pendingAudio.audio.type.includes('ogg')?'ogg':'webm');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

  const processSamplePhrase = (sample: VoicePresetSample | string) => {
    const text = typeof sample === 'string' ? sample : sample.transcript;
    processUtterance(text, 0);
  };

  const editLastEvent = () => {
    if (currentSession.events.length > 0) {
      setEditingEvent(currentSession.events[0]);
    }
  };

  const deleteEvent = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        const remaining = s.events.filter((e) => e.id !== id);
        const recomputedScore = sportDef.calculateScore(remaining);
        return {
          ...s,
          playerA: { ...s.playerA, score: recomputedScore.scoreA },
          playerB: { ...s.playerB, score: recomputedScore.scoreB },
          setsA: recomputedScore.setsA,
          setsB: recomputedScore.setsB,
          currentSet: recomputedScore.currentSet,
          segments: recomputedScore.segments,
          events: remaining,
        };
      })
    );
  };

  const updateEvent = (updated: ParsedEvent) => {
    const errors=updated.status==='CONFIRMED'?validationErrors(updated):[];
    if(updated.status==='CONFIRMED'&&updated.scoreImpact.points>0&&updated.rallyId&&currentSession.events.some(e=>e.id!==updated.id&&e.rallyId===updated.rallyId&&e.status==='CONFIRMED'&&e.scoreImpact.points>0))errors.push('แรลลี่นี้มีแต้มที่ยืนยันแล้ว แก้เหตุการณ์เดิมแทนการเพิ่มแต้มซ้ำ');
    if(errors.length){setMicError(errors.join(' · '));return {success:false,errors};}
    const previous=currentSession.events.find(e=>e.id===updated.id);
    if(!previous)return {success:false,errors:['ไม่พบเหตุการณ์นี้ในการแข่งขันปัจจุบัน']};
    updated={...updated,needsReview:updated.status!=='CONFIRMED',confirmedAt:updated.status==='CONFIRMED'?(previous.status==='CONFIRMED'?previous.confirmedAt: new Date().toISOString()):undefined};
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        const updatedList = s.events.map((e) => (e.id === updated.id ? updated : e));
        const recomputedScore = sportDef.calculateScore(updatedList);
        return {
          ...s,
          playerA: { ...s.playerA, score: recomputedScore.scoreA },
          playerB: { ...s.playerB, score: recomputedScore.scoreB },
          setsA: recomputedScore.setsA,
          setsB: recomputedScore.setsB,
          currentSet: recomputedScore.currentSet,
          segments: recomputedScore.segments,
          events: updatedList,
        };
      })
    );
    if (currentParsedEvent?.id === updated.id) {
      setCurrentParsedEvent(updated);
    }
    setEditingEvent(null);
    return {success:true,errors:[]};
  };

  const adjustScore = (player: 'A' | 'B', delta: number) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSession.id) return s;
        const replay = getSportDefinition(s.sport,s.format).calculateScore(s.events);
        if(delta>0){const point:ParsedEvent={id:crypto.randomUUID(),sessionId:s.id,sport:s.sport,rallyId:crypto.randomUUID(),timestamp:new Date().toISOString(),actorSide:player,action:'Manual Point',outcome:'WINNER',scoreImpact:{points:1,sideAwarded:player},source:'manual',status:'CONFIRMED',recordType:'MANUAL_POINT'};return {...s,events:[point,...s.events]};}
        const correction:ParsedEvent={id:crypto.randomUUID(),sessionId:s.id,sport:s.sport,timestamp:new Date().toISOString(),action:'Score Correction',outcome:'IN_PLAY',scoreImpact:{points:0},source:'manual',status:'CONFIRMED',recordType:'SCORE_CORRECTION',scoreCorrection:{scoreA:player==='A'?Math.max(0,replay.scoreA+delta):replay.scoreA,scoreB:player==='B'?Math.max(0,replay.scoreB+delta):replay.scoreB,setsA:replay.setsA,setsB:replay.setsB,currentSet:replay.currentSet,reason:`Manual adjustment ${player} ${delta}`}};
        return {...s,events:[correction,...s.events]};
      })
    );
  };

  const switchSession = (sessionId: string) => {
    if(listeningIntentRef.current){void stopListening();}
    setLiveTags([]);
    setActiveSessionId(sessionId);
    const target = sessions.find((s) => s.id === sessionId);
    if (target && target.events.length > 0) {
      setCurrentParsedEvent(target.events[0]);
      setCurrentTranscript(target.events[0].rawTranscript || '');
    }
  };

  const createSession = (
    sport: SportType,
    playerA: string,
    playerB: string,
    mode: 'singles' | 'doubles' | 'team',
    format: string
  ) => {
    if(listeningIntentRef.current)void stopListening();
    const newSession: MatchSession = {
      id: `session-${Date.now()}`,
      title: `${playerA} vs ${playerB}`,
      sport,
      date: 'Just now',
      playerA: {
        name: playerA || (sport === 'volleyball' ? 'Team A' : 'Player A'),
        score: 0,
        color: '#3b82f6',
      },
      playerB: {
        name: playerB || (sport === 'volleyball' ? 'Team B' : 'Player B'),
        score: 0,
        color: '#ef4444',
      },
      mode,
      currentSet: 1,
      setsA: 0,
      setsB: 0,
      language: settings.language,
      inputDevice: settings.inputDevice,
      format,
      events: [],
      status: 'active',
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentParsedEvent(null);
    setCurrentTranscript('');
    setShowNewSessionModal(false);
    setActiveTab('scout');
  };

  const exportSessionJson = () => {
    const jsonStr = storageService.exportSessionAsJson(currentSession);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sportscout_${currentSession.sport}_${currentSession.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSessionCsv = () => {
    const csvStr = storageService.exportSessionAsCsv(currentSession);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sportscout_${currentSession.sport}_${currentSession.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAllData = () => {
    storageService.resetAll();
    const fresh = storageService.getSessions();
    setSessions(fresh);
    setActiveSessionId(fresh[0].id);
    setSettings(storageService.getSettings());
    setSkills(storageService.getSkills());
    setShowOnboarding(true);
  };

  return (
    <ScoutContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sessions,
        currentSession,
        scoreState,
        stats,
        heatmapData,
        voiceState,
        currentTranscript,
        currentParsedEvent,
        settings,
        updateSettings,
        skills: skills.map(sk=>({...sk,count:officialEvents(currentSession.events).filter(e=>e.action===sk.name).length})),
        toggleSkill,
        addSkillAlias,
        addCustomSkill,
        startListening,
        stopListening,
        processSamplePhrase,
        processUtterance,
        undoLastEvent,
        editLastEvent,
        deleteEvent,
        updateEvent,
        adjustScore,
        switchSession,
        createSession,
        exportSessionJson,
        exportSessionCsv,
        showOnboarding,
        setShowOnboarding: (val: boolean) => {
          setShowOnboarding(val);
          storageService.setOnboarded(!val);
        },
        showNewSessionModal,
        setShowNewSessionModal,
        editingEvent,
        setEditingEvent,
        resetAllData,
        apiStatus,
        refreshApiStatus,
        liveTags,queuedSequences,
        audioLevel,
        isRealMicActive,
        micError,
        hasPendingAudio:!!pendingAudio,retryTranscription,downloadPendingAudio,
        diagnostics,
        showDiagnostics,
        setShowDiagnostics,
      }}
    >
      {children}
    </ScoutContext.Provider>
  );
};

export const useScout = () => {
  const context = useContext(ScoutContext);
  if (!context) {
    throw new Error('useScout must be used within a ScoutProvider');
  }
  return context;
};
