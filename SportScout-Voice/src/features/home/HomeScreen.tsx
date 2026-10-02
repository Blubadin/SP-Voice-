import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { useScout } from '../../stores/ScoutContext';
import { Plus, Calendar, ChevronRight, Activity } from 'lucide-react';
import { SportType } from '../../types/scout';

export const HomeScreen: React.FC = () => {
  const {t}=useLocale();

  const {
    sessions,
    switchSession,
    setActiveTab,
    setShowNewSessionModal,
  } = useScout();

  const handleQuickSport = (sport: SportType) => {
    const match = sessions.find((s) => s.sport === sport);
    if (match) {
      switchSession(match.id);
      setActiveTab('scout');
    } else {
      setShowNewSessionModal(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-20 select-none">
      {/* Top Banner */}
      <div className="bg-[#101216] border border-[#252A33] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A2AAB7] font-semibold">
              {t("Voice-First Scouting Hub")}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F6F8] tracking-tight">
              {t("Ready to scout?")}</h1>
            <p className="text-xs sm:text-sm text-[#A2AAB7] max-w-md">
              {t("Watch the game and speak naturally. Real-time speech interpretation converts observations into structured scouting analytics.")}</p>
          </div>

          <button
            onClick={() => setShowNewSessionModal(true)}
            className="self-start sm:self-center px-4 py-3 rounded-xl bg-[#1FB56A] hover:bg-[#199d5a] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t("New Match Session")}</span>
          </button>
        </div>
      </div>

      {/* Sport Selector Cards */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#697281] px-1">
          {t("Select Sport to Scout")}</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Badminton Card */}
          <div
            onClick={() => handleQuickSport('badminton')}
            className="group p-5 rounded-2xl bg-[#101216] border border-[#252A33] hover:border-[#3B82F6]/50 cursor-pointer transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#14233c] border border-[#3B82F6]/30 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  🏸
                </div>
                <span className="px-2 py-0.5 rounded bg-[#14233c] text-[#3B82F6] border border-[#3B82F6]/30 text-[10px] font-mono font-bold uppercase">
                  {t("BADMINTON")}</span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                {t("Badminton Match")}</h3>
              <p className="text-xs text-[#A2AAB7] mt-1">
                {t("Singles & Doubles, 6-Zone court origin/target tracking, smash, drop, clear, net shot analytics.")}</p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#1B1F26] flex items-center justify-between text-xs font-semibold text-[#3B82F6]">
              <span>{t("Launch Live Scout")}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Volleyball Card */}
          <div
            onClick={() => handleQuickSport('volleyball')}
            className="group p-5 rounded-2xl bg-[#101216] border border-[#252A33] hover:border-amber-500/50 cursor-pointer transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                  🏐
                </div>
                <span className="px-2 py-0.5 rounded bg-[#2c1d14] text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                  {t("VOLLEYBALL")}</span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                {t("Volleyball Match")}</h3>
              <p className="text-xs text-[#A2AAB7] mt-1">
                {t("6 vs 6 team play, Rotation Zones 1-6, Attack, Serve, Block, Dig, and Reception tracking.")}</p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#1B1F26] flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>{t("Launch Live Scout")}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Section */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#697281]">
            {t("Recent Match Sessions")}</span>
          <span className="text-xs text-[#697281] font-mono">
            {sessions.length} {t("sessions")}</span>
        </div>

        <div className="space-y-2">
          {sessions.map((sess) => {
            const isBadminton = sess.sport === 'badminton';

            return (
              <div
                key={sess.id}
                onClick={() => {
                  switchSession(sess.id);
                  setActiveTab('scout');
                }}
                className="p-3.5 rounded-xl bg-[#101216] border border-[#252A33] hover:border-[#333A47] cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${
                      isBadminton ? 'bg-[#14233c] text-[#3B82F6]' : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {isBadminton ? '🏸' : '🏐'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {sess.title}
                      </h4>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1B1F26] text-[#A2AAB7]">
                        {t(sess.sport)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#697281] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#697281]" />
                        {sess.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-[#A2AAB7]">
                        <Activity className="w-3 h-3" />
                        {sess.events.length} {t("events")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-extrabold font-sans text-white">
                      {sess.playerA.score} - {sess.playerB.score}
                    </span>
                    <span className="text-[9px] text-[#697281] block uppercase font-mono">
                      {t(sess.status)}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#697281] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
