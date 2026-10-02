import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { MatchSegment, SportType } from '../../domain/types';

interface ScoreCardProps {
  playerAName: string;
  playerBName: string;
  scoreA: number;
  scoreB: number;
  setsA?: number;
  setsB?: number;
  currentSet?: number;
  segments?: MatchSegment[];
  sport?: SportType;
  onAdjustScore?: (player: 'A' | 'B', delta: number) => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  playerAName,
  playerBName,
  scoreA,
  scoreB,
  setsA = 0,
  setsB = 0,
  currentSet = 1,
  segments,
  sport = 'badminton',
  onAdjustScore,
}) => {
  const {t}=useLocale();

  return (
    <div className="w-full bg-[#101216] border border-[#252A33] rounded-xl p-2.5 sm:p-3 select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2 text-xs text-[#A2AAB7]">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#697281]">
          {t("Live Score")}</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#15181D] border border-[#252A33] text-[#F4F6F8] font-mono text-[11px]">
            {sport === 'volleyball' ? t("Set") : t("Game")} {currentSet}
          </span>
          <span className="font-mono text-[#A2AAB7] text-[11px]">
            ({setsA} - {setsB})
          </span>
        </div>
      </div>

      {/* Side A & Side B Columns */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {/* Player / Side A (Blue) */}
        <div className="rounded-lg p-2 sm:p-2.5 bg-[#141C2A] border border-[#3B82F6]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              {t("Side A")}</span>
            {onAdjustScore && (
              <div className="flex items-center gap-0.5 opacity-80 hover:opacity-100">
                <button
                  onClick={() => onAdjustScore('A', -1)}
                  className="w-5 h-5 rounded bg-[#1B273A] text-gray-300 hover:text-white flex items-center justify-center active:scale-90"
                  title={t("Minus 1 point")}
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => onAdjustScore('A', 1)}
                  className="w-5 h-5 rounded bg-[#1B273A] text-[#93c5fd] hover:text-white flex items-center justify-center active:scale-90"
                  title={t("Add 1 point")}
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          <div className="py-0.5 text-center">
            <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white tabular-nums">
              {scoreA}
            </span>
          </div>

          <p className="text-[11px] text-[#A2AAB7] truncate text-center font-medium">
            {t(playerAName)}
          </p>
        </div>

        {/* Player / Side B (Red) */}
        <div className="rounded-lg p-2 sm:p-2.5 bg-[#251518] border border-[#EF5B64]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#EF5B64] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF5B64]" />
              {t("Side B")}</span>
            {onAdjustScore && (
              <div className="flex items-center gap-0.5 opacity-80 hover:opacity-100">
                <button
                  onClick={() => onAdjustScore('B', -1)}
                  className="w-5 h-5 rounded bg-[#351C20] text-gray-300 hover:text-white flex items-center justify-center active:scale-90"
                  title={t("Minus 1 point")}
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => onAdjustScore('B', 1)}
                  className="w-5 h-5 rounded bg-[#351C20] text-[#fca5a5] hover:text-white flex items-center justify-center active:scale-90"
                  title={t("Add 1 point")}
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          <div className="py-0.5 text-center">
            <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white tabular-nums">
              {scoreB}
            </span>
          </div>

          <p className="text-[11px] text-[#A2AAB7] truncate text-center font-medium">
            {t(playerBName)}
          </p>
        </div>
      </div>
    </div>
  );
};
