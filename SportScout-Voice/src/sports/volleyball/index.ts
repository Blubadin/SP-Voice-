import {replayScore} from '../../domain/scoreReplay';
import {scoreReplayOrder} from '../../domain/scoreOrder';
import {officialEvents, validationErrors, zones as canonicalZones} from '../../domain/validation';
import {parseSequence} from '../../domain/localParser';
import {zonePosition} from '../../domain/geometry';
import {
  HeatmapData,
  HeatmapHotspot,
  MatchSegment,
  ScoreState,
  ScoutEvent,
  ShotTrajectory,
  Side,
  SpatialZone,
  SportDefinition,
  VolleyballStats,
} from '../../domain/types';

// Standard 6 Volleyball Rotation Zones per court side
export const VOLLEYBALL_ZONES: SpatialZone[] = canonicalZones.volleyball.map(id=>{const p=zonePosition('volleyball',id,'A')!;return {id,name:id,x:p.x/1800,y:p.y/900,courtSide:'A'};});

export const VOLLEYBALL_ACTIONS = [
  'Serve',
  'Reception',
  'Set',
  'Attack',
  'Block',
  'Dig',
  'Free Ball',
  'Cover',
  'Overpass',
  'Error',
];

export const VOLLEYBALL_SUBTYPES: Record<string, string[]> = {
  Serve: ['Float', 'Jump Float', 'Jump Spin', 'Underhand'],
  Attack: ['Spike', 'Tip', 'Roll', 'Quick', 'Pipe', 'Back Row'],
  Block: ['Single', 'Double', 'Triple', 'Soft Block'],
  Set: ['High Ball', 'Quick Set', 'Back Set', 'Dump'],
  Reception: ['Overhand', 'Bump / Underhand'],
};

// Coordinate lookup for Volleyball zones
export function getVolleyballZoneCoords(zoneName?: string, sideHint?: Side) {return zonePosition('volleyball',zoneName,sideHint);}

/**
 * Calculates authentic Volleyball FIVB scoring:
 * - Best of 5 sets
 * - Sets 1–4: 25 points, win by 2
 * - Set 5 (deciding set): 15 points, win by 2
 * Only CONFIRMED events affect the score.
 */
export function calculateVolleyballScore(events: ScoutEvent[]): ScoreState {return replayScore(events,'volleyball').state;}

/**
 * Calculates authentic Volleyball statistics strictly from CONFIRMED events.
 * Computes attack efficiency: (Kills - Attack Errors) / Attack Attempts
 */
