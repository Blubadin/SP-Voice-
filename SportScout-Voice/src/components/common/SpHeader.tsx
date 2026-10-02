import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { SpLogo } from './SpLogo';
import { useScout } from '../../stores/ScoutContext';
import { Settings, Plus, Mic } from 'lucide-react';

export const SpHeader: React.FC = () => {
  const {t}=useLocale();

  const {
    currentSession,
    settings,
    updateSettings,
    setActiveTab,
    setShowNewSessionModal,
    voiceState,
  } = useScout();

  const toggleLanguage = () => {
    updateSettings({ uiLanguage: settings.uiLanguage === 'en' ? 'th' : 'en' });
  };

  const isListening = voiceState === 'listening';

  return (
    <header className="w-full bg-[#101216] border-b border-[#252A33] px-3 sm:px-4 py-2 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Match Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveTab('scout')}
          className="focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-lg transition-transform active:scale-95 text-left shrink-0"
        >
          <SpLogo size="sm" />
        </button>

        {/* Live match indicator tag */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#15181D] border border-[#252A33] text-xs min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isListening
                ? 'bg-[#59E391] animate-pulse'
                : 'bg-[#697281]'
            }`}
          />
          <span className="text-[#F4F6F8] font-medium truncate max-w-[140px] md:max-w-[200px]">
            {currentSession.title}
          </span>
          <span className="text-[#697281] font-mono text-[11px] uppercase">
            {t(currentSession.sport)}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* New Session Quick Button */}
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15181D] hover:bg-[#1B1F26] text-[#F4F6F8] border border-[#252A33] text-xs font-semibold transition-colors active:scale-95"
          title={t("New Match Session")}
        >
          <Plus className="w-3.5 h-3.5 text-[#A2AAB7]" />
          <span className="hidden xs:inline">{t("New Match")}</span>
        </button>

        {/* Language Switcher TH / EN */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 rounded-lg bg-[#15181D] border border-[#252A33] hover:border-[#333A47] text-xs font-bold transition-colors flex items-center gap-1"
          title={t("Switch Language")}
        >
          <span className={settings.uiLanguage !== 'en' ? 'text-white' : 'text-[#697281]'}>
            TH
          </span>
          <span className="text-[#252A33]">·</span>
          <span className={settings.uiLanguage === 'en' ? 'text-white' : 'text-[#697281]'}>
            EN
          </span>
        </button>

        {/* Active Input Device Indicator (Desktop/Tablet) */}
        <div
          onClick={() => setActiveTab('settings')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#15181D] border border-[#252A33] text-xs text-[#A2AAB7] cursor-pointer hover:border-[#333A47] transition-colors"
          title={`Active Device: ${settings.inputDevice}`}
        >
          <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-[#59E391]' : 'text-[#697281]'}`} />
          <span className="truncate max-w-[120px] text-[11px] font-mono">{settings.inputDevice}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          className="p-2 rounded-lg bg-[#15181D] border border-[#252A33] text-[#A2AAB7] hover:text-white hover:border-[#333A47] transition-colors active:scale-95"
          title={t("Settings")}
          aria-label={t("Settings")}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
