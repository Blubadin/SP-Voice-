import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { VoiceState } from '../../types/scout';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface VoiceStatusCardProps {
  state: VoiceState;
  deviceName?: string;
  audioLevel?: number;
  errorMessage?: string | null;
  onTapToSimulate?: () => void;
}

export const VoiceStatusCard: React.FC<VoiceStatusCardProps> = ({
  state,
  deviceName = 'Microphone',
  audioLevel = 0,
  errorMessage,
  onTapToSimulate,
}) => {
  const {t}=useLocale();
  const getStatusContent = () => {
    switch (state) {
      case 'preparing':
        return {title:'Opening microphone',subtitle:'Allow microphone access, then speak',color:'text-sky-300',dotColor:'bg-sky-400',borderColor:'border-sky-500/40',badgeText:'PREPARING'};
      case 'listening':
        return {
          title: 'Listening',
          subtitle: 'Recording your selected microphone',
          color: 'text-[#59E391]',
          dotColor: 'bg-[#59E391]',
          borderColor: 'border-[#1FB56A]/60',
          badgeText: 'LIVE MIC',
        };
      case 'transcribing':
        return {
          title: 'Transcribing',
          subtitle: 'Waiting for the final transcript',
          color: 'text-[#F2B84B]',
          dotColor: 'bg-[#F2B84B]',
          borderColor: 'border-[#F2B84B]/40',
          badgeText: 'AUDIO STREAM',
        };
      case 'understanding':
        return {
          title: 'Interpreting',
          subtitle: 'Extracting player, action, zones',
          color: 'text-[#3B82F6]',
          dotColor: 'bg-[#3B82F6]',
          borderColor: 'border-[#3B82F6]/40',
          badgeText: 'GEMINI AI',
        };
      case 'confirmed':
        return {
          title: 'Event Confirmed',
          subtitle: 'Score updated automatically',
          color: 'text-[#59E391]',
          dotColor: 'bg-[#59E391]',
          borderColor: 'border-[#1FB56A]/50',
          badgeText: 'CONFIRMED',
        };
      case 'review_required':
        return {
          title: 'Needs Review',
          subtitle: 'Ambiguous phrase added to queue',
          color: 'text-[#F2B84B]',
          dotColor: 'bg-[#F2B84B]',
          borderColor: 'border-[#F2B84B]/50',
          badgeText: 'REVIEW QUEUE',
        };
      case 'error':
        return {
          title: 'Speech service notice',
          subtitle: errorMessage || 'No speech detected. Hold button to speak.',
          color: 'text-[#EF5B64]',
          dotColor: 'bg-[#EF5B64]',
          borderColor: 'border-[#EF5B64]/50',
          badgeText: 'NOTICE',
        };
      case 'ready':
      default:
        return {
          title: 'Ready to Scout',
          subtitle: 'Hold to Talk and speak observations',
          color: 'text-[#F4F6F8]',
          dotColor: 'bg-[#697281]',
          borderColor: 'border-[#252A33]',
          badgeText: deviceName,
        };
    }
  };

  const status = getStatusContent();
  const isListening = state === 'listening';

  return (
    <div
      onClick={onTapToSimulate}
      className={`w-full rounded-xl p-2.5 sm:p-3 bg-[#101216] border ${status.borderColor} transition-colors select-none`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Indicator & Status Text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {isListening ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#59E391] animate-ping" />
            ) : state === 'transcribing' || state === 'understanding' ? (
              <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />
            ) : state === 'confirmed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#59E391]" />
            ) : state === 'review_required' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#F2B84B]" />
            ) : state === 'error' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF5B64]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#697281]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm font-bold tracking-tight truncate ${status.color}`}>
                {t(status.title)}
              </span>
              <span className="text-[10px] font-mono font-medium uppercase text-[#697281] truncate hidden xs:inline">
                {t(status.badgeText)}
              </span>
            </div>
            <p className="text-[11px] text-[#A2AAB7] whitespace-normal break-words leading-relaxed">
              {t(status.subtitle)}{errorMessage && state!=='error' && <span className="block text-amber-200 mt-1">{errorMessage}</span>}
            </p>
          </div>
        </div>

        {/* Right: Audio Waveform / Level */}
        <div className="flex items-center gap-1 shrink-0 pl-2">
          {isListening ? (
            <div className="flex items-end gap-0.5 h-4">
              {[0.5, 0.9, 1.2, 0.8, 0.4].map((mult, i) => {
                const barHeight = audioLevel > 5
                  ? Math.max(3, Math.min(16, Math.round((audioLevel / 100) * 16 * mult)))
                  : 4 + (i % 3) * 3;
                return (
                  <span
                    key={i}
                    className="w-1 bg-[#59E391] rounded-full transition-all duration-75"
                    style={{ height: `${barHeight}px` }}
                  />
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] font-mono text-[#697281]">
              {deviceName.length > 15 ? `${deviceName.slice(0, 15)}...` : deviceName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
