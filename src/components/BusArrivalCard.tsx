import React, { useState } from 'react';
import { BusArrivalService, BusStop } from '../types/bus';
import { BusTimingBadge } from './BusTimingBadge';
import { BUS_SERVICES_DATABASE } from '../data/singaporeBusesData';
import { MapPin, Bell, ChevronDown, ChevronUp, Navigation, AlertCircle, Info } from 'lucide-react';

interface BusArrivalCardProps {
  service: BusArrivalService;
  busStop: BusStop;
  onSelectServiceForRoute?: (serviceNo: string) => void;
  onSetAlarm?: (serviceNo: string, stopDesc: string, mins: number) => void;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  service,
  busStop,
  onSelectServiceForRoute,
  onSetAlarm,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const serviceDetail = BUS_SERVICES_DATABASE[service.ServiceNo];

  const operatorColors: Record<string, { bg: string; text: string }> = {
    SBST: { bg: 'bg-purple-100 text-purple-900', text: 'SBS Transit' },
    SMRT: { bg: 'bg-rose-100 text-rose-900', text: 'SMRT Buses' },
    TTS: { bg: 'bg-emerald-100 text-emerald-900', text: 'Tower Transit' },
    GAS: { bg: 'bg-amber-100 text-amber-900', text: 'Go-Ahead SG' },
  };

  const opInfo = operatorColors[service.Operator] || operatorColors.SBST;
  const destination = serviceDetail?.Direction1Name || 'En route across Singapore';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all p-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-bold text-xl tracking-tight shadow-xs">
            {service.ServiceNo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${opInfo.bg}`}>
                {service.Operator}
              </span>
              {service.category && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {service.category}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-0.5 line-clamp-1 max-w-[240px] sm:max-w-md">
              to <span className="font-medium text-slate-800">{destination}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSelectServiceForRoute && (
            <button
              onClick={() => onSelectServiceForRoute(service.ServiceNo)}
              title="Track Route on Map"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <Navigation className="w-4 h-4 text-emerald-600" />
            </button>
          )}
          {onSetAlarm && (
            <button
              onClick={() => onSetAlarm(service.ServiceNo, busStop.Description, service.NextBus?.estimatedMinutes ?? 3)}
              title="Set arrival alarm alert"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <Bell className="w-4 h-4 text-amber-600" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Arrival Prediction Timings */}
      <div className="grid grid-cols-3 gap-2">
        <BusTimingBadge timing={service.NextBus} label="Next" />
        <BusTimingBadge timing={service.NextBus2} label="2nd" />
        <BusTimingBadge timing={service.NextBus3} label="3rd" />
      </div>

      {/* Expand Details Trigger */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span>{isExpanded ? 'Hide service frequencies & details' : 'View service frequency & route'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[11px] text-slate-400 font-mono">
          Stop {busStop.BusStopCode}
        </span>
      </div>

      {/* Expanded frequency & schedule panel */}
      {isExpanded && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
          {serviceDetail ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">AM Peak Freq</span>
                  <span className="font-mono font-medium">{serviceDetail.AM_Peak_Freq} mins</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Off-Peak Freq</span>
                  <span className="font-mono font-medium">{serviceDetail.AM_Offpeak_Freq} mins</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">First Bus</span>
                  <span className="font-mono font-medium">{serviceDetail.FirstBusWeekday} hrs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Last Bus</span>
                  <span className="font-mono font-medium">{serviceDetail.LastBusWeekday} hrs</span>
                </div>
              </div>

              {onSelectServiceForRoute && (
                <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                  <button
                    onClick={() => onSelectServiceForRoute(service.ServiceNo)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Inspect Full Route & Live Bus Positions</span>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Standard trunk route running between Singapore interchanges.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
