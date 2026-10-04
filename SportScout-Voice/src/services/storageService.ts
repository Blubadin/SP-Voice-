import { MatchSession, ParsedEvent, SkillItem, SportType } from '../types/scout';
import { INITIAL_SKILLS } from '../sports/skillData';
import { calculateBadmintonScore } from '../sports/badminton';
import { calculateVolleyballScore } from '../sports/volleyball';

export interface AppSettings {
  uiLanguage: 'th' | 'en';
  transcriptionMode: 'auto' | 'browser' | 'server' | 'deepgram';
  captureMode:'continuous'|'utterance';
  language: 'th' | 'en';
  inputDevice: string;
  inputDeviceId: string;
  feedbackSound: boolean;
  haptic: boolean;
  holdToTalkMode: boolean;
  autoConfirmSeconds: number;
  sensitivity: 'low' | 'normal' | 'high';
  sportDefault: SportType;
  devMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  uiLanguage: 'th',
  transcriptionMode: 'auto',
  captureMode:'continuous',
  language: 'th',
  inputDevice: 'Default Microphone',
  inputDeviceId: 'default',
  feedbackSound: true,
  haptic: true,
  holdToTalkMode: true,
  autoConfirmSeconds: 1.5,
  sensitivity: 'normal',
  sportDefault: 'badminton',
  devMode: false,
};

export function createFreshSession(sport: SportType = 'badminton'): MatchSession {
  return {
    id: `session-${Date.now()}`,
    title: sport === 'badminton' ? 'Badminton Match' : 'Volleyball Match',
    sport,
    date: 'Today',
    playerA: {
      name: sport === 'badminton' ? 'Player A' : 'Team A',
      score: 0,
      color: '#3b82f6',
    },
    playerB: {
      name: sport === 'badminton' ? 'Player B' : 'Team B',
      score: 0,
      color: '#ef4444',
    },
    mode: sport === 'badminton' ? 'singles' : 'team',
    currentSet: 1,
    setsA: 0,
    setsB: 0,
    language: 'th',
    inputDevice: 'Default Microphone',
    inputDeviceId: 'default',
    format: sport === 'badminton' ? 'BWF 21 pts (Best of 3)' : 'FIVB 25 pts (Best of 5)',
    events: [],
    status: 'active',
    isDemo: false,
  };
}

