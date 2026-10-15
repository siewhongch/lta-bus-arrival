import React from 'react';
import { BusTiming } from '../types/bus';
import { Accessibility, Layers } from 'lucide-react';

interface BusTimingBadgeProps {
  timing: BusTiming;
  label: 'Next' | '2nd' | '3rd';
  onAlarmClick?: () => void;
}

export const BusTimingBadge: React.FC<BusTimingBadgeProps> = ({ timing, label }) => {
  if (!timing || !timing.EstimatedArrival || timing.estimatedMinutes === 999) {
    return (
      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100/70 text-slate-400 text-xs min-h-[64px]">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <span className="font-mono text-sm mt-0.5">—</span>
      </div>
    );
  }

  const mins = timing.estimatedMinutes ?? 0;
  const isArriving = mins <= 1;

  // LTA Load standards:
  // SEA = Seats Available (Green)
  // SDA = Standing Available (Amber)
  // LSD = Limited Standing (Red)
  const loadConfig = {
    SEA: {
      label: 'Seats',
      indicatorBg: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    SDA: {
      label: 'Standing',
      indicatorBg: 'bg-amber-500',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    LSD: {
      label: 'Full',
      indicatorBg: 'bg-rose-500',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    },
  }[timing.Load || 'SEA'];

  return (
    <div className="flex flex-col p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-1.5" title={loadConfig.label}>
          <span className={`w-2 h-2 rounded-full ${loadConfig.indicatorBg}`} aria-hidden="true" />
          <span className="text-[10px] font-medium text-slate-600">{loadConfig.label}</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-mono font-bold text-lg tabular-nums tracking-tight ${
              isArriving ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {isArriving ? 'Arr' : `${mins}`}
          </span>
          {!isArriving && <span className="text-xs text-slate-500 font-medium">min</span>}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          {timing.Type === 'DD' && (
            <span
              className="text-[10px] font-bold tracking-tight text-slate-700 bg-slate-100 px-1 py-0.5 rounded"
              title="Double Decker"
            >
              DD
            </span>
          )}
          {timing.Type === 'BD' && (
            <span
              className="text-[10px] font-bold tracking-tight text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded"
              title="Bendy Bus"
            >
              BD
            </span>
          )}
          {timing.Type === 'SD' && (
            <span
              className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1 py-0.5 rounded"
              title="Single Deck"
            >
              SD
            </span>
          )}
          {timing.Feature === 'WAB' && (
            <span title="Wheelchair Accessible Bus">
              <Accessibility className="w-3.5 h-3.5 text-blue-600" />
            </span>
          )}
        </div>
      </div>

      {timing.plateNumber && (
        <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>{timing.plateNumber}</span>
          {timing.speedKmH && <span>{timing.speedKmH} km/h</span>}
        </div>
      )}
    </div>
  );
};
