import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { VoiceState } from '../../types/scout';

interface PrimaryVoiceButtonProps {
  voiceState: VoiceState;
  continuous?:boolean;
  capturing?:boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  holdToTalkMode?: boolean;
}

export const PrimaryVoiceButton: React.FC<PrimaryVoiceButtonProps> = ({
  voiceState,
  onHoldStart,
  onHoldEnd,
  holdToTalkMode = true,
  continuous=false,capturing=false,
}) => {
  const {t}=useLocale();

  const isListening = continuous?capturing:voiceState === 'listening';
  const isProcessing = !continuous&&(voiceState === 'transcribing' || voiceState === 'understanding');
  const [isPressing, setIsPressing] = useState(false);

  // Push-to-talk handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if(continuous)return;
    e.preventDefault();
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (isProcessing) return;

    if (holdToTalkMode) {
      setIsPressing(true);
      onHoldStart();
    } else {
      if (isListening || voiceState === 'preparing') {
        onHoldEnd();
      } else {
        onHoldStart();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!holdToTalkMode || isProcessing) return;

    if (isPressing) {
      setIsPressing(false);
      onHoldEnd();
    }
  };

  const handlePointerCancel = () => {
    if (holdToTalkMode && isPressing) {
      setIsPressing(false);
      onHoldEnd();
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-1">
      <button
        onClick={continuous?()=>{if(capturing||voiceState==='preparing')onHoldEnd();else onHoldStart();}:undefined}
        aria-pressed={continuous?capturing:undefined}
        onContextMenu={e=>e.preventDefault()}
        style={{WebkitTouchCallout:'none',userSelect:'none'}}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        disabled={isProcessing && !isPressing}
        className={`w-full max-w-md h-14 sm:h-16 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-150 border font-bold tracking-wide touch-none cursor-pointer ${
          isListening
            ? 'bg-[#59E391] border-[#59E391] text-[#0A0B0D] shadow-md scale-[0.98]'
            : isProcessing
            ? 'bg-[#15181D] border-[#252A33] text-[#697281] cursor-wait'
            : 'bg-[#1FB56A] hover:bg-[#199d5a] border-[#23c373] text-white shadow-sm active:scale-[0.98]'
        }`}
      >
        {/* State Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-black/15 text-[#0A0B0D]'
              : isProcessing
              ? 'bg-[#1B1F26] text-[#697281]'
              : 'bg-black/20 text-white'
          }`}
        >
          {isListening ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </div>

        {/* Action Label */}
        <div className="text-left leading-tight">
          <div className="text-sm sm:text-base font-extrabold tracking-tight">
            {continuous ? t(isListening?'Stop continuous scouting':voiceState==='preparing'?'Connecting live microphone…':'Start continuous scouting') : voiceState === 'preparing' ? t('Opening microphone…') : isListening
              ? holdToTalkMode
                ? t("Release to save")
                : t("Listening... (Tap to finish)")
              : isProcessing
              ? t("Processing speech...")
              : holdToTalkMode
              ? t("Hold to Talk")
              : t("Tap to Talk")}
          </div>
          <p
            className={`text-[10px] sm:text-[11px] font-normal ${
              isListening ? 'text-[#0A0B0D]/80' : 'text-white/80'
            }`}
          >
            {continuous ? t("Tap once, speak continuously; tap again to stop") : isListening
              ? t("Speaking observations")
              : holdToTalkMode
              ? t("Speak naturally while holding")
              : t("Tap once to speak")}
          </p>
        </div>
      </button>
    </div>
  );
};
