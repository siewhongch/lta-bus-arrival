import React, { useState, useEffect } from 'react';
import { BusStop, BusArrivalResponse } from '../types/bus';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBusesData';
import { LTAService } from '../services/ltaService';
import { BusArrivalCard } from './BusArrivalCard';
import {
  Search,
  Star,
  MapPin,
  RefreshCw,
  Navigation,
  Compass,
  Train,
  SlidersHorizontal,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';

interface ArrivalsBoardProps {
  currentStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  onViewOnMap: (stop: BusStop) => void;
  onSelectServiceForRoute: (serviceNo: string) => void;
  onSetAlarm: (serviceNo: string, stopDesc: string, mins: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (stopCode: string) => void;
  userCoords?: { lat: number; lng: number } | null;
  refreshSeconds: number;
}

export const ArrivalsBoard: React.FC<ArrivalsBoardProps> = ({
  currentStop,
  onSelectStop,
  onViewOnMap,
  onSelectServiceForRoute,
  onSetAlarm,
  isFavorite,
  onToggleFavorite,
  userCoords,
  refreshSeconds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [arrivalsData, setArrivalsData] = useState<BusArrivalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState(false);

  // Search results
  const searchResults = searchQuery.trim() ? LTAService.searchBusStops(searchQuery) : [];

  // Fetch arrival timings
  const fetchArrivals = async () => {
    setLoading(true);
    try {
      const data = await LTAService.fetchBusArrivals(currentStop.BusStopCode);
      setArrivalsData(data);
    } catch (err) {
      console.error('Error fetching arrivals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
    setServiceFilter('ALL');
  }, [currentStop]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentStop.BusStopCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const services = arrivalsData?.Services || [];
  const filteredServices =
    serviceFilter === 'ALL'
      ? services
      : services.filter(s => s.ServiceNo === serviceFilter);

  return (
    <div className="space-y-6">
      {/* Search & Quick Stop Switcher */}
      <div className="relative">
        <div className="relative bg-white rounded-2xl shadow-xs border border-slate-200/90 flex items-center px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search 5-digit bus stop code (e.g. 01012), road, landmark, or bus #..."
            className="w-full text-xs sm:text-sm bg-transparent outline-hidden text-slate-900 placeholder:text-slate-400 font-sans py-2"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsSearchOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {searchResults.slice(0, 10).map(stop => (
                <div
                  key={stop.BusStopCode}
                  onClick={() => {
                    onSelectStop(stop);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {stop.BusStopCode}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {stop.Description}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stop.RoadName} · {stop.services.length} services
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {stop.region}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Primary Bus Stop Detail Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                onClick={handleCopyCode}
                title="Click to copy bus stop code"
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs shadow-xs transition-colors"
              >
                <span>{currentStop.BusStopCode}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                )}
              </button>

              <span className="text-xs font-semibold text-slate-500">
                {currentStop.RoadName}
              </span>

              {currentStop.mrtConnections && currentStop.mrtConnections.length > 0 && (
                <div className="flex items-center gap-1">
                  {currentStop.mrtConnections.map(mrt => (
                    <span
                      key={mrt}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                    >
                      <Train className="w-3 h-3" />
                      <span>{mrt}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {currentStop.Description}
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span>{currentStop.region} Region</span>
              <span>·</span>
              <span>{currentStop.services.length} Operating Services</span>
              <span>·</span>
              <span className="font-mono text-emerald-600 font-medium">
                Auto-updates in {refreshSeconds}s
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onToggleFavorite(currentStop.BusStopCode)}
              className={`p-2.5 rounded-xl border transition-all ${
                isFavorite
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title={isFavorite ? 'Remove from saved' : 'Save this bus stop'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            <button
              onClick={() => onViewOnMap(currentStop)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>View on Map</span>
            </button>

            <button
              onClick={fetchArrivals}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Refresh timings now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Service Filter Tabs (Interactive Segmented Control) */}
        <div className="pt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 pl-1 shrink-0">Filter:</span>
            <button
              onClick={() => setServiceFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                serviceFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Buses ({services.length})
            </button>

            {services.map(srv => (
              <button
                key={srv.ServiceNo}
                onClick={() => setServiceFilter(srv.ServiceNo)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all shrink-0 ${
                  serviceFilter === srv.ServiceNo
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {srv.ServiceNo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Arrival Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Real-Time Arrival Predictions
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Seats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Standing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Full</span>
            </div>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            {loading ? 'Retrieving live timings from LTA...' : 'No buses match the selected filter.'}
          </div>
        ) : (
          filteredServices.map(srv => (
            <BusArrivalCard
              key={srv.ServiceNo}
              service={srv}
              busStop={currentStop}
              onSelectServiceForRoute={onSelectServiceForRoute}
              onSetAlarm={onSetAlarm}
            />
          ))
        )}
      </div>

      {/* Quick Jump Bus Stops Strip */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Popular Singapore Interchanges & Bus Stops
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {SINGAPORE_BUS_STOPS.slice(0, 8).map(stop => (
            <button
              key={stop.BusStopCode}
              onClick={() => onSelectStop(stop)}
              className={`p-3 rounded-2xl text-left border transition-all ${
                currentStop.BusStopCode === stop.BusStopCode
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/70 border-slate-100 text-slate-800 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-mono text-xs font-bold ${
                    currentStop.BusStopCode === stop.BusStopCode ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {stop.BusStopCode}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    currentStop.BusStopCode === stop.BusStopCode
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/60 text-slate-600'
                  }`}
                >
                  {stop.region}
                </span>
              </div>
              <div className="font-bold text-xs truncate">{stop.Description}</div>
              <div
                className={`text-[11px] truncate mt-0.5 ${
                  currentStop.BusStopCode === stop.BusStopCode ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {stop.RoadName}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
