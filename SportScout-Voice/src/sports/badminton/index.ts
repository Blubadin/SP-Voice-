import {replayScore} from '../../domain/scoreReplay';
import {scoreReplayOrder} from '../../domain/scoreOrder';
import {officialEvents, validationErrors, zones as canonicalZones} from '../../domain/validation';
import {parseSequence} from '../../domain/localParser';
import {zonePosition} from '../../domain/geometry';
import {
  BadmintonStats,
  HeatmapData,
  HeatmapHotspot,
  MatchSegment,
  ScoreState,
  ScoutEvent,
  ShotTrajectory,
  Side,
  SpatialZone,
  SportDefinition,
} from '../../domain/types';

// 9 Court Zones for Badminton
export const BADMINTON_ZONES: SpatialZone[] = canonicalZones.badminton.map(id=>{const p=zonePosition('badminton',id,'A')!;return {id,name:id,x:p.x/1340,y:p.y/610,courtSide:'A'};});

export const BADMINTON_ACTIONS = [
  'Serve',
  'Return',
  'Clear',
  'Drop',
  'Smash',
  'Drive',
  'Lift',
  'Net Shot',
  'Net Kill',
  'Block',
];

export const BADMINTON_SUBTYPES: Record<string, string[]> = {
  Serve: ['Short', 'Flick', 'Drive', 'High'],
  Smash: ['Straight', 'Cross', 'Half Smash', 'Jump Smash', 'Slice'],
  Drop: ['Slow Drop', 'Fast Drop', 'Reverse Slice', 'Cross'],
  Clear: ['Attacking Clear', 'Defensive High Clear'],
  Drive: ['Flat Drive', 'Push'],
  'Net Shot': ['Tumbling', 'Hairpin', 'Spinning'],
};

// Coordinate lookup helper
export function getBadmintonZoneCoords(zoneName?: string, sideHint?: Side) {return zonePosition('badminton',zoneName,sideHint);}

/**
 * Calculates authentic Badminton scoring:
 * - Best of 3 games
 * - 21 points per game
 * - Win by 2
 * - Cap at 30 points
 * Only CONFIRMED events affect the score.
 */
export function calculateBadmintonScore(events: ScoutEvent[]): ScoreState {return replayScore(events,'badminton').state;}

/**
 * Calculates authentic Badminton statistics strictly from CONFIRMED events.
 */
