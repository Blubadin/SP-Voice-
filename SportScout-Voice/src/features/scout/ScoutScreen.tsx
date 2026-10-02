import {useLocale} from '../../i18n/LocaleContext';
import React,{useState} from 'react';
import { useScout } from '../../stores/ScoutContext';
import { VoiceStatusCard } from '../../components/common/VoiceStatusCard';
import { TranscriptCard } from '../../components/common/TranscriptCard';
import { ParsedEventCard } from '../../components/common/ParsedEventCard';
import { ScoreCard } from '../../components/common/ScoreCard';
import { PrimaryVoiceButton } from '../../components/common/PrimaryVoiceButton';
import { SecondaryActionButtons } from '../../components/common/SecondaryActionButton';
import { CourtHeatmapPanel } from '../../components/court/CourtHeatmapPanel';
import { EventsTimeline } from '../events/EventsTimeline';
import { EditEventModal } from '../events/EditEventModal';
import { DeveloperDiagnostics } from '../developer/DeveloperDiagnostics';
import { Cpu } from 'lucide-react';

export const ScoutScreen: React.FC = () => {
  const {t}=useLocale();

  const {
    currentSession,
    scoreState,
    apiStatus,
    processUtterance,
    voiceState,
    currentTranscript,
    currentParsedEvent,
    settings,
    startListening,
    stopListening,
    undoLastEvent,
    editLastEvent,
    deleteEvent,
    updateEvent,
    adjustScore,
    editingEvent,
    setEditingEvent,
    isRealMicActive,liveTags,queuedSequences,
    audioLevel,
    micError,
    hasPendingAudio,retryTranscription,downloadPendingAudio,
    showDiagnostics,
    setShowDiagnostics,
  } = useScout();

  const [typed,setTyped]=useState('');
  const handleChipEdit = (_field: string) => {
    if (currentParsedEvent) {
      setEditingEvent(currentParsedEvent);
    }
  };

  return (
    <div className="w-full select-none">
      {hasPendingAudio&&<section className="rounded-xl border border-amber-500/40 p-3 mb-3 text-sm space-y-2"><p>{t('Recording retained. Retry or download before recording again. Refreshing this page clears the recording.')}</p><div className="flex flex-wrap gap-2"><button disabled={voiceState==='transcribing'||voiceState==='understanding'} onClick={retryTranscription} className="rounded-lg bg-sky-700 px-3 py-2 disabled:opacity-40">{t('Retry transcription')}</button><button onClick={downloadPendingAudio} className="rounded-lg border border-white/20 px-3 py-2">{t('Download recording')}</button></div></section>}
      <div className="text-sm text-sky-200 mb-2">{settings.captureMode==='continuous'?t(apiStatus.hasDeepgramKey&&settings.transcriptionMode!=='browser'?'Deepgram live transcription · vocabulary rules + AI for ambiguity':'Continuous browser recognition · experimental; configure Deepgram for live streaming'):apiStatus.hasApiKey?t(settings.transcriptionMode==='server'?'Gemini configured · audio is transcribed after release':'Automatic mode: browser final transcript first; Gemini backup'):t('Browser transcription · vocabulary rules available; complex events require review')}</div>
      {settings.captureMode==='continuous'&&<section className="mb-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-sm" aria-live="polite"><p className="text-gray-400">{t('Live tags · provisional until speech is finalized')}</p><div className="flex flex-wrap gap-2 mt-2">{liveTags.map((tag,i)=><span key={i} className="rounded-full border border-sky-400/30 px-3 py-1 text-sky-200">{t(tag)}</span>)}</div>{queuedSequences>0&&<p className="mt-2 text-amber-200">{t('Sequences processing')}: {queuedSequences} · {t('Microphone keeps listening')}</p>}</section>}
      <form className="flex gap-2 mb-3" onSubmit={e=>{e.preventDefault();if(typed.trim()){processUtterance(typed,0);setTyped('');}}}><input aria-label={t("Spoken scouting text")} placeholder={t("พิมพ์คำบรรยายเพื่อบันทึก / Enter scouting observation")} value={typed} onChange={e=>setTyped(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#151c27] p-2 text-sm"/><button className="rounded-lg bg-sky-700 px-3 text-sm" type="submit">{t("Interpret")}</button></form>
      {/* 
        ========================================================================
        PHONE LIVE SCOUT: STRICT SINGLE-VIEWPORT (ZERO SCROLLING)
        Optimized for 100dvh phone screens. No court, no timeline, no presets.
        Only the core live voice capture & score loop.
        ========================================================================
      */}
      <div className="md:hidden flex flex-col min-h-[calc(100dvh-220px)] gap-1.5 px-1 py-1">
        {/* 1. Voice State Card */}
        <div className="shrink-0">
          <VoiceStatusCard
            state={voiceState}
            deviceName={settings.inputDevice}
            audioLevel={audioLevel}
            errorMessage={micError}
            onTapToSimulate={voiceState === 'ready' ? startListening : undefined}
          />
        </div>

        {/* 2. Live Transcript (Max 2 lines default, tap to expand) */}
        <div className="shrink-0">
          <TranscriptCard
            transcript={currentTranscript}
            isLive={isRealMicActive || voiceState === 'transcribing'}
          />
        </div>

        {/* 3. Parsed Event Chips */}
        <div className="shrink-0">
          <ParsedEventCard
            event={currentParsedEvent}
            state={voiceState}
            onEditChip={handleChipEdit}
          />
        </div>

        {/* 4. Compact Live Score */}
        <div className="shrink-0">
          <ScoreCard
            playerAName={t(currentSession.playerA.name)}
            playerBName={t(currentSession.playerB.name)}
            scoreA={scoreState.scoreA}
            scoreB={scoreState.scoreB}
            setsA={currentSession.setsA}
            setsB={currentSession.setsB}
            currentSet={currentSession.currentSet}
            segments={currentSession.segments}
            sport={currentSession.sport}
            onAdjustScore={adjustScore}
          />
        </div>

        {/* 5. Large Hold to Talk Control */}
        <div className="shrink-0 pt-0.5">
          <PrimaryVoiceButton
            voiceState={voiceState}
            continuous={settings.captureMode==='continuous'} capturing={isRealMicActive}
            onHoldStart={startListening}
            onHoldEnd={stopListening}
            holdToTalkMode={settings.holdToTalkMode}
          />
        </div>

        {/* 6. Undo / Edit Last Actions */}
        <div className="shrink-0">
          <SecondaryActionButtons
            onUndo={undoLastEvent}
            onEditLast={editLastEvent}
            canUndo={currentSession.events.length > 0}
            canEdit={currentSession.events.length > 0}
          />
        </div>
      </div>

      {/* 
        ========================================================================
        TABLET & DESKTOP MULTI-COLUMN LAYOUT (>= 768px)
        Full horizontal width utilization, 2-column or 3-column.
        ========================================================================
      */}
      <div className="hidden md:grid md:grid-cols-12 gap-5 items-start pb-8">
        {/* LEFT COLUMN (5 cols on md, 5 on lg): Voice Pipeline & Score */}
        <div className="md:col-span-6 lg:col-span-5 space-y-3.5">
          {/* Live Score */}
          <ScoreCard
            playerAName={t(currentSession.playerA.name)}
            playerBName={t(currentSession.playerB.name)}
            scoreA={scoreState.scoreA}
            scoreB={scoreState.scoreB}
            setsA={currentSession.setsA}
            setsB={currentSession.setsB}
            currentSet={currentSession.currentSet}
            segments={currentSession.segments}
            sport={currentSession.sport}
            onAdjustScore={adjustScore}
          />

          {/* Voice Status Card */}
          <VoiceStatusCard
            state={voiceState}
            deviceName={settings.inputDevice}
            audioLevel={audioLevel}
            errorMessage={micError}
            onTapToSimulate={voiceState === 'ready' ? startListening : undefined}
          />

          {/* Live Transcript */}
          <TranscriptCard
            transcript={currentTranscript}
            isLive={isRealMicActive || voiceState === 'transcribing'}
          />

          {/* Parsed Event Chips */}
          <ParsedEventCard
            event={currentParsedEvent}
            state={voiceState}
            onEditChip={handleChipEdit}
          />

          {/* Large Voice Action Button */}
          <PrimaryVoiceButton
            voiceState={voiceState}
            continuous={settings.captureMode==='continuous'} capturing={isRealMicActive}
            onHoldStart={startListening}
            onHoldEnd={stopListening}
            holdToTalkMode={settings.holdToTalkMode}
          />

          {/* Undo / Edit */}
          <SecondaryActionButtons
            onUndo={undoLastEvent}
            onEditLast={editLastEvent}
            canUndo={currentSession.events.length > 0}
            canEdit={currentSession.events.length > 0}
          />
        </div>

        {/* RIGHT COLUMN (6 cols on md, 7 on lg): Court & Recent Events */}
        <div className="md:col-span-6 lg:col-span-7 space-y-4">
          <CourtHeatmapPanel
            sport={currentSession.sport}
            events={currentSession.events}
            activeEvent={currentParsedEvent}
          />

          {/* Recent Event Timeline */}
          <EventsTimeline
            events={currentSession.events}
            playerAName={t(currentSession.playerA.name)}
            playerBName={t(currentSession.playerB.name)}
            onEditEvent={(ev) => setEditingEvent(ev)}
            onDeleteEvent={deleteEvent}
            compact
          />
        </div>
      </div>

      {/* Developer Diagnostics Toggle for Tablet / Desktop */}
      <div className="hidden md:block mt-2 pb-6">
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="w-full py-2.5 px-4 rounded-xl bg-[#101216] hover:bg-[#15181D] border border-[#252A33] text-xs font-semibold text-[#A2AAB7] hover:text-white flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#697281]" />
            <span>{t("Developer Diagnostics & Latency Inspector")}</span>
          </span>
          <span className="text-xs font-mono text-[#A2AAB7]">
            {showDiagnostics ? t("▲ Hide") : t("▼ Inspect")}
          </span>
        </button>

        {showDiagnostics && (
          <div className="mt-3">
            <DeveloperDiagnostics />
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onSave={updateEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};