export function calculateVolleyballStats(events: ScoutEvent[]): VolleyballStats {
  const confirmed = officialEvents(events).filter(e=>e.sport==='volleyball');

  const ralliesSet = new Set<string>();

  // Serves
  let serveAttemptsA = 0;
  let serveAttemptsB = 0;
  let acesA = 0;
  let acesB = 0;
  let serveErrorsA = 0;
  let serveErrorsB = 0;

  // Receptions
  let receptionAttemptsA = 0;
  let receptionAttemptsB = 0;
  const receptionQualityA = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const receptionQualityB = { 0: 0, 1: 0, 2: 0, 3: 0 };

  // Attacks
  let attackAttemptsA = 0;
  let attackAttemptsB = 0;
  let killsA = 0;
  let killsB = 0;
  let attackErrorsA = 0;
  let attackErrorsB = 0;
  let blockedAttacksA = 0;
  let blockedAttacksB = 0;

  // Blocks & Digs
  let blocksA = 0;
  let blocksB = 0;
  let digsA = 0;
  let digsB = 0;

  for (const ev of confirmed) {
    if (ev.rallyId) ralliesSet.add(ev.rallyId);

    const isA = ev.actorSide === 'A';
    const action = ev.action.toLowerCase();
    const outcome = ev.outcome.toUpperCase();

    // Serve stats
    if (action.includes('serve')) {
      if (isA) {
        serveAttemptsA++;
        if (outcome === 'ACE' || outcome === 'WINNER') acesA++;
        else if (outcome === 'ERROR') serveErrorsA++;
      } else {
        serveAttemptsB++;
        if (outcome === 'ACE' || outcome === 'WINNER') acesB++;
        else if (outcome === 'ERROR') serveErrorsB++;
      }
    }

    // Reception stats
    if (action.includes('reception') || action.includes('receive')) {
      if (isA) {
        receptionAttemptsA++;
        if (ev.receptionQuality !== undefined) {
          receptionQualityA[ev.receptionQuality]++;
        }
      } else {
        receptionAttemptsB++;
        if (ev.receptionQuality !== undefined) {
          receptionQualityB[ev.receptionQuality]++;
        }
      }
    }

    // Attack stats
    if (action.includes('attack') || action.includes('spike')) {
      if (isA) {
        attackAttemptsA++;
        if (outcome === 'KILL' || outcome === 'WINNER') killsA++;
        else if (outcome === 'ERROR') attackErrorsA++;
        else if (outcome === 'BLOCKED') blockedAttacksA++;
      } else {
        attackAttemptsB++;
        if (outcome === 'KILL' || outcome === 'WINNER') killsB++;
        else if (outcome === 'ERROR') attackErrorsB++;
        else if (outcome === 'BLOCKED') blockedAttacksB++;
      }
    }

    // Blocks
    if (action.includes('block')) {
      if (isA) {
        if (outcome === 'KILL' || outcome === 'WINNER') blocksA++;
      } else {
        if (outcome === 'KILL' || outcome === 'WINNER') blocksB++;
      }
    }

    // Digs
    if (action.includes('dig')) {
      if (isA) digsA++;
      else digsB++;
    }
  }

  // Calculate reception averages
  const ratedReceptionsA = Object.values(receptionQualityA).reduce((sum, n) => sum + n, 0);
  const totalScoreA =
    receptionQualityA[1] * 1 + receptionQualityA[2] * 2 + receptionQualityA[3] * 3;
  const avgReceptionQualityA =
    ratedReceptionsA > 0 ? Number((totalScoreA / ratedReceptionsA).toFixed(2)) : 0;

  const ratedReceptionsB = Object.values(receptionQualityB).reduce((sum, n) => sum + n, 0);
  const totalScoreB =
    receptionQualityB[1] * 1 + receptionQualityB[2] * 2 + receptionQualityB[3] * 3;
  const avgReceptionQualityB =
    ratedReceptionsB > 0 ? Number((totalScoreB / ratedReceptionsB).toFixed(2)) : 0;

  // Attack efficiency: (Kills - Errors) / Attempts
  const attackEfficiencyA =
    attackAttemptsA > 0
      ? Number(((killsA - attackErrorsA) / attackAttemptsA).toFixed(3))
      : 0;
  const attackEfficiencyB =
    attackAttemptsB > 0
      ? Number(((killsB - attackErrorsB) / attackAttemptsB).toFixed(3))
      : 0;

  return {
    sport: 'volleyball',
    totalEvents: confirmed.length,
    confirmedEvents: confirmed.length,
    totalRallies: ralliesSet.size,
    serveAttemptsA,
    serveAttemptsB,
    acesA,
    acesB,
    serveErrorsA,
    serveErrorsB,
    receptionAttemptsA,
    receptionAttemptsB,
    receptionQualityA,
    receptionQualityB,
    avgReceptionQualityA,
    avgReceptionQualityB,
    attackAttemptsA,
    attackAttemptsB,
    killsA,
    killsB,
    attackErrorsA,
    attackErrorsB,
    blockedAttacksA,
    blockedAttacksB,
    attackEfficiencyA,
    attackEfficiencyB,
    blocksA,
    blocksB,
    digsA,
    digsB,
  };
}

/**
 * Aggregates Heatmap data for Volleyball.
 * Only events with known zones are placed.
 */
