import React from 'react';
import {
  Mic,
  ListOrdered,
  BarChart3,
  Award,
  Settings,
  Zap,
} from 'lucide-react';

interface DesktopNavigationProps {
  activeTab: 'scout' | 'sessions' | 'stats' | 'skills' | 'testlab' | 'settings';
  onChangeTab: (
    tab: 'scout' | 'sessions' | 'stats' | 'skills' | 'testlab' | 'settings'
  ) => void;
  eventCount?: number;
  reviewCount?: number;
}

interface NavTabItem {
  id: 'scout' | 'sessions' | 'stats' | 'skills' | 'testlab' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  activeTab,
  onChangeTab,
  eventCount = 0,
  reviewCount = 0,
}) => {
  const tabs: NavTabItem[] = [
    { id: 'scout', label: 'Live Scout', icon: Mic },
    {
      id: 'sessions',
      label: 'Match Review',
      icon: ListOrdered,
      badge: reviewCount > 0 ? reviewCount : eventCount > 0 ? eventCount : undefined,
      badgeColor: reviewCount > 0 ? 'bg-[#F2B84B]/20 text-[#F2B84B] border border-[#F2B84B]/40' : 'bg-[#15181D] text-[#A2AAB7] border border-[#252A33]',
    },
    { id: 'stats', label: 'Match Analytics', icon: BarChart3 },
    { id: 'skills', label: 'Skills & Aliases', icon: Award },
    { id: 'testlab', label: 'Field Test Lab', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex items-center gap-1 p-1 bg-[#101216] border border-[#252A33] rounded-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-[#1B1F26] text-white shadow-sm border border-[#252A33]'
                : 'text-[#697281] hover:text-[#F4F6F8] hover:bg-[#15181D]'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isActive ? 'text-white' : 'text-[#697281]'
              }`}
            />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  tab.badgeColor || 'bg-[#15181D] text-[#A2AAB7]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
