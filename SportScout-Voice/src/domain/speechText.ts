// Thai ASR can insert spaces inside a word. Preserve Latin word boundaries,
// negation, and unknown text; never guess an action from approximate spelling.
export function normalizeSpeechText(raw:string):string {
  return raw.normalize('NFC')
    .replace(/(?<=[\u0E00-\u0E7F])\s+(?=[\u0E00-\u0E7F])/gu,'')
    .replace(/\+\s*1\s*points?\b/gi,'+1')
    .trim();
}
