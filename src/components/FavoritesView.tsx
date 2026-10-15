import React, { useState, useEffect } from 'react';
import { BusStop, BusArrivalResponse } from '../types/bus';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBusesData';
import { LTAService } from '../services/ltaService';
import { Star, ChevronRight, Bus, Trash2, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface FavoritesViewProps {
  favoriteCodes: string[];
  onToggleFavorite: (busStopCode: string) => void;
  onSelectStop: (stop: BusStop) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteCodes,
  onToggleFavorite,
  onSelectStop,
}) => {
  const [arrivals, setArrivals] = useState<Record<string, BusArrivalResponse>>({});
  const [loading, setLoading] = useState(false);

  const favoritedStops = SINGAPORE_BUS_STOPS.filter(s => favoriteCodes.includes(s.BusStopCode));

  const loadAllArrivals = async () => {
    setLoading(true);
    const results: Record<string, BusArrivalResponse> = {};
    for (const stop of favoritedStops) {
      results[stop.BusStopCode] = await LTAService.fetchBusArrivals(stop.BusStopCode);
    }
    setArrivals(results);
    setLoading(false);
  };

  useEffect(() => {
    loadAllArrivals();
    const interval = setInterval(loadAllArrivals, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [favoriteCodes]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Saved Commute Stops</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pin your home, workplace, and regular transit interchanges for instant 1-tap departure timings.
          </p>
        </div>

        <button
          onClick={loadAllArrivals}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Favorited Stops */}
      {favoritedStops.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Saved Bus Stops Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse bus stops from the "Arrivals" or "Nearby" tab and click the star icon to keep them saved here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favoritedStops.map(stop => {
            const data = arrivals[stop.BusStopCode];

            return (
              <div
                key={stop.BusStopCode}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all p-4"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {stop.BusStopCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {stop.Description}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {stop.RoadName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFavorite(stop.BusStopCode)}
                      title="Remove from favorites"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectStop(stop)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>Open Board</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Arriving services */}
                <div className="pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {data?.Services.map(srv => {
                      const mins = srv.NextBus?.estimatedMinutes ?? 0;
                      const isArr = mins <= 1;

                      return (
                        <div
                          key={srv.ServiceNo}
                          onClick={() => onSelectStop(stop)}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {srv.ServiceNo}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                srv.NextBus?.Load === 'SEA'
                                  ? 'bg-emerald-500'
                                  : srv.NextBus?.Load === 'SDA'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>

                          <div className="mt-2 flex items-baseline justify-between text-xs">
                            <span
                              className={`font-mono font-bold ${
                                isArr ? 'text-emerald-600' : 'text-slate-800'
                              }`}
                            >
                              {isArr ? 'Arr' : `${mins}m`}
                            </span>
                            {srv.NextBus?.Type && (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                {srv.NextBus.Type}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
