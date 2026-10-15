import React, { useState, useEffect } from 'react';
import { BusStop } from './types/bus';
import { SINGAPORE_BUS_STOPS } from './data/singaporeBusesData';
import { LTAService } from './services/ltaService';
import { Header, NavTab } from './components/Header';
import { ArrivalsBoard } from './components/ArrivalsBoard';
import { LiveMap } from './components/LiveMap';
import { RouteExplorer } from './components/RouteExplorer';
import { NearbyView } from './components/NearbyView';
import { FavoritesView } from './components/FavoritesView';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { BusAlarmModal } from './components/BusAlarmModal';
import { Bell, Info, ShieldCheck, CheckCircle2, ChevronRight, Bus } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('arrivals');
  const [selectedStop, setSelectedStop] = useState<BusStop>(SINGAPORE_BUS_STOPS[0]); // Bugis 01012
  const [activeServiceNo, setActiveServiceNo] = useState<string | null>(null);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>(LTAService.getFavorites());
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Commuter simulated user location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 1.30058,
    lng: 103.85611,
    name: 'Bugis / Victoria St',
  });

  // Alarm modal state
  const [alarmState, setAlarmState] = useState<{
    isOpen: boolean;
    serviceNo: string;
    stopDesc: string;
    initialMins: number;
  }>({
    isOpen: false,
    serviceNo: '',
    stopDesc: '',
    initialMins: 3,
  });

  // Toast alert state
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // 15-second refresh cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshSeconds(prev => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshSeconds(15);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleToggleFavorite = (code: string) => {
    const updated = LTAService.toggleFavorite(code);
    setFavoriteCodes(updated);
  };

  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
    setCurrentTab('arrivals');
  };

  const handleViewStopOnMap = (stop: BusStop) => {
    setSelectedStop(stop);
    setCurrentTab('map');
  };

  const handleSelectServiceForRoute = (serviceNo: string) => {
    setActiveServiceNo(serviceNo);
    setCurrentTab('routes');
  };

  const handleOpenAlarm = (serviceNo: string, stopDesc: string, mins: number) => {
    setAlarmState({
      isOpen: true,
      serviceNo,
      stopDesc,
      initialMins: mins,
    });
  };

  const handleSetAlarm = (minutes: number) => {
    setActiveToast(`Alert set: We'll ping you when Bus ${alarmState.serviceNo} is ${minutes} mins away!`);
    setTimeout(() => setActiveToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-20 md:pb-12">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        refreshSeconds={refreshSeconds}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        favoriteCount={favoriteCodes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Alert */}
        {activeToast && (
          <div className="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{activeToast}</span>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white text-sm ml-3 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab 1: Live Arrivals Board */}
        {currentTab === 'arrivals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Live Arrivals */}
            <div className="lg:col-span-8">
              <ArrivalsBoard
                currentStop={selectedStop}
                onSelectStop={handleSelectStop}
                onViewOnMap={handleViewStopOnMap}
                onSelectServiceForRoute={handleSelectServiceForRoute}
                onSetAlarm={handleOpenAlarm}
                isFavorite={favoriteCodes.includes(selectedStop.BusStopCode)}
                onToggleFavorite={handleToggleFavorite}
                userCoords={userLocation}
                refreshSeconds={refreshSeconds}
              />
            </div>

            {/* Right 4 Columns: Interactive Live Map & Fast Switcher */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Vehicle Tracker
                  </h3>
                  <button
                    onClick={() => setCurrentTab('map')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Full Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-200">
                  <LiveMap
                    selectedStop={selectedStop}
                    onSelectStop={handleSelectStop}
                    activeServiceNo={activeServiceNo}
                    onSelectService={setActiveServiceNo}
                    userCoords={userLocation}
                  />
                </div>
              </div>

              {/* LTA Commuter Guide Notice */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 text-xs text-slate-600 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>LTA Official Passenger Indicators</span>
                </div>
                <div className="space-y-1.5 text-[11px] pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>Seats Available (SEA):</strong> Plentiful seats onboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Standing Available (SDA):</strong> Standing space available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>Limited Standing (LSD):</strong> Heavy crowd / near capacity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Screen Live Map */}
        {currentTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Interactive Singapore Bus Network & Real-Time Fleet Map
                </h2>
                <p className="text-xs text-slate-500">
                  Click any stop marker to inspect arrival times, or click moving buses to check occupancy and speed.
                </p>
              </div>

              {selectedStop && (
                <button
                  onClick={() => setCurrentTab('arrivals')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors self-start sm:self-auto shrink-0"
                >
                  View Stop {selectedStop.BusStopCode} Board
                </button>
              )}
            </div>

            <LiveMap
              selectedStop={selectedStop}
              onSelectStop={handleSelectStop}
              activeServiceNo={activeServiceNo}
              onSelectService={setActiveServiceNo}
              userCoords={userLocation}
            />
          </div>
        )}

        {/* Tab 3: Route Explorer */}
        {currentTab === 'routes' && (
          <RouteExplorer
            initialServiceNo={activeServiceNo || '65'}
            onSelectStop={handleSelectStop}
            onViewOnMap={srv => {
              setActiveServiceNo(srv);
              setCurrentTab('map');
            }}
          />
        )}

        {/* Tab 4: Nearby Stops */}
        {currentTab === 'nearby' && (
          <NearbyView
            userLocation={userLocation}
            onChangeLocation={setUserLocation}
            onSelectStop={handleSelectStop}
          />
        )}

        {/* Tab 5: Favorites / Saved Stops */}
        {currentTab === 'favorites' && (
          <FavoritesView
            favoriteCodes={favoriteCodes}
            onToggleFavorite={handleToggleFavorite}
            onSelectStop={handleSelectStop}
          />
        )}
      </main>

      {/* Backend Integration Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />

      {/* Bus Wait Alarm Alert Modal */}
      <BusAlarmModal
        isOpen={alarmState.isOpen}
        serviceNo={alarmState.serviceNo}
        stopDescription={alarmState.stopDesc}
        initialMinutes={alarmState.initialMins}
        onClose={() => setAlarmState(prev => ({ ...prev, isOpen: false }))}
        onSet={handleSetAlarm}
      />
    </div>
  );
}