// Rich Realistic Badminton Demo Events (including multi-shot rallies)
const INITIAL_BADMINTON_EVENTS: ParsedEvent[] = [
  // Rally 5: A Drop Winner (14:20)
  {
    id: 'bad-ev-5c',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-5',
    sport: 'badminton',
    timestamp: '14:20',
    actorSide: 'A',
    player: 'A',
    playerName: 'Kunlavut V. (A)',
    action: 'Drop',
    subtype: 'Reverse Slice',
    originZone: 'Rear Right',
    targetZone: 'Front Left',
    outcome: 'WINNER',
    scoreImpact: { sideAwarded: 'A', points: 1 },
    pointDelta: 1,
    rawTranscript: 'A อยู่ขวาหน้า เอ้ยไม่ใช่ขวาหลัง แล้วหยอดไปหน้าซ้าย ได้หนึ่ง',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 12,
    scoreAfterB: 8,
    segmentIndex: 1,
  },
  {
    id: 'bad-ev-5b',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-5',
    sport: 'badminton',
    timestamp: '14:20',
    actorSide: 'B',
    player: 'B',
    playerName: 'Viktor A. (B)',
    action: 'Lift',
    subtype: 'Defensive High',
    originZone: 'Front Right',
    targetZone: 'Rear Right',
    outcome: 'IN_PLAY',
    scoreImpact: { points: 0 },
    pointDelta: 0,
    rawTranscript: 'B ยกหลังขวา',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 11,
    scoreAfterB: 8,
    segmentIndex: 1,
  },
  {
    id: 'bad-ev-5a',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-5',
    sport: 'badminton',
    timestamp: '14:19',
    actorSide: 'A',
    player: 'A',
    playerName: 'Kunlavut V. (A)',
    action: 'Smash',
    subtype: 'Straight',
    originZone: 'Rear Center',
    targetZone: 'Mid Left',
    outcome: 'IN_PLAY',
    scoreImpact: { points: 0 },
    pointDelta: 0,
    rawTranscript: 'A ตบเส้นตรงกลางคอร์ด',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 11,
    scoreAfterB: 8,
    segmentIndex: 1,
  },

  // Rally 4: B Clear to back line error (14:18)
  {
    id: 'bad-ev-4',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-4',
    sport: 'badminton',
    timestamp: '14:18',
    actorSide: 'B',
    player: 'B',
    playerName: 'Viktor A. (B)',
    action: 'Clear',
    originZone: 'Rear Center',
    targetZone: 'Rear Left',
    outcome: 'ERROR',
    errorType: 'OUT',
    scoreImpact: { sideAwarded: 'A', points: 1 },
    pointDelta: 1,
    rawTranscript: 'B เคลียร์ลึกไปหลังซ้าย A ปล่อยออก เสียแต้ม',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 11,
    scoreAfterB: 8,
    segmentIndex: 1,
  },

  // Rally 3: A Cross Smash Winner (14:16)
  {
    id: 'bad-ev-3',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-3',
    sport: 'badminton',
    timestamp: '14:16',
    actorSide: 'A',
    player: 'A',
    playerName: 'Kunlavut V. (A)',
    action: 'Smash',
    subtype: 'Jump Smash',
    originZone: 'Rear Right',
    targetZone: 'Front Right',
    outcome: 'WINNER',
    scoreImpact: { sideAwarded: 'A', points: 1 },
    pointDelta: 1,
    rawTranscript: 'A ตบเส้นขนานลงหน้าขวา สแมชคมมาก ได้แต้ม',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 10,
    scoreAfterB: 8,
    segmentIndex: 1,
  },

  // Rally 2: B Net Drop Winner (14:13)
  {
    id: 'bad-ev-2',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-2',
    sport: 'badminton',
    timestamp: '14:13',
    actorSide: 'B',
    player: 'B',
    playerName: 'Viktor A. (B)',
    action: 'Drop',
    subtype: 'Fast Drop',
    originZone: 'Front Center',
    targetZone: 'Front Right',
    outcome: 'WINNER',
    scoreImpact: { sideAwarded: 'B', points: 1 },
    pointDelta: 1,
    rawTranscript: 'B หยอดตัดหน้าเน็ต A ตามมารับไม่ทัน',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 9,
    scoreAfterB: 8,
    segmentIndex: 1,
  },

  // Rally 1: A Drive Winner (14:10)
  {
    id: 'bad-ev-1',
    sessionId: 'session-badminton-1',
    rallyId: 'bad-rally-1',
    sport: 'badminton',
    timestamp: '14:10',
    actorSide: 'A',
    player: 'A',
    playerName: 'Kunlavut V. (A)',
    action: 'Drive',
    subtype: 'Flat Drive',
    originZone: 'Mid Center',
    targetZone: 'Mid Center',
    outcome: 'WINNER',
    scoreImpact: { sideAwarded: 'A', points: 1 },
    pointDelta: 1,
    rawTranscript: 'A ดาดเร็วบีบกลางคอร์ด B ตีติดเน็ต',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 9,
    scoreAfterB: 7,
    segmentIndex: 1,
  },
];

