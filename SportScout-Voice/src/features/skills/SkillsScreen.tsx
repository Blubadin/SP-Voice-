import {sportVocabulary,vocabularyCategories} from '../../domain/scoutVocabulary';
import {useLocale} from '../../i18n/LocaleContext';
import React, { useState } from 'react';
import { useScout } from '../../stores/ScoutContext';
import { Award, Plus, Check, X, Tag, Sparkles, AlertCircle } from 'lucide-react';
import { SportType } from '../../types/scout';

export const SkillsScreen: React.FC = () => {
  const {t}=useLocale();

  const {
    skills,
    toggleSkill,
    addSkillAlias,
    addCustomSkill,
    currentSession,
    settings,
    updateSettings,
  } = useScout();

  const [activeTab, setActiveTab] = useState<'my_skills' | 'templates'>('my_skills');
  const [selectedSport, setSelectedSport] = useState<SportType>(currentSession.sport);
  const [aliasInput, setAliasInput] = useState<{ [id: string]: string }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillNameTh, setNewSkillNameTh] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'attack' | 'defense' | 'serve' | 'transition'>('attack');

  const filteredSkills = skills.filter((s) => s.sport === selectedSport);

  const handleAddAlias = (skillId: string) => {
    const val = aliasInput[skillId];
    if (val && val.trim()) {
      addSkillAlias(skillId, val.trim());
      setAliasInput((prev) => ({ ...prev, [skillId]: '' }));
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    addCustomSkill({
      sport: selectedSport,
      name: newSkillName.trim(),
      nameTh: newSkillNameTh.trim() || newSkillName.trim(),
      category: newSkillCategory,
      aliases: [newSkillName.toLowerCase().trim()],
      enabled: true,
      isCore: false,
    });
    setNewSkillName('');
    setNewSkillNameTh('');
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-16 select-none">
      {/* Header matching the small phone in reference */}
      <div className="flex items-center justify-between bg-[#13161c] border border-[#212631] rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">{t("Edit Skills")}</h2>
          <p className="text-xs text-gray-400">
            {t("Define canonical actions and spoken natural voice aliases")}</p>
        </div>

        {/* TH / EN Switcher */}
        <button
          onClick={() =>
            updateSettings({ language: settings.language === 'th' ? 'en' : 'th' })
          }
          className="px-3 py-1.5 rounded-full bg-[#1a1e27] border border-[#282f3d] text-xs font-bold text-gray-300 hover:border-gray-500 transition-colors flex items-center gap-1"
        >
          <span className={settings.language === 'th' ? 'text-[#22c55e]' : 'text-gray-400'}>
            TH
          </span>
          <span className="text-gray-600">/</span>
          <span className={settings.language === 'en' ? 'text-[#22c55e]' : 'text-gray-400'}>
            EN
          </span>
        </button>
      </div>

      {/* Spoken Alias Hint Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#14231b] border border-[#22c55e]/30 text-xs text-gray-300">
        <Sparkles className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#4ade80]">{t("Aliases are hints only.")}</span>{' '}
          {t("The AI scout interpreter understands natural language phrases, colloquial words, and variations outside the alias list automatically.")}</div>
      </div>

      {/* Tabs: My Skills / Templates & Sport selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Main Tabs */}
        <div className="flex items-center p-1 bg-[#13161c] border border-[#212631] rounded-xl">
          <button
            onClick={() => setActiveTab('my_skills')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'my_skills'
                ? 'bg-[#1e2430] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t("My Skills")}</button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'templates'
                ? 'bg-[#1e2430] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t("Templates")}</button>
        </div>

        {/* Sport Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#13161c] border border-[#212631] rounded-xl text-xs">
          <button
            onClick={() => setSelectedSport('badminton')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedSport === 'badminton'
                ? 'bg-[#1d3154] text-[#93c5fd] border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t("Badminton")}</button>
          <button
            onClick={() => setSelectedSport('volleyball')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedSport === 'volleyball'
                ? 'bg-[#1d3154] text-[#93c5fd] border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t("Volleyball")}</button>
        </div>
      </div>

      <details className="rounded-2xl border border-sky-400/25 bg-[#13161c] p-4 text-sm"><summary className="cursor-pointer font-bold">{t('Built-in scouting dictionary')}</summary><p className="text-gray-400 mt-3">{t('Grouped aliases drive live tags; ambiguous speech goes to AI or review. This dictionary is expandable, not exhaustive.')}</p><div className="space-y-3 mt-3">{Object.entries(sportVocabulary[selectedSport]).map(([action,words])=><div key={action}><strong className="text-sky-200">{t(action)}</strong><p className="text-gray-300">{words.join(' · ')}</p></div>)}<div><strong>{t('Actors and jersey numbers')}</strong><p>{Object.entries(vocabularyCategories.actors).map(([side,words])=>side+': '+words.join(', ')).join(' / ')} · {vocabularyCategories.identity.jersey.join(', ')}</p></div><div><strong>{t('Origin / target')}</strong><p>{vocabularyCategories.spatial.origin.join(', ')} / {vocabularyCategories.spatial.target.join(', ')}</p></div>{selectedSport==='volleyball'&&<div><strong>{t('Reception quality')}</strong><p>{Object.entries(vocabularyCategories.reception).map(([quality,words])=>quality+': '+words.join(', ')).join(' / ')}</p></div>}<div><strong>{t('Self-corrections and hesitation')}</strong><p>{vocabularyCategories.correction.concat(vocabularyCategories.hesitation).join(' · ')}</p></div></div></details>
      {/* Skills List */}
      <div className="space-y-2.5">
        {filteredSkills.map((skill) => {
          return (
            <div
              key={skill.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                skill.enabled
                  ? 'bg-[#14171d] border-[#222834]'
                  : 'bg-[#111317] border-[#1d212a] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {/* Enable / Disable Checkbox Toggle */}
                  <button
                    onClick={() => toggleSkill(skill.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                      skill.enabled
                        ? 'bg-[#153422] border-[#22c55e] text-[#22c55e]'
                        : 'bg-[#191d24] border-gray-700 text-transparent'
                    }`}
                    title={skill.enabled ? 'Enabled' : 'Disabled'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {t(skill.name)}
                      </span>
                      <span className="text-xs text-gray-400 font-sans">
                        {skill.nameTh}
                      </span>
                      {skill.isCore && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-gray-400 border border-white/5 uppercase">
                          {t("Core")}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                      {t("Category:")}{t(skill.category)}
                    </span>
                  </div>
                </div>

                {/* Match count recorded */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-gray-300">
                    {skill.count}
                  </span>
                  <span className="text-[10px] text-gray-500 block">{t("events")}</span>
                </div>
              </div>

              {/* Natural Spoken Aliases */}
              <div className="mt-2.5 pt-2 border-t border-[#1d232e]">
                <div className="text-[11px] font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#22c55e]" />
                  <span>{t("Recognized Spoken Phrases & Aliases:")}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {skill.aliases.map((alias, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-[#1a1f29] border border-[#27303f] text-[11px] text-gray-300 font-sans"
                    >
                      &ldquo;{alias}&rdquo;
                    </span>
                  ))}

                  {/* Add alias inline form */}
                  <div className="flex items-center gap-1 ml-1">
                    <input
                      type="text"
                      placeholder={t("+ alias")}
                      value={aliasInput[skill.id] || ''}
                      onChange={(e) =>
                        setAliasInput({ ...aliasInput, [skill.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddAlias(skill.id);
                      }}
                      className="w-20 px-2 py-0.5 rounded-md bg-[#111317] border border-[#282f3c] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#22c55e]"
                    />
                    <button
                      onClick={() => handleAddAlias(skill.id)}
                      className="p-1 rounded bg-[#1e2431] hover:bg-[#283244] text-[#22c55e] border border-[#2c374c]"
                      title={t("Add voice alias")}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Skill Button */}
      <div className="pt-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 rounded-2xl bg-[#14171d] hover:bg-[#1a1f28] border border-dashed border-[#2b3342] text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#22c55e]" />
          <span>{t("Add Custom Scouting Skill")}</span>
        </button>
      </div>

      {/* Custom Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#141820] border border-[#262f3f] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">{t("Add Custom Skill")}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  {t("Skill Name (English)")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("e.g. Reverse Slice")}
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e1014] border border-[#242b38] text-sm text-white focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  {t("Skill Name (Thai)")}</label>
                <input
                  type="text"
                  placeholder="e.g. ตัดหยอดพลิกหน้าไม้"
                  value={newSkillNameTh}
                  onChange={(e) => setNewSkillNameTh(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e1014] border border-[#242b38] text-sm text-white focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  {t("Category")}</label>
                <select
                  value={newSkillCategory}
                  onChange={(e) =>
                    setNewSkillCategory(
                      e.target.value as 'attack' | 'defense' | 'serve' | 'transition'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0e1014] border border-[#242b38] text-sm text-white focus:outline-none focus:border-[#22c55e]"
                >
                  <option value="attack">{t("Attack")}</option>
                  <option value="defense">{t("Defense")}</option>
                  <option value="serve">{t("Serve")}</option>
                  <option value="transition">{t("Transition")}</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1b2029] text-xs font-semibold text-gray-300"
                >
                  {t("Cancel")}</button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-xs font-bold text-white shadow-sm"
                >
                  {t("Create Skill")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
