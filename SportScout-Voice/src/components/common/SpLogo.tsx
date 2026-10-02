import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';

interface SpLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const SpLogo: React.FC<SpLogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const {t}=useLocale();

  const [imageError, setImageError] = useState(false);

  const iconDimensions =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-12 h-12'
      : 'w-9 h-9';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Canonical Sp Voice Brand Mark */}
      <div className={`${iconDimensions} relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden select-none`}>
        {!imageError ? (
          <img
            src="/assets/brand/sp-voice-logo.png"
            alt="Sp Voice Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          /* High-fidelity SVG fallback if image path is unavailable */
          <div className="w-full h-full bg-[#101216] border border-[#252A33] rounded-xl flex flex-col items-center justify-center text-white">
            <span className="font-extrabold text-sm leading-none">Sp</span>
            <span className="text-[9px] font-medium text-[#A2AAB7] leading-none mt-0.5">{t("voice")}</span>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col leading-none select-none text-left">
          <span className="text-[14px] sm:text-[15px] font-bold tracking-tight text-[#F4F6F8]">
            SportScout
          </span>
          <span className="text-[11px] sm:text-[12px] font-medium text-[#A2AAB7] tracking-wider mt-0.5 uppercase">
            {t("Voice")}</span>
        </div>
      )}
    </div>
  );
};
