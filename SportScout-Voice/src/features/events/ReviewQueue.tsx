import {useLocale} from '../../i18n/LocaleContext';
import {validationErrors} from '../../domain/validation';
import React from 'react';
import { useScout } from '../../stores/ScoutContext';
import { ParsedEvent } from '../../types/scout';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

interface ReviewQueueProps {
  onEditEvent?: (event: ParsedEvent) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onEditEvent }) => {
  const {t}=useLocale();

  const { currentSession, updateEvent, deleteEvent, setEditingEvent, processUtterance, settings } =
    useScout();

  // Filter events requiring review
  const pendingEvents = currentSession.events.filter(
    (e) =>
      e.status === 'REVIEW_REQUIRED' ||
      e.needsReview === true ||
      (e as any).status === 'review_required'
  );

  // Confirm event as official confirmed record
  const handleConfirm = (event: ParsedEvent) => {
    const errors=validationErrors(event);if(errors.length){alert(errors.join('\n'));setEditingEvent(event);return;}
    const confirmed: ParsedEvent = {
      ...event,
      status: 'CONFIRMED',
      needsReview: false,
    };
    const saved=updateEvent(confirmed);if(!saved.success){alert(saved.errors.join('\n'));setEditingEvent(event);}
  };

  // Reject and discard event
  const handleReject = (id: string) => {
    deleteEvent(id);
  };

  // Inject a simulated ambiguous event for prototype evaluation
  const handleSimulateAmbiguous = () => {
    const isBadminton = currentSession.sport === 'badminton';
    const text = isBadminton
      ? 'A ตบไปตรง... เอ่อ... แถวๆ กลางคอร์ดมั้ง ได้แต้มหรือเปล่าไม่แน่ใจ'
      : 'ทีม A ตบไปโดนบล็อก... เอ่อ ไม่รู้ลงหรือออก';
    processUtterance(text, 1400);
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {t("AI Review Queue")}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-xs font-bold border border-amber-500/20">
              {pendingEvents.length} {t("Pending")}</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1">
            {t("Uncertain Spoken Events")}</h2>
          <p className="text-xs text-gray-400">
            {t("Ambiguous speech, unclear zones, or low AI confidence require scout verification")}</p>
        </div>

        {settings.devMode && <button
          onClick={handleSimulateAmbiguous}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e2330] hover:bg-[#252c3c] border border-[#2f384a] text-xs font-semibold text-sky-300 transition-colors"
          title={t("Simulate an ambiguous voice utterance")}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t("DEMO: Simulate Ambiguous Utterance")}</span>
        </button>}
      </div>

      {/* Empty State */}
      {pendingEvents.length === 0 ? (
        <div className="bg-[#13161c] border border-[#212631] rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#183124] text-[#22c55e] flex items-center justify-center mx-auto border border-[#22c55e]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">{t("Review Queue is Clear")}</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {t("No events are waiting for review. When an uncertain utterance is detected, it will appear here for verification.")}</p>
          {settings.devMode && <button
            onClick={handleSimulateAmbiguous}
            className="px-3.5 py-1.5 rounded-xl bg-[#182a1e] hover:bg-[#203a29] text-[#4ade80] border border-[#22c55e]/40 text-xs font-semibold transition-colors"
          >
            {t("DEMO: Generate Test Ambiguous Event")}</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {pendingEvents.map((event, idx) => {
            const actorName =
              event.actorSide === 'A'
                ? currentSession.playerA.name
                : event.actorSide==='B'?currentSession.playerB.name:'Unknown Actor';

            // Determine uncertain fields
            const uncertainFields: string[] = [];
            if (!event.originZone) uncertainFields.push('Origin Zone missing');
            if (!event.targetZone) uncertainFields.push('Target Zone missing');
            if (event.outcome === 'IN_PLAY' && event.scoreImpact?.points) {
              uncertainFields.push('Score impact conflict');
            }
            if (uncertainFields.length === 0) {
              uncertainFields.push('Acoustic clarity / low confidence');
            }

            return (
              <div
                key={event.id || idx}
                className="bg-[#14171f] border border-amber-500/30 rounded-2xl p-4 space-y-3 transition-all hover:border-amber-500/50"
              >
                {/* Spoken Raw Transcript Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#212633]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-gray-300">
                      {t("Raw Transcript:")}</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">
                    {event.timestamp || 'Recent'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0d1016] border border-white/5 text-xs text-gray-200 font-sans italic">
                  "{event.rawTranscript || 'Spoken observation'}"
                </div>

                {/* AI Interpretation Preview & Uncertain Field Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#181d28] border border-[#242b3b] space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      {t("AI Interpretation")}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          event.actorSide === 'A'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {actorName}
                      </span>
                      <span className="text-white font-bold">{t(event.action)}</span>
                      {event.subtype && (
                        <span className="text-gray-400">({event.subtype})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 space-y-0.5">
                      <div>
                        {t("Placement:")}{t(event.originZone || 'Unknown')} →{' '}
                        {t(event.targetZone || 'Unknown')}
                      </div>
                      <div>
                        {t("Outcome:")}<span className="font-bold text-white">{t(event.outcome)}</span>{' '}
                        {event.scoreImpact?.points
                          ? `(+${event.scoreImpact.points} to ${event.scoreImpact.sideAwarded})`
                          : t("(Rally continues)")}
                      </div>
                    </div>
                  </div>

                  {/* Uncertain Fields & Suggested Value */}
                  <div className="p-3 rounded-xl bg-[#1f1b14] border border-amber-500/30 space-y-1.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      {t("Uncertain / Missing Fields")}</span>

                    <div className="flex flex-wrap gap-1">
                      {uncertainFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono"
                        >
                          {field}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-gray-300 pt-1">
                      {t("Suggested: Verify zones or edit action before confirming into official score.")}</p>
                  </div>
                </div>

                {/* Actions: Confirm, Edit, Reject */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#202633]">
                  <button
                    onClick={() => handleReject(event.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25181a] hover:bg-[#341d21] text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("Reject")}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onEditEvent) onEditEvent(event);
                      else setEditingEvent(event);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2332] hover:bg-[#232f45] text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t("Edit")}</span>
                  </button>

                  <button
                    onClick={() => handleConfirm(event)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#173822] hover:bg-[#1e492c] text-[#4ade80] border border-[#22c55e]/50 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("Confirm Event")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
