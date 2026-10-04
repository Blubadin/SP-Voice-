import {LocaleProvider} from './i18n/LocaleContext';
import {useLocale} from './i18n/LocaleContext';
import React,{lazy,Suspense} from 'react';
import { ScoutProvider, useScout } from './stores/ScoutContext';
import { SpHeader } from './components/common/SpHeader';
import { DesktopNavigation } from './components/common/DesktopNavigation';
import { BottomNavigation } from './components/common/BottomNavigation';
import { ScoutScreen } from './features/scout/ScoutScreen';
const StatsScreen=lazy(()=>import('./features/stats/StatsScreen').then(m=>({default:m.StatsScreen})));
const SkillsScreen=lazy(()=>import('./features/skills/SkillsScreen').then(m=>({default:m.SkillsScreen})));
const SettingsScreen=lazy(()=>import('./features/settings/SettingsScreen').then(m=>({default:m.SettingsScreen})));
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { NewSessionModal } from './features/session/NewSessionModal';
import { EditEventModal } from './features/events/EditEventModal';
const SessionReviewScreen=lazy(()=>import('./features/session/SessionReviewScreen').then(m=>({default:m.SessionReviewScreen})));
const FieldTestLab=lazy(()=>import('./features/developer/FieldTestLab').then(m=>({default:m.FieldTestLab})));

const AppContent: React.FC = () => {
  const {t}=useLocale();

  const {
    activeTab,
    apiStatus,
    setActiveTab,
    currentSession,
    showOnboarding,
    setShowOnboarding,
    showNewSessionModal,
    setShowNewSessionModal,
    editingEvent,
    setEditingEvent,
    updateEvent,
  } = useScout();

  const reviewCount = currentSession.events.filter(
    (e) =>
      e.status === 'REVIEW_REQUIRED' ||
      e.needsReview === true ||
      (e as any).status === 'review_required'
  ).length;

  const isScoutTab = activeTab === 'scout';

  return (
    <div
      className={`bg-[#0A0B0D] text-[#F4F6F8] flex flex-col justify-between font-sans selection:bg-white/20 selection:text-white ${
        isScoutTab
          ? 'min-h-screen pb-20 md:pb-0'
          : 'min-h-screen'
      }`}
    >
      {/* Top Header */}
      <SpHeader />

      {/* Main View Area */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4 ${
          isScoutTab ? 'overflow-y-auto' : 'overflow-y-auto pb-20 md:pb-8'
        }`}
      >
        {/* Desktop Navigation Tabs Bar (Visible on tablet & desktop >= 768px) */}
        <div className="hidden md:flex items-center justify-between mb-4">
          <DesktopNavigation
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            eventCount={currentSession.events.length}
            reviewCount={reviewCount}
          />

          <div className="flex items-center gap-2 text-xs text-[#A2AAB7]">
            <span className="w-2 h-2 rounded-full bg-[#1FB56A]" />
            <span className="font-mono text-[11px]">{apiStatus.hasApiKey?t('AI connection configured'):t('Local vocabulary rules ready')}</span>
          </div>
        </div>

        {/* Tab Router */}
        <Suspense fallback={<p role="status">{t('Loading…')}</p>}>
        {activeTab === 'scout' && <ScoutScreen />}

        {activeTab === 'sessions' && <SessionReviewScreen />}

        {activeTab === 'stats' && <StatsScreen />}

        {activeTab === 'skills' && <SkillsScreen />}

        {activeTab === 'testlab' && <FieldTestLab />}

        {activeTab === 'settings' && <SettingsScreen />}
        </Suspense>
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        eventCount={currentSession.events.length}
        reviewCount={reviewCount}
      />

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {/* New Session Setup Modal */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
      />

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

export default function App() {

  return (
    <ScoutProvider>
      <LocaleProvider><AppContent /></LocaleProvider>
    </ScoutProvider>
  );
}
