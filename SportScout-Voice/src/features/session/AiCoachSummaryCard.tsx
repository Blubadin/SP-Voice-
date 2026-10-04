import {apiFetch} from '../../services/apiClient';
import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { useScout } from '../../stores/ScoutContext';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  TrendingUp,
  AlertOctagon,
  Target,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Dumbbell,
  Shield,
  Layers,
} from 'lucide-react';

interface CoachSummaryData {
  executiveSummary: string;
  keyStrengthsA: string[];
  keyStrengthsB: string[];
  tacticalVulnerabilitiesA: string[];
  tacticalVulnerabilitiesB: string[];
  turningPoints: string[];
  actionableDrills: string[];
  dataCompleteness: string;
  summaryTh: string;
  summaryEn: string;
}

export const AiCoachSummaryCard: React.FC = () => {
  const {t}=useLocale();

  const { currentSession, stats, settings } = useScout();
  const [summaryProvider,setSummaryProvider]=useState('');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<CoachSummaryData | null>(null);
  const [language, setLanguage] = useState<'th' | 'en'>(settings.language === 'en' ? 'en' : 'th');
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const matchScore = `${t(currentSession.playerA.name)} ${currentSession.playerA.score} - ${currentSession.playerB.score} ${t(currentSession.playerB.name)} (Sets: ${currentSession.setsA}-${currentSession.setsB})`;

      const res = await apiFetch('/api/coach-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: stats,
          sport: currentSession.sport,
          playerA: currentSession.playerA.name,
          playerB: currentSession.playerB.name,
          matchScore,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setSummaryData(json.data);
        setSummaryProvider(json.provider);
      } else {
        throw new Error(json.error || 'Failed to generate coach summary');
      }
    } catch (err: any) {
      console.error('[AiCoachSummary] Error:', err);
      setError(err.message || 'Unable to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#13161c] border border-[#212631] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f242e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {t("AI Coach Tactical Summary")}</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#182a1f] text-[#4ade80] text-[10px] font-mono border border-[#22c55e]/30">
                {summaryProvider==='GEMINI'?t('AI analysis'):t('Recorded statistics')}</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {t("Cloud AI summary is not connected. Confirmed statistics remain available.")}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {summaryData && (
            <div className="flex items-center bg-[#191d25] p-0.5 rounded-lg border border-[#262c38] text-xs font-semibold">
              <button
                onClick={() => setLanguage('th')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  language === 'th' ? 'bg-[#222834] text-[#4ade80]' : 'text-gray-400'
                }`}
              >
                TH
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  language === 'en' ? 'bg-[#222834] text-[#4ade80]' : 'text-gray-400'
                }`}
              >
                EN
              </button>
            </div>
          )}

          <button
            onClick={generateSummary}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#173822] hover:bg-[#1f4a2d] text-[#4ade80] border border-[#22c55e]/40 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t("Analyzing Metrics...")}</span>
              </>
            ) : summaryData ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t("Re-Analyze")}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("Generate Coach Summary")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Empty State before generation */}
      {!summaryData && !loading && (
        <div className="py-6 text-center space-y-2">
          <Bot className="w-10 h-10 text-gray-600 mx-auto" />
          <h4 className="text-xs font-bold text-gray-300">
            {t("Coach Tactical Insights Ready to Generate")}</h4>
          <p className="text-[11px] text-gray-500 max-w-md mx-auto">
            {t("Click \"Generate Coach Summary\" to interpret confirmed match events, conversion ratios, attack efficiency, and tactical tendencies through natural coaching language.")}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse py-4">
          <div className="h-4 bg-[#1f2533] rounded w-3/4" />
          <div className="h-4 bg-[#1f2533] rounded w-full" />
          <div className="h-4 bg-[#1f2533] rounded w-5/6" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-20 bg-[#1f2533] rounded-xl" />
            <div className="h-20 bg-[#1f2533] rounded-xl" />
          </div>
        </div>
      )}

      {/* Generated Coach Summary Content */}
      {summaryData && !loading && (
        <div className="space-y-4">
          {/* Data Completeness Notice */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#171b23] border border-[#232936]">
            <span className="text-gray-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              {t("Sample Size Reliability:")}</span>
            <span className="font-mono text-gray-200 font-semibold">
              {summaryData.dataCompleteness}
            </span>
          </div>

          {/* Executive Summary */}
          <div className="p-3.5 rounded-xl bg-[#161c28] border border-blue-500/20 text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
            {language === 'th' ? summaryData.summaryTh : summaryData.summaryEn}
          </div>

          {/* Key Strengths & Vulnerabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Side A Analysis */}
            <div className="p-3.5 rounded-xl bg-[#141b2b] border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#212c44]">
                <span className="font-bold text-blue-400 uppercase tracking-wide">
                  {t(currentSession.playerA.name)}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{t("Tactical Profile")}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  {t("Key Strengths:")}</span>
                <ul className="space-y-1 text-gray-300">
                  {summaryData.keyStrengthsA.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#22c55e] font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-1.5 border-t border-[#212c44]">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  {t("Areas to Address:")}</span>
                <ul className="space-y-1 text-gray-300">
                  {summaryData.tacticalVulnerabilitiesA.map((vuln, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{vuln}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Side B Analysis */}
            <div className="p-3.5 rounded-xl bg-[#281519] border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#442125]">
                <span className="font-bold text-red-400 uppercase tracking-wide">
                  {t(currentSession.playerB.name)}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{t("Tactical Profile")}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  {t("Key Strengths:")}</span>
                <ul className="space-y-1 text-gray-300">
                  {summaryData.keyStrengthsB.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#22c55e] font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-1.5 border-t border-[#442125]">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  {t("Areas to Address:")}</span>
                <ul className="space-y-1 text-gray-300">
                  {summaryData.tacticalVulnerabilitiesB.map((vuln, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{vuln}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Turning Points & Recommended Drills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#171b23] border border-[#232936] space-y-2">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                {t("Match Turning Points")}</span>
              <ul className="space-y-1.5 text-gray-300">
                {summaryData.turningPoints.map((tp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold">»</span>
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#171b23] border border-[#232936] space-y-2">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Dumbbell className="w-3.5 h-3.5 text-[#22c55e]" />
                {t("Actionable Training Drills")}</span>
              <ul className="space-y-1.5 text-gray-300">
                {summaryData.actionableDrills.map((drill, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#22c55e] font-bold">1.</span>
                    <span>{drill}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