export function aggregateVolleyballHeatmap(
  events: ScoutEvent[],
  filterSide: 'all' | 'A' | 'B' = 'all'
): HeatmapData {
  const confirmed = events.filter((e) => {
    if (e.status !== 'CONFIRMED' || e.recordType==='SCORE_CORRECTION' || validationErrors(e).length) return false;
    if (filterSide === 'all') return true;
    return e.actorSide === filterSide;
  });

  let mappedCount = 0;
  let unmappedCount = 0;

  const originFrequencies: Record<string, number> = {};
  const targetFrequencies: Record<string, number> = {};
  const zoneHits: Record<string, { count: number; side?: Side; x: number; y: number; eventIds:string[] }> = {};
  const shotTrajectories: ShotTrajectory[] = [];

  for (const ev of confirmed) {
    const hasOrigin = Boolean(getVolleyballZoneCoords(ev.originZone,ev.actorSide));
    const hasTarget = Boolean(getVolleyballZoneCoords(ev.targetZone,ev.actorSide==='A'?'B':'A'));

    if (!hasOrigin && !hasTarget) {
      unmappedCount++;
      continue;
    }

    mappedCount++;

    if (hasOrigin && ev.originZone) {
      originFrequencies[ev.originZone] = (originFrequencies[ev.originZone] || 0) + 1;
      const coords = getVolleyballZoneCoords(ev.originZone, ev.actorSide);
      if (coords) {
        if (!zoneHits[`${ev.actorSide}:${ev.originZone}`]) {
          zoneHits[`${ev.actorSide}:${ev.originZone}`] = { count: 0, eventIds:[], side: ev.actorSide, x: coords.x, y: coords.y };
        }
        zoneHits[`${ev.actorSide}:${ev.originZone}`].count++;
        zoneHits[`${ev.actorSide}:${ev.originZone}`].eventIds.push(ev.id);
      }
    }

    if (hasTarget && ev.targetZone) {
      targetFrequencies[ev.targetZone] = (targetFrequencies[ev.targetZone] || 0) + 1;
      const opponentSide: Side = ev.actorSide === 'A' ? 'B' : 'A';
      const coords = getVolleyballZoneCoords(ev.targetZone, opponentSide);
      if (coords) {
        const key = `target-${opponentSide}:${ev.targetZone}`;
        if (!zoneHits[key]) {
          zoneHits[key] = { count: 0, eventIds:[], side: opponentSide, x: coords.x, y: coords.y };
        }
        zoneHits[key].count++;
        zoneHits[key].eventIds.push(ev.id);
      }
    }

    if (hasOrigin && hasTarget && ev.originZone && ev.targetZone) {
      const fromCoords = getVolleyballZoneCoords(ev.originZone, ev.actorSide);
      const toCoords = getVolleyballZoneCoords(ev.targetZone, ev.actorSide === 'A' ? 'B' : 'A');
      if (fromCoords && toCoords) {
        shotTrajectories.push({
          id: ev.id,
          fromZone: ev.originZone,
          toZone: ev.targetZone,
          side: ev.actorSide!,
          action: ev.action,
          isWinner: ev.outcome === 'KILL' || ev.outcome === 'ACE' || ev.outcome === 'WINNER',
          fromX: fromCoords.x,
          fromY: fromCoords.y,
          toX: toCoords.x,
          toY: toCoords.y,
        });
      }
    }
  }

  const maxHits = Math.max(...Object.values(zoneHits).map((z) => z.count), 1);
  const hotspots: HeatmapHotspot[] = Object.entries(zoneHits).map(([zone, data]) => ({
    zone,
    count: data.count,
    eventIds: data.eventIds,
    side: data.side,
    x: data.x,
    y: data.y,
    intensity: Math.min(1, data.count / maxHits),
  }));

  return {
    totalEvents: confirmed.length,
    mappedEvents: mappedCount,
    unmappedEvents: unmappedCount,
    originFrequencies,
    targetFrequencies,
    hotspots,
    shotTrajectories,
  };
}

/**
 * Natural voice parser for Volleyball.
 * Extracts player jersey numbers, rotation zones 1-6, reception quality, attack types.
 * Leaves unknown values undefined.
 */
export function parseVolleyballNaturalText(text:string,currentScore:ScoreState,nameA:string,nameB:string):Partial<ScoutEvent>{return parseSequence(text,'volleyball',nameA,nameB)[0];}

export const VolleyballDefinition: SportDefinition = {
  id: 'volleyball',
  name: 'Volleyball',
  nameTh: 'วอลเลย์บอล',
  defaultFormat: 'Best of 5 (25 pts)',
  defaultActions: VOLLEYBALL_ACTIONS,
  subtypes: VOLLEYBALL_SUBTYPES,
  zones: VOLLEYBALL_ZONES,
  scoringRules: {
    setsToWin: 3,
    pointsPerSet: (setNumber) => (setNumber === 5 ? 15 : 25),
    winByTwo: true,
  },
  calculateScore: calculateVolleyballScore,
  calculateStats: calculateVolleyballStats,
  aggregateHeatmap: aggregateVolleyballHeatmap,
  parseNaturalText: parseVolleyballNaturalText,
};
