import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { useScout } from '../../stores/ScoutContext';
import { SportType } from '../../types/scout';
import { X, Play, Sliders, Mic } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({ isOpen, onClose }) => {
  const {t}=useLocale();

  const { createSession, settings } = useScout();

  const [sport, setSport] = useState<SportType>('badminton');
  const [playerA, setPlayerA] = useState('Kunlavut V.');
  const [playerB, setPlayerB] = useState('Viktor A.');
  const [mode, setMode] = useState<'singles' | 'doubles' | 'team'>('singles');
  const [format, setFormat] = useState('Best of 3 (21 pts)');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [perspective, setPerspective] = useState<'near' | 'far'>('near');

  if (!isOpen) return null;

  const handleSportChange = (newSport: SportType) => {
    setSport(newSport);
    if (newSport === 'badminton') {
      setPlayerA('Kunlavut V.');
      setPlayerB('Viktor A.');
      setMode('singles');
      setFormat('Best of 3 (21 pts)');
    } else {
      setPlayerA('Thailand (Team A)');
      setPlayerB('Japan (Team B)');
      setMode('team');
      setFormat('Best of 5 (25 pts)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSession(sport, playerA, playerB, mode, format);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#131720] border border-[#232a38] rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2633] mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {t("Start New Scouting Session")}</h3>
            <p className="text-xs text-gray-400">{t("Quick match configuration")}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sport Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              {t("Select Sport")}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSportChange('badminton')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  sport === 'badminton'
                    ? 'bg-[#152a48] border-blue-500 text-blue-300 ring-1 ring-blue-500'
                    : 'bg-[#171b23] border-[#252b37] text-gray-400 hover:text-white'
                }`}
              >
                <span>🏸</span> {t("Badminton")}</button>
              <button
                type="button"
                onClick={() => handleSportChange('volleyball')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  sport === 'volleyball'
                    ? 'bg-[#152a48] border-blue-500 text-blue-300 ring-1 ring-blue-500'
                    : 'bg-[#171b23] border-[#252b37] text-gray-400 hover:text-white'
                }`}
              >
                <span>🏐</span> {t("Volleyball")}</button>
            </div>
          </div>

          {/* Competitors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#60a5fa] uppercase tracking-wider block mb-1">
                {sport === 'volleyball' ? t("Team A") : t("Player A")}
              </label>
              <input
                type="text"
                required
                value={playerA}
                onChange={(e) => setPlayerA(e.target.value)}
                placeholder={t("Side A Name")}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0f1217] border border-[#242b38] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#f87171] uppercase tracking-wider block mb-1">
                {sport === 'volleyball' ? t("Team B") : t("Player B")}
              </label>
              <input
                type="text"
                required
                value={playerB}
                onChange={(e) => setPlayerB(e.target.value)}
                placeholder={t("Side B Name")}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0f1217] border border-[#242b38] text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Mode & Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {t("Format")}</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0f1217] border border-[#242b38] text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                {sport === 'badminton' ? (
                  <>
                    <option value="Best of 3 (21 pts)">{t("Best of 3 (21 pts)")}</option>
                    <option value="1 Set (30 pts)">{t("1 Set (30 pts)")}</option>
                    <option value="Best of 3 (11 pts)">{t("Best of 3 (11 pts)")}</option>
                  </>
                ) : (
                  <>
                    <option value="Best of 5 (25 pts)">{t("Best of 5 (25 pts)")}</option>
                    <option value="Best of 3 (25 pts)">{t("Best of 3 (25 pts)")}</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {t("Mode")}</label>
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as 'singles' | 'doubles' | 'team')
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0f1217] border border-[#242b38] text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                {sport === 'badminton' ? (
                  <>
                    <option value="singles">{t("Singles")}</option>
                    <option value="doubles">{t("Doubles")}</option>
                  </>
                ) : (
                  <>
                    <option value="team">{t("6 vs 6 Team")}</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] font-semibold text-gray-400 hover:text-gray-200 flex items-center gap-1"
            >
              <Sliders className="w-3 h-3 text-[#22c55e]" />
              <span>{showAdvanced ? t("Hide Advanced Options") : t("Show Advanced Options")}</span>
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 rounded-xl bg-[#0f1217] border border-[#212735] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t("Scout Perspective:")}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPerspective('near')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        perspective === 'near'
                          ? 'bg-[#222938] text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {t("Near Court")}</button>
                    <button
                      type="button"
                      onClick={() => setPerspective('far')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        perspective === 'far'
                          ? 'bg-[#222938] text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {t("Far Court")}</button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-400">{t("Mic Device:")}</span>
                  <span className="text-gray-300 font-mono text-[11px] truncate max-w-[150px]">
                    {settings.inputDevice}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-[#1a1e27] hover:bg-[#222834] text-xs font-semibold text-gray-300"
            >
              {t("Cancel")}</button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] hover:from-[#15803d] hover:to-[#16a34a] text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-lg shadow-green-950/40"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t("Start Match Session")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
