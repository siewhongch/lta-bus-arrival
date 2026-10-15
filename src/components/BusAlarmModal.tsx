import React, { useState } from 'react';
import { Bell, Check, Clock, Volume2, X } from 'lucide-react';

interface BusAlarmModalProps {
  isOpen: boolean;
  serviceNo: string;
  stopDescription: string;
  initialMinutes: number;
  onClose: () => void;
  onSet: (minutes: number) => void;
}

export const BusAlarmModal: React.FC<BusAlarmModalProps> = ({
  isOpen,
  serviceNo,
  stopDescription,
  initialMinutes,
  onClose,
  onSet,
}) => {
  const [notifyMins, setNotifyMins] = useState<number>(Math.min(3, Math.max(1, initialMinutes - 1)));
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSet(notifyMins);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Bell className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          Set Arrival Alert
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Bus <span className="font-bold text-slate-800">{serviceNo}</span> at{' '}
          <span className="font-medium text-slate-800">{stopDescription}</span>
        </p>

        <div className="my-6">
          <label className="text-xs font-semibold text-slate-500 block mb-2">
            Notify me when bus is:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 5].map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setNotifyMins(mins)}
                className={`py-2 px-3 rounded-xl font-medium text-xs transition-all ${
                  notifyMins === mins
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mins} mins away
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Alarm Activated!</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>Arm Alert Notification</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
