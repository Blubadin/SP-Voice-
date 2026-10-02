import {useLocale} from '../../i18n/LocaleContext';
import {actions,zones,validationErrors} from '../../domain/validation';
import React, { useState, useEffect } from 'react';
import { ParsedEvent, PlayerSide } from '../../types/scout';
import { X, Check } from 'lucide-react';

interface EditEventModalProps {
  event: ParsedEvent | null;
  onSave: (updated: ParsedEvent) => void | {success:boolean;errors:string[]};
  onClose: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  onSave,
  onClose,
}) => {
  const {t}=useLocale();

  if (!event) return null;

  const [player, setPlayer] = useState<PlayerSide | undefined>(event.actorSide);
  const [action, setAction] = useState(event.action);
  const [originZone, setOriginZone] = useState(event.originZone || '');
  const [targetZone, setTargetZone] = useState(event.targetZone || '');
  
  const [quality,setQuality]=useState(event.receptionQuality===undefined?'':String(event.receptionQuality));
  const [outcome,setOutcome]=useState(event.outcome);
  const [errors,setErrors]=useState<string[]>([]);
  const [transcript, setTranscript] = useState(event.rawTranscript || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const points=outcome==='IN_PLAY'?0:1;
    const award=outcome==='IN_PLAY'?undefined:['ERROR','BLOCKED'].includes(outcome)?(player==='A'?'B':player==='B'?'A':undefined):player;
    const confirm=(e.nativeEvent as SubmitEvent).submitter?.getAttribute('data-confirm')==='true';
    const updated:ParsedEvent={...event,status:confirm?'CONFIRMED':event.status,needsReview:confirm?false:event.needsReview,actorSide:player,player,action,originZone:originZone||undefined,targetZone:targetZone||undefined,outcome,receptionQuality:quality===''?undefined:Number(quality) as 0|1|2|3,scoreImpact:{points,sideAwarded:award},pointDelta:points,result:outcome==='ACE'?'ace':['WINNER','KILL'].includes(outcome)?'winner':['ERROR','BLOCKED'].includes(outcome)?'error':'rally',rawTranscript:transcript};
    const invalid=validationErrors(updated);if(invalid.length){setErrors(invalid);return;}const saved=onSave(updated);if(saved&&!saved.success)setErrors(saved.errors);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-[#141821] border border-[#262f3f] rounded-3xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2633] mb-3">
          <h3 className="text-sm font-bold text-white">{t("Edit Recorded Event")}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Player Selection */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">
              {t("Player Attribution")}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlayer('A')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  player === 'A'
                    ? 'bg-[#152a48] border-blue-500 text-blue-300'
                    : 'bg-[#181c25] border-gray-700 text-gray-400'
                }`}
              >
                {t("Side A")}</button>
              <button
                type="button"
                onClick={() => setPlayer('B')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  player === 'B'
                    ? 'bg-[#3b171a] border-red-500 text-red-300'
                    : 'bg-[#181c25] border-gray-700 text-gray-400'
                }`}
              >
                {t("Side B")}</button>
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 block mb-1">
              {t("Action / Skill")}</label>
            <select value={action} onChange={e=>setAction(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0f1217] border border-[#242b38] text-sm text-white">
<option value="">{t("Unknown")}</option>{actions[event.sport].map(v=><option key={v} value={v}>{t(String(v))}</option>)}</select>
          </div>

          {/* Zones */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                {t("Origin Zone")}</label>
              <select value={originZone} onChange={e=>setOriginZone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0f1217] border border-[#242b38] text-sm text-white">
<option value="">{t("Unknown")}</option>{zones[event.sport].map(v=><option key={v} value={v}>{t(String(v))}</option>)}</select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                {t("Target Zone")}</label>
              <select value={targetZone} onChange={e=>setTargetZone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0f1217] border border-[#242b38] text-sm text-white">
<option value="">{t("Unknown")}</option>{zones[event.sport].map(v=><option key={v} value={v}>{t(String(v))}</option>)}</select>
            </div>
          </div>

          <label className="block text-sm text-gray-300">{t("Outcome")}<select value={outcome} onChange={e=>setOutcome(e.target.value)} className="w-full p-2 bg-[#0f1217] rounded-lg mt-1">{(event.sport==='badminton'?['IN_PLAY','WINNER','ERROR']:['IN_PLAY','WINNER','ERROR','ACE','KILL','BLOCKED']).map(v=><option key={v} value={v}>{t(String(v))}</option>)}</select></label>
          {event.sport==='volleyball'&&action==='Reception'&&<label className="block text-sm text-gray-300">{t("Reception quality")}<select value={quality} onChange={e=>setQuality(e.target.value)} className="w-full p-2 bg-[#0f1217] rounded-lg mt-1"><option value="">{t("Unknown")}</option>{[0,1,2,3].map(v=><option key={v} value={v}>{t(String(v))}</option>)}</select></label>}
          <p className="text-sm text-sky-200">{outcome==='IN_PLAY'?t('This event does not add a point.'):(t('Point awarded to:')+' '+(['ERROR','BLOCKED'].includes(outcome)?(player==='A'?'B':player==='B'?'A':t('Unknown')):player||t('Unknown'))+' +1')}</p>
          {errors.length>0&&<p role="alert" className="text-sm text-amber-300">{errors.join(' · ')}</p>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1b2029] text-xs font-semibold text-gray-300"
            >
              {t("Cancel")}</button>
            <button type="submit" data-confirm="true" className="px-4 py-2 rounded-xl bg-sky-700 text-xs font-semibold">{t('Save and confirm')}</button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {t("Save Changes")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
