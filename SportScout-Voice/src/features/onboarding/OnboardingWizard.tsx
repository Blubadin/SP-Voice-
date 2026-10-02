import {ConnectionPanel} from '../settings/ConnectionPanel';
import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { useScout } from '../../stores/ScoutContext';
import { SpLogo } from '../../components/common/SpLogo';
import { SportType } from '../../types/scout';
import {
  Mic,
  ArrowRight,
  CheckCircle2,
  Play,
  Check,
} from 'lucide-react';
import { playAudioFeedback } from '../../services/mockVoiceEngine';

export const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const {t}=useLocale();

  const { updateSettings, settings, audioLevel } = useScout();
  const [step, setStep] = useState<number>(1);
  const [selectedSport, setSelectedSport] = useState<SportType>(settings.sportDefault);
  const [selectedLang, setSelectedLang] = useState<'th' | 'en'>(settings.language);

  // Practice simulation
  const [practiceState, setPracticeState] = useState<
    'idle' | 'listening' | 'transcribing' | 'understanding' | 'confirmed'
  >('idle');

  // Practice state machine
  const runPractice = () => {
    setPracticeState('listening');
    playAudioFeedback('beep');

    setTimeout(() => {
      setPracticeState('transcribing');
      setTimeout(() => {
        setPracticeState('understanding');
        setTimeout(() => {
          setPracticeState('confirmed');
          playAudioFeedback('confirm');
        }, 600);
      }, 600);
    }, 1200);
  };

  const handleFinish = () => {
    updateSettings({
      sportDefault: selectedSport,
      uiLanguage: selectedLang,
      language: selectedLang,
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0B0D]/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="w-full max-w-lg bg-[#101216] border border-[#252A33] rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto">
        {/* Step indicator bar */}
        <div className="flex items-center justify-between gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-white' : 'bg-[#1B1F26]'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <SpLogo size="lg" />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#F4F6F8] tracking-tight">
                {t("Watch the game.")}<br />
                <span className="text-[#59E391]">{t("Speak naturally.")}</span>
                <br />
                {t("We structure the data.")}</h1>
              <p className="text-xs sm:text-sm text-[#A2AAB7] max-w-sm mx-auto leading-relaxed">
                {t("Voice-first scouting built for high-tempo live badminton and volleyball matches. No robotic commands required.")}</p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-full bg-[#1FB56A] hover:bg-[#199d5a] text-white font-extrabold text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span>{t("Get Started")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Sport */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[#A2AAB7] uppercase tracking-wider">
                {t("Step 2 of 6")}</span>
              <h2 className="text-xl font-extrabold text-white">{t("Choose Your Sport")}</h2>
              <p className="text-xs text-[#A2AAB7]">
                {t("You can switch between sports or add new matches anytime.")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={() => setSelectedSport('badminton')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  selectedSport === 'badminton'
                    ? 'bg-[#14233c] border-[#3B82F6] ring-1 ring-[#3B82F6]'
                    : 'bg-[#15181D] border-[#252A33] text-[#A2AAB7] hover:border-gray-600'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3">
                  <span className="text-xl">🏸</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t("Badminton")}</h3>
                  <p className="text-xs text-[#A2AAB7] mt-1">
                    {t("Singles & Doubles, 9 scouting zones, rally & shot analysis")}</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedSport('volleyball')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  selectedSport === 'volleyball'
                    ? 'bg-[#14233c] border-[#3B82F6] ring-1 ring-[#3B82F6]'
                    : 'bg-[#15181D] border-[#252A33] text-[#A2AAB7] hover:border-gray-600'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                  <span className="text-xl">🏐</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t("Volleyball")}</h3>
                  <p className="text-xs text-[#A2AAB7] mt-1">
                    {t("Rotation zones 1-6, Attack, Serve, Block & Dig tracking")}</p>
                </div>
              </button>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-full bg-[#15181D] border border-[#252A33] text-[#A2AAB7] text-xs font-bold"
              >
                {t("Back")}</button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-full bg-[#1FB56A] hover:bg-[#199d5a] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>{t("Continue")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose Language */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[#A2AAB7] uppercase tracking-wider">
                {t("Step 3 of 6")}</span>
              <h2 className="text-xl font-extrabold text-white">{t("Voice Language")}</h2>
              <p className="text-xs text-[#A2AAB7]">
                {t("Optimized models for natural spoken terms. Mixed TH/EN ready.")}</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setSelectedLang('th')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  selectedLang === 'th'
                    ? 'bg-[#15181D] border-white text-white'
                    : 'bg-[#101216] border-[#252A33] text-[#A2AAB7] hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>ภาษาไทย</span>
                    <span className="text-xs font-normal text-[#A2AAB7]">{t("(Thai)")}</span>
                  </div>
                  <p className="text-xs text-[#697281] mt-1">
                    ตัวอย่าง: &ldquo;A หยอดหน้าซ้ายได้หนึ่ง&rdquo;, &ldquo;B ตบหลังขวา&rdquo;
                  </p>
                </div>
                {selectedLang === 'th' && (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                )}
              </button>

              <button
                onClick={() => setSelectedLang('en')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  selectedLang === 'en'
                    ? 'bg-[#15181D] border-white text-white'
                    : 'bg-[#101216] border-[#252A33] text-[#A2AAB7] hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>{t("English")}</span>
                    <span className="text-xs font-normal text-[#A2AAB7]">{t("(US / International)")}</span>
                  </div>
                  <p className="text-xs text-[#697281] mt-1">
                    {t("Example: “Player A smash to front right, winner”")}</p>
                </div>
                {selectedLang === 'en' && (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-5 rounded-full bg-[#15181D] border border-[#252A33] text-[#A2AAB7] text-xs font-bold"
              >
                {t("Back")}</button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-full bg-[#1FB56A] hover:bg-[#199d5a] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>{t("Continue")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Microphone Setup */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[#A2AAB7] uppercase tracking-wider">
                {t("Step 4 of 6")}</span>
              <h2 className="text-xl font-extrabold text-white">{t("Microphone Setup")}</h2>
              <p className="text-xs text-[#A2AAB7]">
                {t("Connect your headset, earbuds, or phone microphone for scouting.")}</p>
            </div>

            <ConnectionPanel />

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="py-3 px-5 rounded-full bg-[#15181D] border border-[#252A33] text-[#A2AAB7] text-xs font-bold"
              >
                {t("Back")}</button>
              <button
                onClick={() => setStep(5)}
                className="flex-1 py-3.5 rounded-full bg-[#1FB56A] hover:bg-[#199d5a] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>{t("Continue")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: How to speak */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[#A2AAB7] uppercase tracking-wider">
                {t("Step 5 of 6")}</span>
              <h2 className="text-xl font-extrabold text-white">{t("How to Speak")}</h2>
              <p className="text-xs text-[#A2AAB7]">
                {t("Speak naturally as you observe the court.")}</p>
            </div>

            <div className="space-y-2.5">
              {/* Short */}
              <div className="p-3.5 rounded-xl bg-[#15181D] border border-[#252A33]">
                <div className="text-[10px] font-semibold text-[#697281] uppercase tracking-wider mb-1">
                  {t("1. Short & Direct")}</div>
                <div className="text-sm font-medium text-white">
                  &ldquo;A หยอดหน้าซ้ายได้หนึ่ง&rdquo;
                </div>
                <div className="text-[11px] text-[#A2AAB7] mt-1 font-mono">
                  {t("→ [Player A] [Drop] [Front Left] [+1]")}</div>
              </div>

              {/* Natural with Correction */}
              <div className="p-3.5 rounded-xl bg-[#15181D] border border-[#252A33]">
                <div className="text-[10px] font-semibold text-[#697281] uppercase tracking-wider mb-1">
                  {t("2. Self-Correction Handled Automatically")}</div>
                <div className="text-sm font-medium text-white leading-relaxed">
                  &ldquo;A อยู่ขวาหน้า <span className="text-[#F2B84B] line-through">เอ้ยไม่ใช่ขวาหลัง</span> แล้วหยอดไปหน้าซ้าย ได้หนึ่ง&rdquo;
                </div>
                <div className="text-[11px] text-[#59E391] mt-1 font-mono">
                  {t("→ Resolves to [Rear Right]")}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setStep(4)}
                className="py-3 px-5 rounded-full bg-[#15181D] border border-[#252A33] text-[#A2AAB7] text-xs font-bold"
              >
                {t("Back")}</button>
              <button
                onClick={() => setStep(6)}
                className="flex-1 py-3.5 rounded-full bg-[#1FB56A] hover:bg-[#199d5a] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>{t("Try Practice")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Interactive Practice */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[#A2AAB7] uppercase tracking-wider">
                {t("Step 6 of 6 · Interactive Practice")}</span>
              <h2 className="text-xl font-extrabold text-white">{t("DEMO: Speech Cycle")}</h2>
              <p className="text-xs text-[#A2AAB7]">
                {t("Simulated illustration only. No microphone, AI request, or match data.")}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#15181D] border border-[#252A33] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A2AAB7]">{t("Pipeline State:")}</span>
                <span className="font-mono uppercase font-bold text-white">
                  {practiceState}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#101216] border border-[#252A33] min-h-[46px] flex items-center">
                {practiceState === 'idle' ? (
                  <span className="text-xs text-[#697281]">
                    {t("Tap below to simulate speaking...")}</span>
                ) : (
                  <span className="text-sm font-medium text-white">
                    &ldquo;A อยู่ขวาหน้า เอ้ยไม่ใช่ขวาหลัง แล้วหยอดไปหน้าซ้าย ได้หนึ่ง&rdquo;
                  </span>
                )}
              </div>

              {(practiceState === 'understanding' || practiceState === 'confirmed') && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-md bg-[#14233c] text-[#3B82F6] text-xs font-bold border border-[#3B82F6]/40">
                    {t("Side A")}</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#1B1F26] text-white text-xs font-bold border border-[#252A33]">
                    {t("Drop")}</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#15181D] text-[#A2AAB7] text-xs font-medium border border-[#252A33]">
                    {t("Rear Right")}</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#15181D] text-[#A2AAB7] text-xs font-medium border border-[#252A33]">
                    {t("Front Left")}</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#15281D] text-[#59E391] text-xs font-black border border-[#1FB56A]/60">
                    {t("+1 WINNER")}</span>
                </div>
              )}

              <button
                onClick={runPractice}
                disabled={practiceState !== 'idle' && practiceState !== 'confirmed'}
                className="w-full py-2.5 rounded-xl bg-[#101216] hover:bg-[#1B1F26] border border-[#252A33] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-[#A2AAB7]" />
                <span>
                  {practiceState === 'confirmed' ? t("Re-run Sample Test") : t("Run Simulated Speech Test")}
                </span>
              </button>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={() => setStep(5)}
                className="py-3 px-5 rounded-full bg-[#15181D] border border-[#252A33] text-[#A2AAB7] text-xs font-bold"
              >
                {t("Back")}</button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-full bg-[#1FB56A] hover:bg-[#199d5a] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <span>{t("Enter SportScout")}</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