// Rich Realistic Volleyball Demo Events (with Multi-Shot Rallies, Jersey #, Reception Quality, Attack Kills)
const INITIAL_VOLLEYBALL_EVENTS: ParsedEvent[] = [
  // Rally 3: Serve Ace by #7 (19:48)
  {
    id: 'vb-ev-3',
    sessionId: 'session-volleyball-1',
    rallyId: 'vb-rally-3',
    sport: 'volleyball',
    timestamp: '19:48',
    actorSide: 'A',
    player: 'A',
    playerName: 'Thailand (Team A)',
    actorPlayer: { jerseyNumber: '#7', name: 'Pornpun G. (#7)' },
    action: 'Serve',
    subtype: 'Jump Float',
    originZone: 'Zone 1',
    targetZone: 'Zone 1',
    outcome: 'ACE',
    scoreImpact: { sideAwarded: 'A', points: 1 },
    pointDelta: 1,
    rawTranscript: 'ทีม A เบอร์ 7 เสิร์ฟจัมพ์โฟลตลงโซน 1 ได้เอซ',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 21,
    scoreAfterB: 19,
    segmentIndex: 2,
  },

  // Rally 2: Multi-shot: Serve -> Reception Q3 -> Set -> Attack Blocked (19:46)
  {
    id: 'vb-ev-2d',
    sessionId: 'session-volleyball-1',
    rallyId: 'vb-rally-2',
    sport: 'volleyball',
    timestamp: '19:46',
    actorSide: 'B',
    player: 'B',
    playerName: 'Japan (Team B)',
    actorPlayer: { jerseyNumber: '#3', name: 'Sarina K. (#3)' },
    action: 'Block',
    subtype: 'Double',
    originZone: 'Zone 3',
    targetZone: 'Zone 3',
    outcome: 'KILL',
    scoreImpact: { sideAwarded: 'B', points: 1 },
    pointDelta: 1,
    rawTranscript: 'ทีม B เบอร์ 3 บล็อกสำเร็จที่โซน 3 ได้หนึ่งแต้ม',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 20,
    scoreAfterB: 19,
    segmentIndex: 2,
  },
  {
    id: 'vb-ev-2c',
    sessionId: 'session-volleyball-1',
    rallyId: 'vb-rally-2',
    sport: 'volleyball',
    timestamp: '19:46',
    actorSide: 'A',
    player: 'A',
    playerName: 'Thailand (Team A)',
    actorPlayer: { jerseyNumber: '#18', name: 'Ajcharaporn K. (#18)' },
    action: 'Attack',
    subtype: 'Spike',
    originZone: 'Zone 4',
    targetZone: 'Zone 3',
    outcome: 'BLOCKED',
    scoreImpact: { points: 0 },
    pointDelta: 0,
    rawTranscript: 'ทีม A เบอร์ 18 ตบหัวเสาโซน 4',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 20,
    scoreAfterB: 18,
    segmentIndex: 2,
  },
  {
    id: 'vb-ev-2b',
    sessionId: 'session-volleyball-1',
    rallyId: 'vb-rally-2',
    sport: 'volleyball',
    timestamp: '19:45',
    actorSide: 'A',
    player: 'A',
    playerName: 'Thailand (Team A)',
    actorPlayer: { jerseyNumber: '#7', name: 'Pornpun G. (#7)' },
    action: 'Set',
    subtype: 'High Ball',
    originZone: 'Zone 3',
    targetZone: 'Zone 4',
    outcome: 'IN_PLAY',
    scoreImpact: { points: 0 },
    pointDelta: 0,
    rawTranscript: 'เบอร์ 7 เซ็ตยกไปหัวเสา',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 20,
    scoreAfterB: 18,
    segmentIndex: 2,
  },
  {
    id: 'vb-ev-2a',
    sessionId: 'session-volleyball-1',
    rallyId: 'vb-rally-2',
    sport: 'volleyball',
    timestamp: '19:45',
    actorSide: 'A',
    player: 'A',
    playerName: 'Thailand (Team A)',
    actorPlayer: { jerseyNumber: '#2', name: 'Piyanut P. (#2)' },
    action: 'Reception',
    subtype: 'Bump / Underhand',
    originZone: 'Zone 6',
    receptionQuality: 3,
    outcome: 'IN_PLAY',
    scoreImpact: { points: 0 },
    pointDelta: 0,
    rawTranscript: 'เบอร์ 2 รับบอลแรกเข้าจุด คุณภาพ 3',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 20,
    scoreAfterB: 18,
    segmentIndex: 2,
  },

  // Rally 1: Quick Attack Kill Winner by #11 (19:43)
  {
    id: 'vb-ev-1',
    sessionId: 'session-volleyball-1',
    rallyId: 'vb-rally-1',
    sport: 'volleyball',
    timestamp: '19:43',
    actorSide: 'A',
    player: 'A',
    playerName: 'Thailand (Team A)',
    actorPlayer: { jerseyNumber: '#11', name: 'Thatdao N. (#11)' },
    action: 'Attack',
    subtype: 'Quick',
    originZone: 'Zone 3',
    targetZone: 'Zone 5',
    outcome: 'KILL',
    scoreImpact: { sideAwarded: 'A', points: 1 },
    pointDelta: 1,
    rawTranscript: 'ทีม A เบอร์ 11 บอลเร็วกลางเน็ตลงโซน 5 ได้แต้ม',
    source: 'voice',
    status: 'CONFIRMED',
    scoreAfterA: 20,
    scoreAfterB: 18,
    segmentIndex: 2,
  },
];

