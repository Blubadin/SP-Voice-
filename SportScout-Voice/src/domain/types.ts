export type SportType = 'badminton' | 'volleyball';

export type Side = 'A' | 'B';

export type EventStatus = 'DRAFT' | 'INTERPRETED' | 'CONFIRMED' | 'REVIEW_REQUIRED' | 'REJECTED';

export type EventSource = 'voice' | 'manual' | 'test';

export interface ActorPlayer {
  id?: string;
  name?: string;
  jerseyNumber?: string;
  role?: string;
}

export interface SpatialZone {
  id: string;
  name: string;
  nameTh?: string;
  x: number; // 0 to 1 normalized court position
  y: number; // 0 to 1 normalized court position
  courtSide?: Side;
  number?: number;
}

export interface ScoreImpact {
  sideAwarded?: Side;
  points: number; // 0 or 1
}

export interface ScoutEvent {
  id: string;
  sessionId: string;
  rallyId?: string;
  sport: SportType;
  timestamp: string;
  confirmedAt?:string; // e.g. "14:22"

  actorSide?: Side;
  actorPlayer?: ActorPlayer;

  action: string;
  subtype?: string;

  originZone?: string; // undefined if unknown - NEVER fake guess
  targetZone?: string; // undefined if unknown - NEVER fake guess

  outcome: string; // IN_PLAY, WINNER, ERROR, ACE, KILL, BLOCKED
  errorType?: 'OUT' | 'NET' | 'SERVICE_ERROR' | string;
  receptionQuality?: 0 | 1 | 2 | 3;

  scoreImpact: ScoreImpact;

  rawTranscript?: string;
  normalizedText?: string;

  source: EventSource;
  status: EventStatus;
  confidence?: number;
  recordType?: 'SCORE_CORRECTION' | 'MANUAL_POINT';
  captureSequence?:number;
  speechEvidence?: {utteranceId:string;provider:string;receivedAt:number;gap?:boolean;words?:Array<{word:string;start?:number;end?:number;confidence?:number}>};
  scoreCorrection?: {scoreA:number;scoreB:number;setsA:number;setsB:number;currentSet:number;reason:string};

  // Snapshot calculated fields (populated by scoring engine)
  scoreAfterA?: number;
  scoreAfterB?: number;
  setsAfterA?: number;
  setsAfterB?: number;
  segmentIndex?: number; // 1-based (set 1, set 2...)
}

export interface Rally {
  id: string;
  sessionId: string;
  segmentIndex: number;
  rallyNumber: number;
  events: ScoutEvent[];
  winnerSide?: Side;
  pointAwarded: boolean;
}

export interface MatchSegment {
  segmentIndex: number; // 1-based
  scoreA: number;
  scoreB: number;
  isCompleted: boolean;
  winnerSide?: Side;
}

export interface ScoreState {
  setsA: number;
  setsB: number;
  currentSet: number;
  scoreA: number; // Current active set score for Side A
  scoreB: number; // Current active set score for Side B
  segments: MatchSegment[];
  isMatchFinished: boolean;
  matchWinner?: Side;
  servingSide?: Side;
}

export interface HeatmapHotspot {
  eventIds: string[];
  zone: string;
  count: number;
  side?: Side;
  x: number;
  y: number;
  intensity: number; // 0 to 1
}

export interface ShotTrajectory {
  id: string;
  fromZone: string;
  toZone: string;
  side: Side;
  action: string;
  isWinner: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface HeatmapData {
  totalEvents: number;
  mappedEvents: number; // Count of events with known coordinates
  unmappedEvents: number; // Count of events where neither origin nor target is known
  originFrequencies: Record<string, number>;
  targetFrequencies: Record<string, number>;
  hotspots: HeatmapHotspot[];
  shotTrajectories: ShotTrajectory[];
}

export interface BadmintonStats {
  attempts: number;
  inPlay: number;
  shotDistribution: Record<string,number>;
  sport: 'badminton';
  totalEvents: number;
  confirmedEvents: number;
  totalRallies: number;
  winnersA: number;
  winnersB: number;
  errorsA: number;
  errorsB: number;
  skillBreakdown: Array<{
    name: string;
    nameTh: string;
    attempts: number;
    winners: number;
    errors: number;
    frequencyPercent: number;
  }>;
  originDistribution: Record<string, number>;
  targetDistribution: Record<string, number>;
  avgRallyLength: number;
}

export interface VolleyballStats {
  sport: 'volleyball';
  totalEvents: number;
  confirmedEvents: number;
  totalRallies: number;
  // Serve
  serveAttemptsA: number;
  serveAttemptsB: number;
  acesA: number;
  acesB: number;
  serveErrorsA: number;
  serveErrorsB: number;
  // Reception
  receptionAttemptsA: number;
  receptionAttemptsB: number;
  receptionQualityA: { 0: number; 1: number; 2: number; 3: number };
  receptionQualityB: { 0: number; 1: number; 2: number; 3: number };
  avgReceptionQualityA: number;
  avgReceptionQualityB: number;
  // Attack
  attackAttemptsA: number;
  attackAttemptsB: number;
  killsA: number;
  killsB: number;
  attackErrorsA: number;
  attackErrorsB: number;
  blockedAttacksA: number;
  blockedAttacksB: number;
  attackEfficiencyA: number; // (Kills - Errors) / Attempts
  attackEfficiencyB: number;
  // Blocks & Digs
  blocksA: number;
  blocksB: number;
  digsA: number;
  digsB: number;
}

export type SportStats = BadmintonStats | VolleyballStats;

export interface SportDefinition {
  id: SportType;
  name: string;
  nameTh: string;
  defaultFormat: string;
  defaultActions: string[];
  subtypes?: Record<string, string[]>;
  zones: SpatialZone[];
  scoringRules: {
    setsToWin: number;
    pointsPerSet: (setNumber: number) => number;
    winByTwo: boolean;
    pointCap?: number;
  };
  calculateScore: (events: ScoutEvent[]) => ScoreState;
  calculateStats: (events: ScoutEvent[]) => SportStats;
  aggregateHeatmap: (events: ScoutEvent[], filterSide?: 'all' | 'A' | 'B') => HeatmapData;
  parseNaturalText: (
    text: string,
    currentScore: ScoreState,
    nameA: string,
    nameB: string
  ) => Partial<ScoutEvent>;
}
