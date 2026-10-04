import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { ParsedEvent, VoiceState } from '../../types/scout';
import { Check } from 'lucide-react';

interface ParsedEventCardProps {
  event: ParsedEvent | null;
  state: VoiceState;
  onEditChip?: (field: string) => void;
}

export const ParsedEventCard: React.FC<ParsedEventCardProps> = ({
  event,
  state,
  onEditChip,
}) => {
  const {t}=useLocale();

  const isInterpreting = state === 'transcribing' || state === 'understanding';
  const isPreview=event?.status==='DRAFT';
  const isConfirmed = event?.status === 'CONFIRMED';

  // Do not invent origin or target if unknown
  const player = event?.player || event?.actorSide || null;
  const action = event?.action || null;
  const origin = event?.originZone || null;
  const target = event?.targetZone || null;
  const pointDelta = event?.pointDelta !== undefined ? event.pointDelta : event?.scoreImpact?.points || 0;
  const outcome = event?.outcome || event?.result || null;
  const jerseyNumber = event?.actorPlayer?.jerseyNumber || (event as any)?.jerseyNumber;

  const hasData = player || action || origin || target || outcome;

  return (
    <div className="w-full bg-[#101216] border border-[#252A33] rounded-xl p-2.5 sm:p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#697281]">
          {t("Parsed Event")}</span>
        <div className="flex items-center gap-1.5">
          {isInterpreting ? (
            <span className="text-[10px] font-mono text-[#F2B84B] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2B84B] animate-ping" />
              {t("PARSING")}</span>
          ) : isConfirmed ? (
            <span className="text-[10px] font-mono text-[#59E391] flex items-center gap-0.5 font-bold">
              <Check className="w-3 h-3" />
              {t("CONFIRMED")}</span>
          ) : (
            <span className="text-[10px] font-mono text-[#697281]">{t(event?.status==='REVIEW_REQUIRED'?'Needs review':event?.status || 'DRAFT')}</span>
          )}
        </div>
      </div>

      {isPreview&&<p className="mb-2 text-xs text-sky-200">{t('Waiting for final speech · score unchanged')}</p>}
      {/* Chips Container */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[38px]">
        {hasData ? (
          <>
            {/* Player Chip: Side A Blue / Side B Red */}
            {player && (
              <button
                onClick={() => onEditChip && onEditChip('player')}
                disabled={isInterpreting||isPreview}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  player === 'A'
                    ? 'bg-[#14233c] border-[#3B82F6]/60 text-[#3B82F6]'
                    : 'bg-[#351618] border-[#EF5B64]/60 text-[#EF5B64]'
                }`}
                title={t("Player Attribution")}
              >
                {t("Side")}{player} {jerseyNumber ? `#${jerseyNumber}` : ''}
              </button>
            )}

            {/* Action Chip: Clean Neutral */}
            {action && (
              <button
                onClick={() => onEditChip && onEditChip('action')}
                disabled={isInterpreting||isPreview}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1B1F26] border border-[#252A33] text-[#F4F6F8] hover:border-[#333A47] transition-colors"
                title={t("Sport Action")}
              >
                {action}
              </button>
            )}

            {/* Origin Zone */}
            {origin && (
              <button
                onClick={() => onEditChip && onEditChip('origin')}
                disabled={isInterpreting||isPreview}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#15181D] border border-[#252A33] text-[#A2AAB7] hover:border-[#333A47] transition-colors"
                title={t("Origin Zone")}
              >
                <span className="text-[9px] uppercase text-[#697281] mr-1 font-mono">{t("From")}</span>
                {origin}
              </button>
            )}

            {/* Target Zone */}
            {target && (
              <button
                onClick={() => onEditChip && onEditChip('target')}
                disabled={isInterpreting||isPreview}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#15181D] border border-[#252A33] text-[#A2AAB7] hover:border-[#333A47] transition-colors"
                title={t("Target Zone")}
              >
                <span className="text-[9px] uppercase text-[#697281] mr-1 font-mono">{t("To")}</span>
                {target}
              </button>
            )}

            {/* Outcome / Score Impact */}
            {outcome && (
              <button
                onClick={() => onEditChip && onEditChip('point')}
                disabled={isInterpreting||isPreview}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                  outcome === 'ERROR' || outcome === 'error'
                    ? 'bg-[#351618] border-[#EF5B64]/60 text-[#EF5B64]'
                    : outcome === 'WINNER' || outcome === 'winner' || outcome === 'ACE' || outcome === 'KILL'
                    ? 'bg-[#15281D] border-[#1FB56A]/60 text-[#59E391]'
                    : 'bg-[#15181D] border-[#252A33] text-[#A2AAB7]'
                }`}
                title={t("Outcome & Point")}
              >
                {pointDelta > 0 ? `+${pointDelta} ` : ''}
                {outcome.toUpperCase()}
              </button>
            )}
          </>
        ) : (
          <div className="text-xs text-[#697281] italic py-1">
            {t("No active event parsed yet. Hold button to scout.")}</div>
        )}
      </div>
      {event?.status==='REVIEW_REQUIRED'&&onEditChip&&<button onClick={()=>onEditChip('point')} className="mt-2 rounded-lg border border-amber-400/40 px-3 py-2 text-xs text-amber-200">{t('Review and confirm event')}</button>}
    </div>
  );
};
