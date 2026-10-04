import {replayScore} from '../domain/scoreReplay';
import { SportDefinition, SportType } from '../domain/types';
import { BadmintonDefinition } from './badminton';
import { VolleyballDefinition } from './volleyball';

const SPORT_REGISTRY: Record<SportType, SportDefinition> = {
  badminton: BadmintonDefinition,
  volleyball: VolleyballDefinition,
};

export function getSportDefinition(sport: SportType,format?:string): SportDefinition {
  const def = SPORT_REGISTRY[sport];
  if (!def) {
    return BadmintonDefinition;
  }
  return format?{...def,calculateScore:events=>replayScore(events,sport,format).state}:def;
}

export function getAllSportDefinitions(): SportDefinition[] {
  return Object.values(SPORT_REGISTRY);
}
