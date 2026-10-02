import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { ParsedEvent, PlayerSide } from '../../types/scout';
import { Clock, Filter, Trash2, Edit2, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, Award } from 'lucide-react';

interface EventsTimelineProps {
  events: ParsedEvent[];
  playerAName: string;
  playerBName: string;
  onEditEvent?: (event: ParsedEvent) => void;
  onDeleteEvent?: (id: string) => void;
  compact?: boolean;
}

export const EventsTimeline: React.FC<EventsTimelineProps> = ({
  events,
  playerAName,
  playerBName,
  onEditEvent,
  onDeleteEvent,
  compact = false,
}) => {
  const {t}=useLocale();

  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'review'>('all');

  const filtered = events.filter((ev) => {
    if (filter === 'all') return true;
    if (filter === 'review') return ev.status === 'REVIEW_REQUIRED' || ev.needsReview;
    return ev.player === filter || ev.actorSide === filter;
  });

  return (
    <div className="w-full bg-[#13161c] border border-[#212631] rounded-2xl p-4 shadow-sm flex flex-col h-full select-none">
      {/* Header & Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#1f242e]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#22c55e]" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {t("Event Timeline")}</span>
          <span className="text-[11px] font-mono text-gray-500">
            ({filtered.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#1a1e27] p-1 rounded-lg border border-[#282f3d]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#252c3b] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t("All")}</button>
          <button
            onClick={() => setFilter('A')}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              filter === 'A'
                ? 'bg-[#182a47] text-[#93c5fd] border border-blue-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            {t("Side A")}</button>
          <button
            onClick={() => setFilter('B')}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              filter === 'B'
                ? 'bg-[#3d191d] text-[#fca5a5] border border-red-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
            {t("Side B")}</button>
          <button
            onClick={() => setFilter('review')}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              filter === 'review'
                ? 'bg-[#382315] text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t("Review")}</button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            {t("No events recorded yet for this selection.")}</div>
        ) : (
          filtered.map((ev, index) => {
            const isA = (ev.actorSide || ev.player) === 'A';
            const isWinner = ev.outcome === 'WINNER' || ev.outcome === 'KILL' || ev.outcome === 'ACE' || ev.result === 'winner' || ev.result === 'ace';
            const isError = ev.outcome === 'ERROR' || ev.outcome === 'BLOCKED' || ev.result === 'error';
            const isNeedsReview = ev.status === 'REVIEW_REQUIRED' || ev.needsReview;

            return (
              <div
                key={ev.id || index}
                className="group p-2.5 rounded-xl bg-[#171b23] border border-[#232936] hover:border-[#384257] transition-all flex items-center justify-between gap-2"
              >
                {/* Left: Time, Player, Jersey #, Action, Subtype, Zones */}
                <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                  <span className="text-[11px] font-mono text-gray-500 select-none">
                    {ev.timestamp}
                  </span>

                  {/* Player Capsule with Jersey # */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                      isA
                        ? 'bg-[#14233c] text-[#60a5fa] border border-[#3b82f6]/40'
                        : 'bg-[#351618] text-[#f87171] border border-[#ef4444]/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isA ? 'bg-[#3b82f6]' : 'bg-[#ef4444]'
                      }`}
                    />
                    <span>{ev.actorSide || 'Unknown'}</span>
                    {ev.actorPlayer?.jerseyNumber && (
                      <span className="font-mono text-[10px] text-white">
                        {ev.actorPlayer.jerseyNumber}
                      </span>
                    )}
                  </span>

                  {/* Action & Subtype */}
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-xs font-bold text-gray-200">
                      {t(ev.action)}
                    </span>
                    {ev.subtype && (
                      <span className="text-[10px] text-gray-400 font-sans hidden xs:inline">
                        ({ev.subtype})
                      </span>
                    )}
                  </div>

                  {/* Reception Quality pill if volleyball reception */}
                  {ev.receptionQuality !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e2738] text-sky-300 font-mono">
                      Q:{ev.receptionQuality}
                    </span>
                  )}

                  {/* Zones */}
                  {(ev.originZone || ev.targetZone) && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400">
                      {ev.originZone && <span>{t(ev.originZone)}</span>}
                      {ev.originZone && ev.targetZone && <span className="text-gray-600">→</span>}
                      {ev.targetZone && <span>{t(ev.targetZone)}</span>}
                    </span>
                  )}

                  {/* Error type */}
                  {ev.errorType && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-800/40 uppercase font-mono">
                      {ev.errorType}
                    </span>
                  )}
                </div>

                {/* Right: Point Delta & Score After + Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Badge if not CONFIRMED */}
                  {isNeedsReview && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-600/40 font-mono font-bold">
                      {t("REVIEW")}</span>
                  )}

                  {/* Score after event */}
                  {ev.scoreAfterA !== undefined && ev.scoreAfterB !== undefined && (
                    <span className="text-[11px] font-mono font-semibold text-gray-400 bg-[#12151b] px-2 py-0.5 rounded border border-white/5">
                      {ev.scoreAfterA} - {ev.scoreAfterB}
                    </span>
                  )}

                  {/* Point Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono tracking-tight ${
                      isError
                        ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                        : isWinner
                        ? 'bg-[#152a1e] text-[#22c55e] border border-[#22c55e]/40'
                        : 'bg-[#181d26] text-gray-400 border border-white/5'
                    }`}
                  >
                    {isWinner ? `+${ev.pointDelta || 1}` : isError ? `ERR` : t("RALLY")}
                  </span>

                  {/* Edit/Delete triggers */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditEvent && (
                      <button
                        onClick={() => onEditEvent(ev)}
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#252c3b]"
                        title={t("Edit event")}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteEvent && (
                      <button
                        onClick={() => onDeleteEvent(ev.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-[#252c3b]"
                        title={t("Delete event")}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
