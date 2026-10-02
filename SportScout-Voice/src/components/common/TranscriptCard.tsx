import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';

interface TranscriptCardProps {
  transcript: string;
  isLive?: boolean;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({
  transcript,
  isLive = false,
}) => {
  const {t}=useLocale();

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-full bg-[#101216] border border-[#252A33] rounded-xl p-2.5 sm:p-3 select-none cursor-pointer transition-colors hover:border-[#333A47]"
      title={t("Tap to expand or collapse full transcript")}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#697281]">
          {t("Voice Transcript")}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#59E391]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#59E391] animate-pulse" />
            {t("LIVE")}</span>
        )}
      </div>

      <div className="min-h-[38px] flex items-center">
        <p
          className={`text-xs sm:text-sm font-medium text-[#F4F6F8] leading-snug transition-all ${
            isExpanded ? '' : 'line-clamp-2'
          }`}
        >
          {transcript ? (
            <span>&ldquo;{transcript}&rdquo;</span>
          ) : (
            <span className="text-[#697281] italic">
              {t("Awaiting speech... (e.g. “A หยอดหน้าซ้ายได้แต้ม”)")}</span>
          )}
        </p>
      </div>
    </div>
  );
};
