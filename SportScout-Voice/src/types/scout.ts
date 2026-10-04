import type {
  ActorPlayer,
  EventSource,
  EventStatus,
  MatchSegment,
  Rally,
  ScoreImpact,
  ScoreState,
  ScoutEvent,
  Side,
  SpatialZone,
  SportDefinition,
  SportStats,
  SportType,
} from '../domain/types.js';

export type * from '../domain/types.js';

export type LanguageMode = 'th' | 'en' | 'mixed';

export type VoiceState =
  | 'ready'
  | 'preparing'
  | 'listening'
  | 'transcribing'
  | 'understanding'
  | 'confirmed'
  | 'review_required'
  | 'error';

export type PlayerSide = Side;

export interface ParsedEvent extends ScoutEvent {
  // Convenience accessors for existing UI components
  player?: PlayerSide;
  playerName?: string;
  result?: 'winner' | 'error' | 'rally' | 'ace';
  pointDelta?: number; // 0 or +1
  scoreAfterA?: number;
  scoreAfterB?: number;
  needsReview?: boolean;
}

export interface MatchSession {
  id: string;
  title: string;
  sport: SportType;
  date: string;
  playerA: {
    name: string;
    score: number;
    color: string;
    jerseyNumber?: string;
  };
  playerB: {
    name: string;
    score: number;
    color: string;
    jerseyNumber?: string;
  };
  mode: 'singles' | 'doubles' | 'team';
  currentSet: number;
  setsA: number;
  setsB: number;
  segments?: MatchSegment[];
  rallies?: Rally[];
  language: LanguageMode;
  inputDevice: string;
  inputDeviceId?: string;
  format: string;
  events: ParsedEvent[];
  status: 'active' | 'paused' | 'completed';
  isDemo?: boolean;
}

export interface SkillItem {
  id: string;
  sport: SportType;
  name: string;
  nameTh: string;
  category: 'attack' | 'defense' | 'serve' | 'transition';
  aliases: string[];
  enabled: boolean;
  isCore: boolean;
  count: number;
}

export interface AudioDeviceOption {
  id: string;
  name: string;
  type: 'builtin' | 'bluetooth' | 'headset' | 'external';
}

export interface VoicePresetSample {
  id: string;
  sport: SportType;
  language: 'th' | 'en';
  label: string;
  transcript: string;
  explanation: string;
  parsed: {
    player: PlayerSide;
    action: string;
    originZone?: string;
    targetZone?: string;
    result: 'winner' | 'error' | 'rally' | 'ace';
    pointDelta: number;
  };
}