export function calculateBadmintonStats(events: ScoutEvent[]): BadmintonStats {
  const confirmed = officialEvents(events).filter(e=>e.sport==='badminton');

  const ralliesSet = new Set<string>();
  let winnersA = 0;
  let winnersB = 0;
  let errorsA = 0;
  let errorsB = 0;

  const skillCounts: Record<string, { attempts: number; winners: number; errors: number }> = {};
  for (const action of BADMINTON_ACTIONS) {
    skillCounts[action] = { attempts: 0, winners: 0, errors: 0 };
  }

  const originDistribution: Record<string, number> = {};
  const targetDistribution: Record<string, number> = {};

  for (const ev of confirmed) {
    if (ev.rallyId) ralliesSet.add(ev.rallyId);

    const isA = ev.actorSide === 'A';
    const isWinner = ev.outcome === 'WINNER';
    const isError = ev.outcome === 'ERROR';

    if (isWinner) {
      if (isA) winnersA++;
      else winnersB++;
    }
    if (isError) {
      if (isA) errorsA++;
      else errorsB++;
    }

    // Match action in skill breakdown
    const actionKey = BADMINTON_ACTIONS.find(
      (a) => a.toLowerCase() === ev.action.toLowerCase()
    ) || ev.action;

    if (!skillCounts[actionKey]) {
      skillCounts[actionKey] = { attempts: 0, winners: 0, errors: 0 };
    }
    skillCounts[actionKey].attempts++;
    if (isWinner) skillCounts[actionKey].winners++;
    if (isError) skillCounts[actionKey].errors++;

    // Origin Zone (strictly if known)
    if (ev.originZone && ev.originZone.trim()) {
      originDistribution[ev.originZone] = (originDistribution[ev.originZone] || 0) + 1;
    }
    // Target Zone (strictly if known)
    if (ev.targetZone && ev.targetZone.trim()) {
      targetDistribution[ev.targetZone] = (targetDistribution[ev.targetZone] || 0) + 1;
    }
  }

  const totalConfirmed = confirmed.length;
  const totalRallies = ralliesSet.size;

  const skillBreakdown = Object.entries(skillCounts)
    .filter(([_, data]) => data.attempts > 0 || BADMINTON_ACTIONS.includes(_))
    .map(([name, data]) => {
      const zMatch = BADMINTON_ZONES.find((z) => z.name === name);
      return {
        name,
        nameTh: zMatch?.nameTh || name,
        attempts: data.attempts,
        winners: data.winners,
        errors: data.errors,
        frequencyPercent: totalConfirmed > 0 ? Math.round((data.attempts / totalConfirmed) * 100) : 0,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);

  return {
    sport: 'badminton',
    attempts:confirmed.length,
    inPlay:confirmed.filter(e=>e.outcome==='IN_PLAY').length,
    shotDistribution:Object.fromEntries(Object.entries(skillCounts).map(([action,count])=>[action,count.attempts])),
    totalEvents: confirmed.length,
    confirmedEvents: totalConfirmed,
    totalRallies,
    winnersA,
    winnersB,
    errorsA,
    errorsB,
    skillBreakdown,
    originDistribution,
    targetDistribution,
    avgRallyLength: totalRallies > 0 ? Number((totalConfirmed / totalRallies).toFixed(1)) : 0,
  };
}

/**
 * Aggregates Heatmap data from actual confirmed events.
 * Events with NO known zone are NOT placed on the heatmap.
 */
export function aggregateBadmintonHeatmap(
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
    const hasOrigin = Boolean(getBadmintonZoneCoords(ev.originZone,ev.actorSide));
    const hasTarget = Boolean(getBadmintonZoneCoords(ev.targetZone,ev.actorSide==='A'?'B':'A'));

    if (!hasOrigin && !hasTarget) {
      unmappedCount++;
      continue;
    }

    mappedCount++;

    if (hasOrigin && ev.originZone) {
      originFrequencies[ev.originZone] = (originFrequencies[ev.originZone] || 0) + 1;
      const coords = getBadmintonZoneCoords(ev.originZone, ev.actorSide);
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
      const coords = getBadmintonZoneCoords(ev.targetZone, opponentSide);
      if (coords) {
        const key = `target-${opponentSide}:${ev.targetZone}`;
        if (!zoneHits[key]) {
          zoneHits[key] = { count: 0, eventIds:[], side: opponentSide, x: coords.x, y: coords.y };
        }
        zoneHits[key].count++;
        zoneHits[key].eventIds.push(ev.id);
      }
    }

    // Trajectory vector if both zones are known
    if (hasOrigin && hasTarget && ev.originZone && ev.targetZone) {
      const fromCoords = getBadmintonZoneCoords(ev.originZone, ev.actorSide);
      const toCoords = getBadmintonZoneCoords(ev.targetZone, ev.actorSide === 'A' ? 'B' : 'A');
      if (fromCoords && toCoords) {
        shotTrajectories.push({
          id: ev.id,
          fromZone: ev.originZone,
          toZone: ev.targetZone,
          side: ev.actorSide!,
          action: ev.action,
          isWinner: ev.outcome === 'WINNER',
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
 * Natural voice text parser for Badminton.
 * Never guesses unknown fields (leaves undefined if not present in transcript).
 */
export function parseBadmintonNaturalText(text:string,currentScore:ScoreState,nameA:string,nameB:string):Partial<ScoutEvent>{return parseSequence(text,'badminton',nameA,nameB)[0];}

export const BadmintonDefinition: SportDefinition = {
  id: 'badminton',
  name: 'Badminton',
  nameTh: 'แบดมินตัน',
  defaultFormat: 'Best of 3 (21 pts)',
  defaultActions: BADMINTON_ACTIONS,
  subtypes: BADMINTON_SUBTYPES,
  zones: BADMINTON_ZONES,
  scoringRules: {
    setsToWin: 2,
    pointsPerSet: () => 21,
    winByTwo: true,
    pointCap: 30,
  },
  calculateScore: calculateBadmintonScore,
  calculateStats: calculateBadmintonStats,
  aggregateHeatmap: aggregateBadmintonHeatmap,
  parseNaturalText: parseBadmintonNaturalText,
};
