import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { useScout } from '../../stores/ScoutContext';
import {
  ListOrdered,
  BarChart3,
  Flame,
  Award,
  AlertTriangle,
  FileText,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { EventsTimeline } from '../events/EventsTimeline';
import { StatsScreen } from '../stats/StatsScreen';
import { CourtHeatmapPanel } from '../../components/court/CourtHeatmapPanel';
import { ReviewQueue } from '../events/ReviewQueue';
import { AiCoachSummaryCard } from './AiCoachSummaryCard';
import { BadmintonStats, VolleyballStats } from '../../domain/types';

export const SessionReviewScreen: React.FC = () => {
  const {t}=useLocale();

  const {
    currentSession,
    stats,
    scoreState,
    exportSessionJson,
    exportSessionCsv,
    setEditingEvent,
    deleteEvent,
    skills,
  } = useScout();

  const [activeReviewTab, setActiveReviewTab] = useState<
    'timeline' | 'stats' | 'heatmap' | 'skills' | 'review' | 'transcript' | 'export'
  >('timeline');

  const [copiedJson, setCopiedJson] = useState(false);

  const isBadminton = currentSession.sport === 'badminton';
  const badStats = isBadminton ? (stats as BadmintonStats) : null;
  const vbStats = !isBadminton ? (stats as VolleyballStats) : null;

  // Pending reviews count
  const pendingReviewsCount = currentSession.events.filter(
    (e) =>
      e.status === 'REVIEW_REQUIRED' ||
      e.needsReview === true ||
      (e as any).status === 'review_required'
  ).length;

  const handleCopyJson = () => {
    const payload = {
      schemaVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      sport: currentSession.sport,
      session: {
        id: currentSession.id,
        title: currentSession.title,
        date: currentSession.date,
        format: currentSession.format,
        currentSet: currentSession.currentSet,
      },
      participants: {
        playerA: currentSession.playerA,
        playerB: currentSession.playerB,
      },
      score: scoreState,
      stats,
      events: currentSession.events,
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-20 select-none">
      {/* 1. Header Match Summary Banner (e.g. A vs B | 21–17 | 42 Events | 18 Rallies) */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              {t("Official Match Session Summary")}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1b2230] text-sky-300 font-mono text-[10px]">
              {isBadminton ? t("Badminton BWF") : t("Volleyball FIVB")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportSessionJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191e27] hover:bg-[#202733] border border-[#283244] text-xs font-semibold text-gray-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{t("Export JSON")}</span>
            </button>
            <button
              onClick={exportSessionCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191e27] hover:bg-[#202733] border border-[#283244] text-xs font-semibold text-gray-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
              <span>{t("Export CSV")}</span>
            </button>
          </div>
        </div>

        {/* Big Match Score Display */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#161a23] border border-[#232a37]">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right">
              <h2 className="text-base sm:text-lg font-black text-blue-400 truncate max-w-[150px] sm:max-w-[200px]">
                {t(currentSession.playerA.name)}
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                {t("Sets:")}{currentSession.setsA}
              </span>
            </div>

            <div className="px-4 py-2 rounded-xl bg-[#0f1217] border border-white/10 text-center font-mono">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                {currentSession.playerA.score} – {currentSession.playerB.score}
              </div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">
                {isBadminton ? `Game ${currentSession.currentSet}` : `Set ${currentSession.currentSet}`}
              </span>
            </div>

            <div className="text-left">
              <h2 className="text-base sm:text-lg font-black text-red-400 truncate max-w-[150px] sm:max-w-[200px]">
                {t(currentSession.playerB.name)}
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                {t("Sets:")}{currentSession.setsB}
              </span>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#1a202c] border border-[#273244] text-center min-w-[70px]">
              <span className="text-[10px] text-gray-400 uppercase font-sans block">{t("Events")}</span>
              <span className="text-sm sm:text-base font-bold text-white">
                {currentSession.events.length}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-[#1a202c] border border-[#273244] text-center min-w-[70px]">
              <span className="text-[10px] text-gray-400 uppercase font-sans block">{t("Rallies")}</span>
              <span className="text-sm sm:text-base font-bold text-[#22c55e]">
                {stats.totalRallies}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-[#1a202c] border border-[#273244] text-center min-w-[70px]">
              <span className="text-[10px] text-gray-400 uppercase font-sans block">
                {isBadminton ? t("Winners") : t("Kills")}
              </span>
              <span className="text-sm sm:text-base font-bold text-sky-400">
                {isBadminton && badStats
                  ? badStats.winnersA + badStats.winnersB
                  : vbStats
                  ? vbStats.killsA + vbStats.killsB
                  : 0}
              </span>
            </div>
          </div>
        </div>

        {/* 7 Review Sub-Tabs Bar: Timeline | Stats | Heatmap | Skills | Review | Transcript | Export */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#161a22] border border-[#222936] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveReviewTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'timeline'
                ? 'bg-[#222938] text-white shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-gray-400" />
            <span>{t("Timeline")}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1e2738] text-sky-300 font-mono">
              {currentSession.events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveReviewTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'stats'
                ? 'bg-[#222938] text-white shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span>{t("Stats")}</span>
          </button>

          <button
            onClick={() => setActiveReviewTab('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'heatmap'
                ? 'bg-[#222938] text-[#4ade80] shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("Heatmap")}</span>
          </button>

          <button
            onClick={() => setActiveReviewTab('skills')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'skills'
                ? 'bg-[#222938] text-white shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <span>{t("Skills")}</span>
          </button>

          <button
            onClick={() => setActiveReviewTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'review'
                ? 'bg-[#222938] text-amber-300 shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("Review")}</span>
            {pendingReviewsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                {pendingReviewsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveReviewTab('transcript')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'transcript'
                ? 'bg-[#222938] text-white shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>{t("Transcript")}</span>
          </button>

          <button
            onClick={() => setActiveReviewTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeReviewTab === 'export'
                ? 'bg-[#222938] text-white shadow-sm border border-white/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>{t("Export")}</span>
          </button>
        </div>
      </div>

      {/* 2. Optional Post-Session AI Coach Summary Card (Strict Deterministic Pipeline) */}
      <AiCoachSummaryCard />

      {/* 3. Sub-Tab Content */}
      <div className="pt-1">
        {/* Tab 1: Timeline */}
        {activeReviewTab === 'timeline' && (
          <EventsTimeline
            events={currentSession.events}
            playerAName={t(currentSession.playerA.name)}
            playerBName={t(currentSession.playerB.name)}
            onEditEvent={(ev) => setEditingEvent(ev)}
            onDeleteEvent={deleteEvent}
          />
        )}

        {/* Tab 2: Stats */}
        {activeReviewTab === 'stats' && <StatsScreen />}

        {/* Tab 3: Heatmap */}
        {activeReviewTab === 'heatmap' && (
          <CourtHeatmapPanel
            sport={currentSession.sport}
            events={currentSession.events}
          />
        )}

        {/* Tab 4: Skills Breakdown */}
        {activeReviewTab === 'skills' && (
          <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242e]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-400" />
                  {t("Skill Execution & Occurrence Distribution")}</h3>
                <p className="text-xs text-gray-400">
                  {t("Total frequency of canonical actions identified during this session")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skills
                .filter((s) => s.sport === currentSession.sport && s.enabled)
                .map((sk) => {
                  const matchCount = currentSession.events.filter(e=>e.status==='CONFIRMED').filter(
                    (e) => e.action.toLowerCase() === sk.name.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={sk.id}
                      className="p-3 rounded-xl bg-[#171b23] border border-[#232936] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-200">
                          {t(sk.name)}
                        </span>
                        <span className="text-[11px] text-gray-400 font-sans">
                          {sk.nameTh}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-500">{t("In this match:")}</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {matchCount}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">
                        {t("Aliases:")}{sk.aliases.slice(0, 3).join(', ')}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab 5: Review Queue */}
        {activeReviewTab === 'review' && (
          <ReviewQueue onEditEvent={(ev) => setEditingEvent(ev)} />
        )}

        {/* Tab 6: Transcript Log */}
        {activeReviewTab === 'transcript' && (
          <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242e]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  {t("Full Spoken Utterance Transcript Log")}</h3>
                <p className="text-xs text-gray-400">
                  {t("Preserved raw spoken audio inputs for auditing and debugging")}</p>
              </div>
              <span className="font-mono text-xs text-gray-500">
                {currentSession.events.length} {t("Transcripts")}</span>
            </div>

            {currentSession.events.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                {t("No spoken utterances recorded in this session yet.")}</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {currentSession.events.map((ev, i) => (
                  <div
                    key={ev.id || i}
                    className="p-3 rounded-xl bg-[#171b23] border border-[#232936] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span className="font-mono text-gray-500">
                        #{currentSession.events.length - i} · {ev.timestamp || 'Recorded'}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded font-bold font-mono text-[10px] ${
                          ev.actorSide === 'A'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {t("Side")}{ev.actorSide || 'Unknown'} ({t(ev.action)})
                      </span>
                    </div>
                    <p className="text-gray-200 font-sans italic pt-0.5">
                      "{ev.rawTranscript || 'No raw transcript recorded'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Export */}
        {activeReviewTab === 'export' && (
          <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242e]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#22c55e]" />
                  {t("Data Export & Interoperability")}</h3>
                <p className="text-xs text-gray-400">
                  {t("Standardized JSON (Schema Version 2.0.0) and tabular CSV format")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* JSON Export Card */}
              <div className="p-4 rounded-xl bg-[#161a22] border border-[#242c3c] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{t("Full Session JSON")}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e2533] text-[#4ade80] font-mono">
                    Schema v2.0.0
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {t("Contains complete match hierarchy: metadata, set segments, canonical scouting events, and deterministic analytics metrics.")}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={exportSessionJson}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#173822] hover:bg-[#1e482b] text-[#4ade80] border border-[#22c55e]/40 text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("Download JSON File")}</span>
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1d222e] hover:bg-[#252c3c] border border-[#2f394c] text-xs font-semibold text-gray-300 transition-colors"
                    title={t("Copy JSON to clipboard")}
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>{t("Copied!")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t("Copy")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CSV Export Card */}
              <div className="p-4 rounded-xl bg-[#161a22] border border-[#242c3c] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{t("Spreadsheet CSV")}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e2533] text-sky-400 font-mono">
                    {t("Tabular")}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {t("Flat spreadsheet with standard columns for Excel, Google Sheets, or R: Time, Rally, Side, Action, Subtype, Zones, Outcome, Score.")}</p>
                <div className="pt-1">
                  <button
                    onClick={exportSessionCsv}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#17263c] hover:bg-[#1d324f] text-sky-300 border border-sky-500/40 text-xs font-bold transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{t("Download CSV File")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
