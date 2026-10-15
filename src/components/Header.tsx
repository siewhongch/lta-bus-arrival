import React from 'react';
import { Bus, Map, GitFork, Compass, Star, Server, RefreshCw } from 'lucide-react';

export type NavTab = 'arrivals' | 'map' | 'routes' | 'nearby' | 'favorites';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenBackendModal: () => void;
  refreshSeconds: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  favoriteCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenBackendModal,
  refreshSeconds,
  onManualRefresh,
  isRefreshing,
  favoriteCount,
}) => {
  return (
    <>
      {/* Desktop & Tablet Top Bar (Adhering to strict 3-zone contract) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element, no adjacent descriptor pills) */}
          <button
            onClick={() => onSelectTab('arrivals')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity text-left flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm">
              SG
            </span>
            <span>Bus Tracker</span>
          </button>

          {/* Zone 2: 4–5 Single-Line Concise Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('arrivals')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'arrivals' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              Arrivals
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'map' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => onSelectTab('routes')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'routes' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              Bus Routes
            </button>
            <button
              onClick={() => onSelectTab('nearby')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'nearby' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              Nearby Stops
            </button>
            <button
              onClick={() => onSelectTab('favorites')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                currentTab === 'favorites' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              <span>Saved</span>
              {favoriteCount > 0 && (
                <span className="text-[11px] font-mono text-slate-500">({favoriteCount})</span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onManualRefresh}
              title="Manual update"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-mono tabular-nums">{refreshSeconds}s</span>
            </button>

            <button
              onClick={onOpenBackendModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 active:scale-95 transition-all whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Backend Setup</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (Ergonomic thumb zone) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
          <button
            onClick={() => onSelectTab('arrivals')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'arrivals' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <Bus className="w-5 h-5" />
            <span className="text-[10px] mt-1">Arrivals</span>
          </button>

          <button
            onClick={() => onSelectTab('map')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'map' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] mt-1">Live Map</span>
          </button>

          <button
            onClick={() => onSelectTab('routes')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'routes' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <GitFork className="w-5 h-5" />
            <span className="text-[10px] mt-1">Routes</span>
          </button>

          <button
            onClick={() => onSelectTab('nearby')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'nearby' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-1">Nearby</span>
          </button>

          <button
            onClick={() => onSelectTab('favorites')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'favorites' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <Star className="w-5 h-5" />
            <span className="text-[10px] mt-1">Saved</span>
          </button>
        </div>
      </div>
    </>
  );
};
