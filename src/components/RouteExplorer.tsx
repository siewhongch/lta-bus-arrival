import React, { useState } from 'react';
import { BusStop, BusServiceDetail, LiveBusVehicle } from '../types/bus';
import { BUS_SERVICES_DATABASE, SINGAPORE_BUS_STOPS } from '../data/singaporeBusesData';
import { LTAService } from '../services/ltaService';
import { ArrowLeftRight, Clock, MapPin, Bus, ChevronRight, Activity, ArrowRight } from 'lucide-react';

interface RouteExplorerProps {
  initialServiceNo?: string;
  onSelectStop: (stop: BusStop) => void;
  onViewOnMap?: (serviceNo: string) => void;
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  initialServiceNo = '65',
  onSelectStop,
  onViewOnMap,
}) => {
  const [selectedService, setSelectedService] = useState<string>(initialServiceNo);
  const [direction, setDirection] = useState<1 | 2>(1);

  const availableServices = Object.keys(BUS_SERVICES_DATABASE);
  const serviceDetail: BusServiceDetail | undefined = BUS_SERVICES_DATABASE[selectedService];

  // Active simulated buses on this route
  const activeBuses: LiveBusVehicle[] = LTAService.getLiveVehicles(selectedService);

  const stops = direction === 1 ? serviceDetail?.Direction1Stops || [] : serviceDetail?.Direction2Stops || serviceDetail?.Direction1Stops || [];

  const handleStopClick = (stopCode: string) => {
    const found = SINGAPORE_BUS_STOPS.find(s => s.BusStopCode === stopCode);
    if (found) {
      onSelectStop(found);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 md:p-6">
      {/* Service Selection Carousel */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Select Bus Service
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {availableServices.map(srvNo => (
            <button
              key={srvNo}
              onClick={() => setSelectedService(srvNo)}
              className={`px-3.5 py-2 rounded-xl font-mono font-bold text-sm transition-all shrink-0 ${
                selectedService === srvNo
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {srvNo}
            </button>
          ))}
        </div>
      </div>

      {serviceDetail && (
        <>
          {/* Service Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-12 bg-white text-slate-950 rounded-xl flex items-center justify-center font-mono font-bold text-2xl">
                  {serviceDetail.ServiceNo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/20 text-white">
                      {serviceDetail.Operator}
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      {serviceDetail.Category} Service
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1">
                    {direction === 1 ? serviceDetail.Direction1Name : serviceDetail.Direction2Name || serviceDetail.Direction1Name}
                  </h3>
                </div>
              </div>

              {serviceDetail.Direction2Name && (
                <button
                  onClick={() => setDirection(direction === 1 ? 2 : 1)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors self-start sm:self-auto"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Switch Direction {direction === 1 ? '2' : '1'}</span>
                </button>
              )}
            </div>

            {/* Operating Hours & Frequency */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">AM Peak</span>
                <span className="font-mono font-medium">{serviceDetail.AM_Peak_Freq} mins</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Off-Peak</span>
                <span className="font-mono font-medium">{serviceDetail.AM_Offpeak_Freq} mins</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">First Bus</span>
                <span className="font-mono font-medium">{serviceDetail.FirstBusWeekday}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Last Bus</span>
                <span className="font-mono font-medium">{serviceDetail.LastBusWeekday}</span>
              </div>
            </div>
          </div>

          {/* Route Progression Diagram */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Stop-by-Stop Route Diagram</span>
                <span className="text-xs font-normal text-slate-500">
                  ({stops.length} key stops shown)
                </span>
              </h4>

              {onViewOnMap && (
                <button
                  onClick={() => onViewOnMap(serviceDetail.ServiceNo)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Track on Interactive Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative pl-6 space-y-4">
              {/* Vertical connecting line */}
              <div className="absolute left-[17px] top-3 bottom-3 w-1 bg-slate-200 rounded-full" />

              {stops.map((stopItem, index) => {
                const busAtThisStop = activeBuses.find(b => b.nextStopCode === stopItem.BusStopCode);
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;

                return (
                  <div key={stopItem.BusStopCode} className="relative flex items-start gap-4 group">
                    {/* Circle Node on Timeline */}
                    <div
                      className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isFirst || isLast
                          ? 'bg-slate-900 text-white ring-4 ring-white shadow-xs'
                          : busAtThisStop
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs animate-pulse'
                          : 'bg-white border-2 border-slate-400 text-slate-600 group-hover:border-slate-800'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Stop Details Box */}
                    <div
                      onClick={() => handleStopClick(stopItem.BusStopCode)}
                      className="flex-1 p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-500">
                            {stopItem.BusStopCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {stopItem.Description}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {stopItem.RoadName} · {stopItem.Distance.toFixed(1)} km from origin
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {busAtThisStop && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                            <Bus className="w-3.5 h-3.5" />
                            <span>Arriving (~{Math.round(busAtThisStop.estimatedSecsToNext / 60)} min)</span>
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