export const DEMO_SESSIONS: MatchSession[] = [
  {
    id: 'demo-badminton-1',
    title: '[DEMO] Kunlavut vs Viktor · World Tour Finals',
    sport: 'badminton',
    date: 'Demo Preset',
    playerA: {
      name: 'Kunlavut V. (A)',
      score: 12,
      color: '#3b82f6',
    },
    playerB: {
      name: 'Viktor A. (B)',
      score: 8,
      color: '#ef4444',
    },
    mode: 'singles',
    currentSet: 1,
    setsA: 0,
    setsB: 0,
    language: 'th',
    inputDevice: 'Default Microphone',
    inputDeviceId: 'default',
    format: 'Best of 3 (21 pts)',
    events: INITIAL_BADMINTON_EVENTS,
    status: 'completed',
    isDemo: true,
  },
  {
    id: 'demo-volleyball-1',
    title: '[DEMO] Thailand vs Japan · Nations League',
    sport: 'volleyball',
    date: 'Demo Preset',
    playerA: {
      name: 'Thailand (Team A)',
      score: 21,
      color: '#3b82f6',
    },
    playerB: {
      name: 'Japan (Team B)',
      score: 19,
      color: '#ef4444',
    },
    mode: 'team',
    currentSet: 2,
    setsA: 1,
    setsB: 0,
    language: 'th',
    inputDevice: 'Default Microphone',
    inputDeviceId: 'default',
    format: 'Best of 5 (25 pts)',
    events: INITIAL_VOLLEYBALL_EVENTS,
    status: 'completed',
    isDemo: true,
  },
];

const DB_NAME = 'SportScoutDB_v2';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_SETTINGS = 'settings';
const STORE_SKILLS = 'skills';

const KEYS = {
  SESSIONS: 'sportscout_sessions_v2',
  ACTIVE_SESSION: 'sportscout_active_session_v2',
  SETTINGS: 'sportscout_settings_v2',
  SKILLS: 'sportscout_skills_v2',
  ONBOARDED: 'sportscout_onboarded_v2',
};

// IndexedDB Helper
class IndexedDbStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
              db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
              db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORE_SKILLS)) {
              db.createObjectStore(STORE_SKILLS, { keyPath: 'id' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  async setItem(storeName: string, item: any): Promise<void> {
    const db = await this.getDB();
    if (!db) return;
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(item);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  }

  async replaceSessions(sessions:MatchSession[],updatedAt=Date.now()):Promise<boolean>{
    const db=await this.getDB();if(!db)return false;
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction([STORE_SESSIONS,STORE_SETTINGS],'readwrite');tx.objectStore(STORE_SETTINGS).put({key:'session_snapshot',updatedAt,ids:sessions.map(s=>s.id)});const store=tx.objectStore(STORE_SESSIONS);store.clear();for(const session of sessions)store.put(session);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});return true;
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.getDB();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }
}

