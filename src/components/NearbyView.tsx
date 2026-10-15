import React, { useState, useEffect } from 'react';
import { BusStop, BusArrivalResponse } from '../types/bus';
import { SINGAPORE_HOTSPOTS } from '../data/singaporeBusesData';
import { LTAService } from '../services/ltaService';
import { BusTimingBadge } from './BusTimingBadge';
import { MapPin, Navigation, Compass, ChevronRight, Footprints, RefreshCw } from 'lucide-react';

interface NearbyViewProps {
  userLocation: { lat: number; lng: number; name: string };
  onChangeLocation: (loc: { lat: number; lng: number; name: string }) => void;
  onSelectStop: (stop: BusStop) => void;
}

export const NearbyView: React.FC<NearbyViewProps> = ({
  userLocation,
  onChangeLocation,
  onSelectStop,
}) => {
  const [nearbyStops, setNearbyStops] = useState<BusStop[]>([]);
  const [arrivalsMap, setArrivalsMap] = useState<Record<string, BusArrivalResponse>>({});
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const stops = LTAService.getNearbyBusStops(userLocation.lat, userLocation.lng, 1500);
    setNearbyStops(stops.slice(0, 8));

    // Fetch brief arrivals for the top nearby stops
    stops.slice(0, 5).forEach(async stop => {
      const resp = await LTAService.fetchBusArrivals(stop.BusStopCode);
      setArrivalsMap(prev => ({ ...prev, [stop.BusStopCode]: resp }));
    });
  }, [userLocation]);

  const handleDeviceGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        onChangeLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'Current Device Location',
        });
      },
      err => {
        setIsLocating(false);
        console.warn('Geolocation denied or unavailable, maintaining preset hotspot');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Location Bar & Quick Hotspot Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Active Commuter Anchor
              </span>
              <span className="text-base font-bold text-slate-900">
                {userLocation.name}
              </span>
            </div>
          </div>

          <button
            onClick={handleDeviceGPS}
            disabled={isLocating}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating Device...' : 'Use My GPS'}</span>
          </button>
        </div>

        {/* Hotspot buttons */}
        <div className="pt-3">
          <span className="text-xs font-medium text-slate-500 block mb-2">
            Or test nearby stops around Singapore hubs:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SINGAPORE_HOTSPOTS.map(spot => (
              <button
                key={spot.id}
                onClick={() =>
                  onChangeLocation({
                    lat: spot.lat,
                    lng: spot.lng,
                    name: spot.name,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  userLocation.name.includes(spot.name.split('/')[0])
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {spot.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby Bus Stops List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Stops Within Walking Distance</span>
            <span className="text-xs font-normal text-slate-500">
              ({nearbyStops.length} stops found)
            </span>
          </h3>
        </div>

        {nearbyStops.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
            No LTA bus stops detected within 1.5 km of selected coordinate. Try switching to a Singapore hotspot above.
          </div>
        ) : (
          nearbyStops.map(stop => {
            const distance = stop.distanceMeters ?? 0;
            const walkMins = Math.max(1, Math.round(distance / 75)); // ~75 meters/min walking
            const arrivals = arrivalsMap[stop.BusStopCode];

            return (
              <div
                key={stop.BusStopCode}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {stop.BusStopCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {stop.Description}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stop.RoadName}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Footprints className="w-3.5 h-3.5" />
                      <span>{distance}m · ~{walkMins} min walk</span>
                    </div>

                    <button
                      onClick={() => onSelectStop(stop)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>All Buses</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Preview of Arriving Buses at this Stop */}
                <div className="pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Next Arriving Services
                  </div>

                  {arrivals ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {arrivals.Services.slice(0, 4).map(srv => {
                        const mins = srv.NextBus?.estimatedMinutes ?? 0;
                        const isArr = mins <= 1;
                        return (
                          <div
                            key={srv.ServiceNo}
                            onClick={() => onSelectStop(stop)}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {srv.ServiceNo}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className={`font-mono text-xs font-bold ${
                                  isArr ? 'text-emerald-600' : 'text-slate-700'
                                }`}
                              >
                                {isArr ? 'Arr' : `${mins}m`}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  srv.NextBus?.Load === 'SEA'
                                    ? 'bg-emerald-500'
                                    : srv.NextBus?.Load === 'SDA'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching live predictions...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
