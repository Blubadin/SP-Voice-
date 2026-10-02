import React from 'react';
import {
  Mic,
  ListOrdered,
  BarChart3,
  Award,
  Zap,
} from 'lucide-react';

interface BottomNavigationProps {
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

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChangeTab,
  eventCount = 0,
  reviewCount = 0,
}) => {
  const tabs: NavTabItem[] = [
    {
      id: 'scout',
      label: 'Scout',
      icon: Mic,
    },
    {
      id: 'sessions',
      label: 'Review',
      icon: ListOrdered,
      badge: reviewCount > 0 ? reviewCount : eventCount > 0 ? eventCount : undefined,
      badgeColor: reviewCount > 0 ? 'bg-[#F2B84B] text-black font-black' : 'bg-[#15181D] text-[#A2AAB7] border border-[#252A33]',
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: BarChart3,
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: Award,
    },
    {
      id: 'testlab',
      label: 'Test Lab',
      icon: Zap,
    },
  ];

  return (
    <nav className="w-full bg-[#101216] border-t border-[#252A33] py-1 px-2 flex items-center justify-around z-30 select-none md:hidden shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-h-[46px] relative ${
              isActive ? 'text-white' : 'text-[#697281] hover:text-[#A2AAB7]'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-white' : 'text-[#697281]'
                }`}
              />
              {tab.badge !== undefined && (
                <span
                  className={`absolute -top-1 -right-2.5 px-1 py-0.2 text-[9px] font-mono font-bold rounded-full ${
                    tab.badgeColor || 'bg-[#15181D] text-[#A2AAB7]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold mt-1 tracking-tight ${
                isActive ? 'text-white' : 'text-[#697281]'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