const idb = new IndexedDbStorage();

export const storageService = {
  getSessions(): MatchSession[] {
    try {
      const raw = localStorage.getItem(KEYS.SESSIONS);
      if (raw) {
        const data = JSON.parse(raw);const parsed=Array.isArray(data)?data:data.sessions;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Clean fresh real session - NO FAKE SEEDED MATCHES
    const fresh = createFreshSession('badminton');
    return [fresh];
  },

  async hydrateSessions():Promise<MatchSession[]> {
    let local:MatchSession[]=[];let localTime=0;
    try{const raw=localStorage.getItem(KEYS.SESSIONS);if(raw){const data=JSON.parse(raw);local=Array.isArray(data)?data:data.sessions||[];localTime=data.updatedAt||0;}}catch{}
    const [stored,settings]=await Promise.all([idb.getAll(STORE_SESSIONS),idb.getAll(STORE_SETTINGS)]);
    const meta=settings.find(s=>s.key==='session_snapshot');
    if(meta&&meta.updatedAt>localTime){const ids:string[]=meta.ids||[];return stored.filter(s=>ids.includes(s.id)&&Array.isArray(s.events)&&['badminton','volleyball'].includes(s.sport)).sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));}
    if(local.length)return local;
    // Old mirrors may contain deleted sessions; only recover them when no main copy exists.
    return meta?[]:stored.filter(s=>s&&typeof s.id==='string'&&Array.isArray(s.events)&&['badminton','volleyball'].includes(s.sport));
  },

  async saveSessions(sessions:MatchSession[]) {
    if(typeof window==='undefined')return;
    const updatedAt=Date.now();let localSaved=false;
    try{localStorage.setItem(KEYS.SESSIONS,JSON.stringify({sessions,updatedAt}));localSaved=true;}catch{}
    let dbSaved=false;
    try{dbSaved=await idb.replaceSessions(sessions,updatedAt);}catch{}
    if(!localSaved&&!dbSaved)throw Error('Session storage unavailable');
  },

  getActiveSessionId(): string {
    try {
      const id = localStorage.getItem(KEYS.ACTIVE_SESSION);
      if (id) return id;
      const current = this.getSessions();
      if (current.length > 0) return current[0].id;
    } catch {
      // ignore
    }
    return 'default-session';
  },

  setActiveSessionId(id: string) {
    try {
      localStorage.setItem(KEYS.ACTIVE_SESSION, id);
    } catch {
      // ignore
    }
  },

  getDemoSessions(): MatchSession[] {
    return DEMO_SESSIONS;
  },

  loadDemoSession(sport: SportType = 'badminton'): MatchSession {
    const template = DEMO_SESSIONS.find((s) => s.sport === sport) || DEMO_SESSIONS[0];
    const newDemo: MatchSession = {
      ...template,
      id: `demo-${sport}-${Date.now()}`,
      isDemo: true,
      date: 'Demo Recording',
    };
    const current = this.getSessions().filter((s) => s.id !== newDemo.id);
    const updated = [newDemo, ...current];
    void this.saveSessions(updated).catch(()=>{});
    this.setActiveSessionId(newDemo.id);
    return newDemo;
  },

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      void idb.setItem(STORE_SETTINGS, { key: 'app_settings', ...settings }).catch(()=>{});
    } catch {
      // ignore
    }
  },

  getSkills(): SkillItem[] {
    try {
      const raw = localStorage.getItem(KEYS.SKILLS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return INITIAL_SKILLS;
  },

  saveSkills(skills: SkillItem[]) {
    try {
      localStorage.setItem(KEYS.SKILLS, JSON.stringify(skills));
      skills.forEach((sk) => {void idb.setItem(STORE_SKILLS, sk).catch(()=>{});});
    } catch {
      // ignore
    }
  },

  isOnboarded(): boolean {
    try {
      return localStorage.getItem(KEYS.ONBOARDED) === 'true';
    } catch {
      return false;
    }
  },

  setOnboarded(value: boolean) {
    try {
      localStorage.setItem(KEYS.ONBOARDED, value ? 'true' : 'false');
    } catch {
      // ignore
    }
  },

  resetAll() {
    void idb.replaceSessions([]).catch(()=>{});
    try {
      localStorage.removeItem(KEYS.SESSIONS);
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
      localStorage.removeItem(KEYS.SETTINGS);
      localStorage.removeItem(KEYS.SKILLS);
      localStorage.removeItem(KEYS.ONBOARDED);
    } catch {
      // ignore
    }
  },

  // Export session to JSON with Schema Version 2.0.0
  exportSessionAsJson(session: MatchSession): string {
    const payload = {
      schemaVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      app: 'SportScout Voice',
      session: {
        id: session.id,
        title: session.title,
        sport: session.sport,
        date: session.date,
        format: session.format,
        mode: session.mode,
        playerA: session.playerA,
        playerB: session.playerB,
        currentSet: session.currentSet,
        setsA: session.setsA,
        setsB: session.setsB,
        status: session.status,
        eventCount: session.events.length,
        events: session.events.map((e) => ({
          id: e.id,
          rallyId: e.rallyId,
          timestamp: e.timestamp,
          actorSide: e.actorSide,
          actorPlayer: e.actorPlayer,
          action: e.action,
          subtype: e.subtype,
          originZone: e.originZone,
          targetZone: e.targetZone,
          outcome: e.outcome,
          errorType: e.errorType,
          receptionQuality: e.receptionQuality,
          scoreImpact: e.scoreImpact,
          scoreAfterA: e.scoreAfterA,
          scoreAfterB: e.scoreAfterB,
          status: e.status,
          source: e.source,
          confidence: e.confidence,
          rawTranscript: e.rawTranscript,
        })),
      },
    };
    return JSON.stringify(payload, null, 2);
  },

  // Export session to CSV
  exportSessionAsCsv(session: MatchSession): string {
    const headers = [
      'EventID',
      'RallyID',
      'Timestamp',
      'Side',
      'PlayerName',
      'JerseyNumber',
      'Action',
      'Subtype',
      'OriginZone',
      'TargetZone',
      'Outcome',
      'ErrorType',
      'ReceptionQuality',
      'PointsAwarded',
      'SideAwarded',
      'ScoreAfterA',
      'ScoreAfterB',
      'Status',
      'Confidence',
      'RawTranscript',
    ];

    const rows = session.events.map((e) => [
      `"${e.id || ''}"`,
      `"${e.rallyId || ''}"`,
      `"${e.timestamp || ''}"`,
      `"${e.actorSide || e.player || ''}"`,
      `"${e.actorPlayer?.name || e.playerName || ''}"`,
      `"${e.actorPlayer?.jerseyNumber || ''}"`,
      `"${e.action || ''}"`,
      `"${e.subtype || ''}"`,
      `"${e.originZone || ''}"`,
      `"${e.targetZone || ''}"`,
      `"${e.outcome || e.result || ''}"`,
      `"${e.errorType || ''}"`,
      `"${e.receptionQuality !== undefined ? e.receptionQuality : ''}"`,
      `"${e.scoreImpact?.points || e.pointDelta || 0}"`,
      `"${e.scoreImpact?.sideAwarded || ''}"`,
      `"${e.scoreAfterA ?? ''}"`,
      `"${e.scoreAfterB ?? ''}"`,
      `"${e.status || 'CONFIRMED'}"`,
      `"${e.confidence || ''}"`,
      `"${(e.rawTranscript || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
