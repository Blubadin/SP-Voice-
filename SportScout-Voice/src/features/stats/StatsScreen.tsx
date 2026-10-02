import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { useScout } from '../../stores/ScoutContext';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  ShieldAlert,
  Activity,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { BadmintonStats, VolleyballStats } from '../../domain/types';

export const StatsScreen: React.FC = () => {
  const {t}=useLocale();

  const { currentSession, stats, exportSessionJson, exportSessionCsv } = useScout();

  const isBadminton = currentSession.sport === 'badminton';
  const badStats = isBadminton ? (stats as BadmintonStats) : null;
  const vbStats = !isBadminton ? (stats as VolleyballStats) : null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-16 select-none">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            {t("Official Match Statistics (Confirmed Events)")}</span>
          <h2 className="text-lg font-bold text-white mt-0.5">
            {currentSession.title}
          </h2>
          <p className="text-xs text-gray-400">
            {isBadminton ? t("Badminton Singles") : t("Volleyball Match")} · {currentSession.format}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportSessionJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191e27] hover:bg-[#202733] border border-[#283244] text-xs font-semibold text-gray-200 transition-colors"
            title={t("Export complete session with Schema Version 2.0.0")}
          >
            <Download className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>{t("Export JSON")}</span>
          </button>
          <button
            onClick={exportSessionCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191e27] hover:bg-[#202733] border border-[#283244] text-xs font-semibold text-gray-200 transition-colors"
            title={t("Export CSV spreadsheet for sports analysts")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>{t("Export CSV")}</span>
          </button>
        </div>
      </div>

      {badStats&&<p className="text-sm text-gray-300">{t("Attempts:")}{badStats.attempts} {t("· In play:")}{badStats.inPlay} {t("· Winners:")}{badStats.winnersA+badStats.winnersB} {t("· Errors:")}{badStats.errorsA+badStats.errorsB}</p>}
      {/* Top Overview Cards (Calculated directly from confirmed events) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold">{t("Confirmed Events")}</span>
            <Activity className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="text-2xl font-black text-white">{stats.confirmedEvents}</div>
          <span className="text-[11px] text-gray-500">{t("Official confirmed:")}{stats.totalEvents}</span>
        </div>

        <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold">{t("Total Rallies")}</span>
            <Target className="w-3.5 h-3.5 text-[#22c55e]" />
          </div>
          <div className="text-2xl font-black text-[#22c55e]">
            {stats.totalRallies}
          </div>
          <span className="text-[11px] text-gray-500">{t("Played rallies")}</span>
        </div>

        <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold">
              {isBadminton ? t("Total Winners") : t("Attack Kills")}
            </span>
            <Award className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400">
            {isBadminton && badStats
              ? badStats.winnersA + badStats.winnersB
              : vbStats
              ? vbStats.killsA + vbStats.killsB
              : 0}
          </div>
          <span className="text-[11px] text-gray-500">
            {isBadminton && badStats
              ? `A: ${badStats.winnersA} · B: ${badStats.winnersB}`
              : vbStats
              ? `A: ${vbStats.killsA} · B: ${vbStats.killsB}`
              : ''}
          </span>
        </div>

        <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold">
              {isBadminton ? t("Unforced Errors") : t("Attack Efficiency")}
            </span>
            {isBadminton ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />
            )}
          </div>
          <div
            className={`text-2xl font-black ${
              isBadminton ? 'text-red-400' : 'text-[#22c55e]'
            }`}
          >
            {isBadminton && badStats
              ? badStats.errorsA + badStats.errorsB
              : vbStats
              ? `${(vbStats.attackEfficiencyA * 100).toFixed(1)}%`
              : '0'}
          </div>
          <span className="text-[11px] text-gray-500">
            {isBadminton && badStats
              ? `A: ${badStats.errorsA} · B: ${badStats.errorsB}`
              : vbStats
              ? `Team B: ${(vbStats.attackEfficiencyB * 100).toFixed(1)}%`
              : ''}
          </span>
        </div>
      </div>

      {/* 
        ========================================================================
        BADMINTON-SPECIFIC STATISTICS
        ========================================================================
      */}
      {isBadminton && badStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skill Breakdown with Attempts, Winners & Errors */}
          <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1f242e]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#22c55e]" />
                {t("Skill Attempts & Conversion")}</span>
              <span className="text-[11px] font-mono text-gray-500">
                {t("Attempts · Win · Err")}</span>
            </div>

            <div className="space-y-3.5">
              {badStats.skillBreakdown.map((sk) => {
                const maxAttempts = Math.max(
                  ...badStats.skillBreakdown.map((s) => s.attempts),
                  1
                );
                const percent = Math.round((sk.attempts / maxAttempts) * 100);

                return (
                  <div key={t(sk.name)} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-200">
                        {t(sk.name)}{' '}
                        <span className="text-[11px] font-normal text-gray-500">
                          ({sk.nameTh})
                        </span>
                      </span>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-white font-bold">{sk.attempts}</span>
                        <span className="text-[#22c55e]">W:{sk.winners}</span>
                        <span className="text-red-400">E:{sk.errors}</span>
                      </div>
                    </div>

                    <div className="w-full bg-[#1b202a] h-2.5 rounded-full overflow-hidden flex items-center p-0.5">
                      <div
                        className="bg-gradient-to-r from-[#16a34a] to-[#22c55e] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Court Origin & Target Distributions */}
          <div className="space-y-4">
            <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1f242e]">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-blue-400" />
                  {t("Origin Zone Frequency")}</span>
                <span className="text-[11px] text-gray-400">{t("Shot launch area")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(badStats.originDistribution).length === 0 ? (
                  <div className="text-gray-500 col-span-2 py-3 text-center">
                    {t("No confirmed origin zones yet")}</div>
                ) : (
                  Object.entries(badStats.originDistribution).map(([zone, count]) => (
                    <div
                      key={zone}
                      className="p-2.5 rounded-xl bg-[#171b23] border border-[#232936] flex justify-between items-center"
                    >
                      <span className="text-gray-300 truncate">{zone}</span>
                      <span className="font-mono font-bold text-[#60a5fa]">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1f242e]">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-[#22c55e]" />
                  {t("Target Zone Placement")}</span>
                <span className="text-[11px] text-gray-400">{t("Landing area")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(badStats.targetDistribution).length === 0 ? (
                  <div className="text-gray-500 col-span-2 py-3 text-center">
                    {t("No confirmed target zones yet")}</div>
                ) : (
                  Object.entries(badStats.targetDistribution).map(([zone, count]) => (
                    <div
                      key={zone}
                      className="p-2.5 rounded-xl bg-[#171b23] border border-[#232936] flex justify-between items-center"
                    >
                      <span className="text-gray-300 truncate">{zone}</span>
                      <span className="font-mono font-bold text-[#4ade80]">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        VOLLEYBALL-SPECIFIC STATISTICS
        ========================================================================
      */}
      {!isBadminton && vbStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Volleyball Attack & Efficiency */}
          <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f242e]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                {t("Attack & Efficiency: (Kills - Errors) / Attempts")}</span>
              <span className="text-[11px] font-mono text-[#22c55e]">{t("FIVB Formula")}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Team A Attack */}
              <div className="p-3.5 rounded-xl bg-[#14233c] border border-[#3b82f6]/40 space-y-1.5">
                <span className="text-xs font-bold text-[#60a5fa] block">
                  {t(currentSession.playerA.name)}
                </span>
                <div className="text-xl font-black text-white">
                  {t("Efficiency:")}{(vbStats.attackEfficiencyA * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-300 font-mono space-y-0.5 pt-1">
                  <div>{t("Attempts:")}{vbStats.attackAttemptsA}</div>
                  <div className="text-[#4ade80]">{t("Kills:")}{vbStats.killsA}</div>
                  <div className="text-red-400">{t("Errors:")}{vbStats.attackErrorsA}</div>
                  <div className="text-amber-400">{t("Blocked:")}{vbStats.blockedAttacksA}</div>
                </div>
              </div>

              {/* Team B Attack */}
              <div className="p-3.5 rounded-xl bg-[#351618] border border-[#ef4444]/40 space-y-1.5">
                <span className="text-xs font-bold text-[#f87171] block">
                  {t(currentSession.playerB.name)}
                </span>
                <div className="text-xl font-black text-white">
                  {t("Efficiency:")}{(vbStats.attackEfficiencyB * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-300 font-mono space-y-0.5 pt-1">
                  <div>{t("Attempts:")}{vbStats.attackAttemptsB}</div>
                  <div className="text-[#4ade80]">{t("Kills:")}{vbStats.killsB}</div>
                  <div className="text-red-400">{t("Errors:")}{vbStats.attackErrorsB}</div>
                  <div className="text-amber-400">{t("Blocked:")}{vbStats.blockedAttacksB}</div>
                </div>
              </div>
            </div>

            {/* Blocks & Digs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#171b23] border border-[#232936] text-center">
                <span className="text-[11px] text-gray-400 block uppercase font-semibold">
                  {t("Kill Blocks")}</span>
                <span className="text-xl font-black text-white mt-1 block">
                  A: {vbStats.blocksA} · B: {vbStats.blocksB}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#171b23] border border-[#232936] text-center">
                <span className="text-[11px] text-gray-400 block uppercase font-semibold">
                  {t("Digs Recorded")}</span>
                <span className="text-xl font-black text-white mt-1 block">
                  A: {vbStats.digsA} · B: {vbStats.digsB}
                </span>
              </div>
            </div>
          </div>

          {/* Serve & Reception Quality (0, 1, 2, 3) */}
          <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f242e]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                {t("Serve & Reception Quality Distribution")}</span>
              <span className="text-[11px] font-mono text-gray-400">{t("Scale 0 - 3")}</span>
            </div>

            {/* Serve Comparison */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-300 block">
                {t("Serve Breakdown:")}</span>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#171b23] border border-[#252c39]">
                  <span className="text-[#60a5fa] font-bold block mb-1">
                    {t(currentSession.playerA.name)}
                  </span>
                  <div>{t("Attempts:")}{vbStats.serveAttemptsA}</div>
                  <div className="text-[#22c55e]">{t("Aces:")}{vbStats.acesA}</div>
                  <div className="text-red-400">{t("Errors:")}{vbStats.serveErrorsA}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#171b23] border border-[#252c39]">
                  <span className="text-[#f87171] font-bold block mb-1">
                    {t(currentSession.playerB.name)}
                  </span>
                  <div>{t("Attempts:")}{vbStats.serveAttemptsB}</div>
                  <div className="text-[#22c55e]">{t("Aces:")}{vbStats.acesB}</div>
                  <div className="text-red-400">{t("Errors:")}{vbStats.serveErrorsB}</div>
                </div>
              </div>
            </div>

            {/* Reception Quality 0-3 Distribution */}
            <div className="space-y-2 pt-2 border-t border-[#1e232e]">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                <span>{t("Reception Quality (0-3 scale):")}</span>
                <span className="text-[#22c55e] font-mono">
                  {t("Avg A:")}{vbStats.avgReceptionQualityA} · B: {vbStats.avgReceptionQualityB}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {([3, 2, 1, 0] as const).map((q) => (
                  <div key={q} className="p-2.5 rounded-xl bg-[#171b23] border border-[#232936]">
                    <span className="text-[10px] text-gray-400 block font-bold">
                      {t("Grade")}{q}
                    </span>
                    <span className="text-sm font-black text-white mt-0.5 block font-mono">
                      {vbStats.receptionQualityA[q] + vbStats.receptionQualityB[q]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
