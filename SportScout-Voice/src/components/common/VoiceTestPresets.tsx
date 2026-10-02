import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { SAMPLE_PRESETS } from '../../services/mockVoiceEngine';
import { useScout } from '../../stores/ScoutContext';
import { Sparkles, Send, Mic, Play, ChevronDown, ChevronUp } from 'lucide-react';

export const VoiceTestPresets: React.FC = () => {
  const {t}=useLocale();

  const { currentSession, processSamplePhrase, voiceState } = useScout();
  const [customText, setCustomText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const presetsForSport = SAMPLE_PRESETS.filter(
    (p) => p.sport === currentSession.sport
  );

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || voiceState === 'transcribing' || voiceState === 'understanding')
      return;
    processSamplePhrase(customText.trim());
    setCustomText('');
  };

  return (
    <div className="w-full bg-[#11141a] border border-[#202633] rounded-2xl p-3.5 select-none transition-all">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
          <span className="text-xs font-bold text-gray-200">
            {t("Natural Voice Test Phrases & Freeform Input")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="text-[11px] text-[#22c55e] hidden sm:inline">
            {t("Quick simulate")}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#1e232e] space-y-3">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              {t("Tap a realistic natural spoken observation:")}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetsForSport.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => processSamplePhrase(sample)}
                  disabled={voiceState === 'transcribing' || voiceState === 'understanding'}
                  className="p-2.5 rounded-xl bg-[#161a22] hover:bg-[#1d232e] border border-[#242b38] hover:border-[#384357] text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-white leading-tight">
                      &ldquo;{sample.transcript}&rdquo;
                    </span>
                    <Play className="w-3 h-3 text-[#22c55e] shrink-0 mt-0.5" />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {sample.explanation}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Freeform input */}
          <form onSubmit={handleSendCustom} className="pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t("Type or paste any natural phrase (e.g. A หยอดหน้าซ้ายได้หนึ่ง)...")}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0c0e12] border border-[#232938] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
              />
              <button
                type="submit"
                disabled={!customText.trim() || voiceState === 'transcribing'}
                className="px-3.5 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>{t("Simulate")}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
