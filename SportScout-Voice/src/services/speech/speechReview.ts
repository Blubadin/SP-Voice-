import type {SpeechEvidence} from './ContinuousSpeechProvider';
// Provider confidence is evidence, never a calibrated accuracy percentage.
export function speechNeedsReview(evidence?:SpeechEvidence):boolean {
  return Boolean(evidence?.gap || evidence?.provisional || typeof evidence?.confidence==='number'&&evidence.confidence>0&&evidence.confidence<0.65 || evidence?.words?.some(w=>typeof w.confidence==='number' && w.confidence<0.65));
}
