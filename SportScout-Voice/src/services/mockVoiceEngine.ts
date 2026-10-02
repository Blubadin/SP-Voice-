import { ParsedEvent, PlayerSide, SportType, VoicePresetSample } from '../types/scout';
import { getSportDefinition } from '../sports/registry';
import { ScoreState } from '../domain/types';

export const SAMPLE_PRESETS: VoicePresetSample[] = [
  // Badminton Presets
  {
    id: 'th-badminton-correction',
    sport: 'badminton',
    language: 'th',
    label: 'คำพูดธรรมชาติพร้อมการแก้คำ (Natural with self-correction)',
    transcript: 'A อยู่ขวาหน้า เอ้ยไม่ใช่ขวาหลัง แล้วหยอดไปหน้าซ้าย ได้หนึ่ง',
    explanation: 'ระบบแยกแยะการพูดแก้คำ "ขวาหน้า -> ขวาหลัง" และดึงช็อตหยอดได้แต้ม',
    parsed: {
      player: 'A',
      action: 'Drop',
      originZone: 'Rear Right',
      targetZone: 'Front Left',
      result: 'winner',
      pointDelta: 1,
    },
  },
  {
    id: 'th-badminton-short',
    sport: 'badminton',
    language: 'th',
    label: 'คำพูดสั้นกระชับ (Short command)',
    transcript: 'A หยอดหน้าซ้ายได้หนึ่ง',
    explanation: 'ระบุผู้เล่น A หยอดไปหน้าซ้าย จังหวะวินเนอร์',
    parsed: {
      player: 'A',
      action: 'Drop',
      targetZone: 'Front Left',
      result: 'winner',
      pointDelta: 1,
    },
  },
  {
    id: 'th-badminton-smash',
    sport: 'badminton',
    language: 'th',
    label: 'ตบจากแดนหลัง (Rear smash winner)',
    transcript: 'B ตบหนักจากขวาหลัง พุ่งลงหน้าซ้าย ได้แต้ม',
    explanation: 'ผู้เล่น B ตบวินเนอร์จากขวาหลังลงหน้าซ้าย',
    parsed: {
      player: 'B',
      action: 'Smash',
      originZone: 'Rear Right',
      targetZone: 'Front Left',
      result: 'winner',
      pointDelta: 1,
    },
  },
  {
    id: 'th-badminton-serve',
    sport: 'badminton',
    language: 'th',
    label: 'เสิร์ฟสั้นคู่แข่งติดเน็ต (Serve & error)',
    transcript: 'A เสิร์ฟสั้นไปหน้าขวา B รับติดเน็ต ได้หนึ่ง',
    explanation: 'ผู้เล่น A ได้แต้มจากการเสิร์ฟสั้น B เล่นพลาด',
    parsed: {
      player: 'A',
      action: 'Serve',
      originZone: 'Front Right',
      targetZone: 'Front Right',
      result: 'winner',
      pointDelta: 1,
    },
  },

  // Volleyball Presets
  {
    id: 'th-volleyball-ace',
    sport: 'volleyball',
    language: 'th',
    label: 'วอลเลย์บอล: เสิร์ฟเอซลงโซน 1',
    transcript: 'ทีม A เบอร์ 7 เสิร์ฟจัมพ์โฟลตลงโซน 1 ได้เอซ',
    explanation: 'ทีม A เบอร์ 7 เสิร์ฟเอซลง Zone 1 รับไม่ทัน',
    parsed: {
      player: 'A',
      action: 'Serve',
      originZone: 'Zone 1',
      targetZone: 'Zone 1',
      result: 'ace',
      pointDelta: 1,
    },
  },
  {
    id: 'th-volleyball-block',
    sport: 'volleyball',
    language: 'th',
    label: 'วอลเลย์บอล: บล็อกสำเร็จที่โซน 3',
    transcript: 'ทีม B เบอร์ 3 บล็อกสำเร็จที่โซน 3 ได้หนึ่งแต้ม',
    explanation: 'ทีม B เบอร์ 3 บล็อกแต้มตรงกลางเน็ต Zone 3',
    parsed: {
      player: 'B',
      action: 'Block',
      originZone: 'Zone 3',
      targetZone: 'Zone 3',
      result: 'winner',
      pointDelta: 1,
    },
  },
  {
    id: 'th-volleyball-quick',
    sport: 'volleyball',
    language: 'th',
    label: 'วอลเลย์บอล: บอลเร็วกลางเน็ต ได้แต้ม',
    transcript: 'ทีม A เบอร์ 11 บอลเร็วกลางเน็ตลงโซน 5 ได้แต้ม',
    explanation: 'ทีม A เบอร์ 11 โจมตีเร็วกลางคอร์ด Zone 3 -> Zone 5',
    parsed: {
      player: 'A',
      action: 'Attack',
      originZone: 'Zone 3',
      targetZone: 'Zone 5',
      result: 'winner',
      pointDelta: 1,
    },
  },
  {
    id: 'en-badminton-smash',
    sport: 'badminton',
    language: 'en',
    label: 'English: Rear court smash winner',
    transcript: 'Player A cross smash from rear right to front left, winner point',
    explanation: 'Clean rear-court smash to the deep front corner.',
    parsed: {
      player: 'A',
      action: 'Smash',
      originZone: 'Rear Right',
      targetZone: 'Front Left',
      result: 'winner',
      pointDelta: 1,
    },
  },
  {
    id: 'en-volleyball-spike',
    sport: 'volleyball',
    language: 'en',
    label: 'English: Wing spike zone 4',
    transcript: 'Team A #18 spike from zone 4 down the line, point',
    explanation: 'Wing spiker winner into opposing back court.',
    parsed: {
      player: 'A',
      action: 'Attack',
      originZone: 'Zone 4',
      targetZone: 'Zone 5',
      result: 'winner',
      pointDelta: 1,
    },
  },
];

