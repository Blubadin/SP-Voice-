import {ConnectionPanel} from './ConnectionPanel';
import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { useScout } from '../../stores/ScoutContext';
import {
  Mic,
  Volume2,
  Vibrate,
  Globe,
  Sliders,
  Database,
  Terminal,
  Shield,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {t}=useLocale();

  const { settings, updateSettings, setShowOnboarding, resetAllData, apiStatus, isRealMicActive } = useScout();

  const audioDevices = [settings.inputDevice || 'Default Microphone'];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-20 select-none">
      {/* Title */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4">
        <h2 className="text-base font-bold text-white tracking-tight">{t("App Settings")}</h2>
        <p className="text-xs text-gray-400">
          {t("Configure microphone input, speech sensitivity, feedback, and match defaults")}</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#13161c] p-4"><label className="block text-sm">{t('Website language')}<select value={settings.uiLanguage||'th'} onChange={e=>updateSettings({uiLanguage:e.target.value as 'th'|'en'})} className="w-full mt-2 bg-[#0f1217] rounded-lg p-3"><option value="th">ภาษาไทย</option><option value="en">English</option></select></label><p className="text-sm text-gray-400 mt-2">{t('Website language and spoken language are separate settings.')}</p></section>
      <section className="rounded-2xl border border-white/10 bg-[#13161c] p-4"><label className="block text-sm">{t('Voice capture mode')}<select value={settings.captureMode} onChange={e=>updateSettings({captureMode:e.target.value as 'continuous'|'utterance'})} className="w-full mt-2 bg-[#0f1217] rounded-lg p-3"><option value="continuous">{t('Continuous · start once for the match')}</option><option value="utterance">{t('One observation at a time')}</option></select></label><p className="text-sm text-gray-400 mt-2">{t('Keep this page open and the screen awake. Phone background recording requires device testing.')}</p></section>
      <ConnectionPanel />
      {/* Voice & Input Device */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1f242e]">
          <Mic className="w-4 h-4 text-[#22c55e]" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {t("Voice & Microphone")}</span>
        </div>

        {/* Push-to-Talk vs Tap-to-Talk */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-gray-200 block">
              {t("Hold to Talk Mode (Push-to-Talk)")}</span>
            <span className="text-[11px] text-gray-500">
              {t("Hold button while speaking, release to submit immediately")}</span>
          </div>
          <button
            disabled={settings.captureMode==='continuous'}
            onClick={() => updateSettings({ holdToTalkMode: !settings.holdToTalkMode })}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors ${
              settings.holdToTalkMode ? 'bg-[#16a34a]' : 'bg-[#222834]'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                settings.holdToTalkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Microphone Sensitivity */}
        <div>
          <label className="text-xs font-semibold text-gray-300 block mb-1.5">
            {t("Microphone Sensitivity")}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'normal', 'high'] as const).map((lvl) => (
              <button
                key={t(lvl)}
                onClick={() => updateSettings({ sensitivity: lvl })}
                className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors border ${
                  settings.sensitivity === lvl
                    ? 'bg-[#1a2d21] border-[#22c55e] text-[#4ade80]'
                    : 'bg-[#151820] border-[#232936] text-gray-400 hover:text-white'
                }`}
              >
                {t(lvl)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1f242e]">
          <Globe className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {t("Language & Speech Recognition")}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateSettings({ language: 'th' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.language === 'th'
                ? 'bg-[#12261a] border-[#22c55e] text-white shadow-sm'
                : 'bg-[#14171e] border-[#222938] text-gray-400 hover:text-white'
            }`}
          >
            <div className="font-bold text-xs">{t("ภาษาไทย (Thai)")}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              รองรับสำนวนกีฬาธรรมชาติ และการพูดแก้คำ
            </div>
          </button>

          <button
            onClick={() => updateSettings({ language: 'en' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.language === 'en'
                ? 'bg-[#12261a] border-[#22c55e] text-white shadow-sm'
                : 'bg-[#14171e] border-[#222938] text-gray-400 hover:text-white'
            }`}
          >
            <div className="font-bold text-xs">{t("English (US/UK)")}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {t("Natural badminton & volleyball terminology")}</div>
          </button>
        </div>
      </div>

      {/* Feedback Sound & Haptic */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1f242e]">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {t("Sound & Haptic Feedback")}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-200 block">
              {t("Audio Feedback Chimes")}</span>
            <span className="text-[11px] text-gray-500">
              {t("Tone on speech start, event confirm, and undo")}</span>
          </div>
          <button
            onClick={() => updateSettings({ feedbackSound: !settings.feedbackSound })}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors ${
              settings.feedbackSound ? 'bg-[#16a34a]' : 'bg-[#222834]'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                settings.feedbackSound ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-semibold text-gray-200 block">
              {t("Haptic Vibration")}</span>
            <span className="text-[11px] text-gray-500">
              {t("Tactile confirmation pulse on mobile devices")}</span>
          </div>
          <button
            onClick={() => updateSettings({ haptic: !settings.haptic })}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors ${
              settings.haptic ? 'bg-[#16a34a]' : 'bg-[#222834]'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                settings.haptic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sport Defaults */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1f242e]">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {t("Sport Defaults")}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateSettings({ sportDefault: 'badminton' })}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              settings.sportDefault === 'badminton'
                ? 'bg-[#162a4a] border-blue-500 text-blue-300'
                : 'bg-[#14171e] border-[#222938] text-gray-400'
            }`}
          >
            {t("Badminton")}</button>

          <button
            onClick={() => updateSettings({ sportDefault: 'volleyball' })}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              settings.sportDefault === 'volleyball'
                ? 'bg-[#162a4a] border-blue-500 text-blue-300'
                : 'bg-[#14171e] border-[#222938] text-gray-400'
            }`}
          >
            {t("Volleyball")}</button>
        </div>
      </div>

      {/* Data & Maintenance */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1f242e]">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {t("Storage & Onboarding")}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div>
            <span className="text-xs font-semibold text-gray-200 block">
              {t("Re-run Onboarding Tutorial")}</span>
            <span className="text-[11px] text-gray-500">
              {t("Interactive 6-step voice tutorial and microphone test")}</span>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#1d232f] hover:bg-[#252d3d] text-xs font-bold text-white border border-[#2a3344] transition-colors"
          >
            {t("Open Tutorial")}</button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1d222b]">
          <div>
            <span className="text-xs font-semibold text-red-300 block">
              {t("Reset Demo Sessions")}</span>
            <span className="text-[11px] text-gray-500">
              {t("Restore initial matches, stats, and default skill models")}</span>
          </div>
          <button
            onClick={resetAllData}
            className="px-3.5 py-1.5 rounded-xl bg-[#321618] hover:bg-[#45191c] text-xs font-bold text-red-300 border border-red-800/40 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("Reset Data")}</button>
        </div>
      </div>

      {/* Developer Mode */}
      <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {t("Developer & Audio Diagnostics")}</span>
          </div>
          <button
            onClick={() => updateSettings({ devMode: !settings.devMode })}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors ${
              settings.devMode ? 'bg-[#16a34a]' : 'bg-[#222834]'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                settings.devMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.devMode && (
          <div className="p-3 rounded-xl bg-[#0e1014] border border-[#222836] font-mono text-[11px] text-gray-400 space-y-1">
            <div>API: {apiStatus.status}</div>
            <div>{t("Microphone")}: {isRealMicActive ? t("Recording") : t("Idle")}</div>
            <div>{t("Only confirmed events contribute to official statistics.")}</div>
          </div>
        )}
      </div>
    </div>
  );
};