/**
 * Natural text parser delegating to domain-specific sport definitions.
 * Never guesses unknown values.
 */
export function parseNaturalVoiceText(
  text: string,
  sport: SportType,
  currentScoreState: ScoreState,
  nameA = 'Side A',
  nameB = 'Side B',
  sessionId = 'session-current'
): ParsedEvent {
  const sportDef = getSportDefinition(sport);
  const partial = sportDef.parseNaturalText(text, currentScoreState, nameA, nameB);

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const actorSide: PlayerSide | undefined = partial.actorSide;
  const pointDelta = partial.scoreImpact?.points || 0;

  const scoreAfterA =
    partial.scoreImpact?.sideAwarded === 'A'
      ? currentScoreState.scoreA + pointDelta
      : currentScoreState.scoreA;

  const scoreAfterB =
    partial.scoreImpact?.sideAwarded === 'B'
      ? currentScoreState.scoreB + pointDelta
      : currentScoreState.scoreB;

  const outcomeUpper = (partial.outcome || 'IN_PLAY').toUpperCase();
  const result: 'winner' | 'error' | 'rally' | 'ace' =
    outcomeUpper === 'ACE'
      ? 'ace'
      : outcomeUpper === 'WINNER' || outcomeUpper === 'KILL'
      ? 'winner'
      : outcomeUpper === 'ERROR' || outcomeUpper === 'BLOCKED'
      ? 'error'
      : 'rally';

  return {
    id: crypto.randomUUID(),
    sessionId,
    rallyId: `rally-${Date.now()}`,
    sport,
    timestamp: timeStr,
    actorSide,
    actorPlayer: partial.actorPlayer || {
      name: actorSide === 'A' ? nameA : nameB,
    },
    player: actorSide,
    playerName: actorSide === 'A' ? nameA : nameB,
    action: partial.action || '',
    subtype: partial.subtype,
    originZone: partial.originZone,
    targetZone: partial.targetZone,
    outcome: partial.outcome || 'IN_PLAY',
    errorType: partial.errorType,
    receptionQuality: partial.receptionQuality,
    result,
    pointDelta,
    scoreImpact: partial.scoreImpact || { points: 0 },
    scoreAfterA,
    scoreAfterB,
    rawTranscript: text,
    source: 'voice',
    status: 'REVIEW_REQUIRED',
    needsReview: true,
    segmentIndex: currentScoreState.currentSet,
  };
}

let feedbackContext:AudioContext|null=null;
export function prepareAudioFeedback(){
 if(typeof window==='undefined')return;
 try{const Ctx=window.AudioContext||(window as any).webkitAudioContext;if(!Ctx)return;
 if(!feedbackContext||feedbackContext.state==='closed')feedbackContext=new Ctx();
 if(feedbackContext.state==='suspended')void feedbackContext.resume().catch(()=>{});
 }catch{}
}
export function playAudioFeedback(
  type: 'beep' | 'confirm' | 'ding' | 'review' | 'error' | 'undo'
) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    prepareAudioFeedback();
    const ctx = feedbackContext;
    if(!ctx)return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'beep') {
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'confirm' || type === 'ding') {
      // Clean athletic high ding
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06); // A6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'review') {
      // Distinct subtle double notification cue (two mellow tones)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.setValueAtTime(0.02, now + 0.09);
      gain.gain.setValueAtTime(0.09, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'error') {
      // Subtle low warning cue
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'undo') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
}
