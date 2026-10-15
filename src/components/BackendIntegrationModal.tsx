import React, { useState } from 'react';
import { LTAService } from '../services/ltaService';
import { Server, Check, Copy, ExternalLink, Code2, AlertCircle } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [backendUrl, setBackendUrl] = useState(LTAService.getCustomBackendUrl() || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    LTAService.setCustomBackendUrl(backendUrl ? backendUrl.trim() : null);
    setSaveStatus('Config saved successfully! Requests will now query this endpoint.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const sampleExpressSnippet = `// server.ts (Express proxy for LTA DataMall)
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const LTA_API_KEY = process.env.LTA_DATAMALL_KEY; // your LTA DataMall key

app.get('/api/bus-arrival', async (req, res) => {
  const busStopCode = req.query.BusStopCode;
  try {
    const response = await fetch(
      \`http://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${busStopCode}\`,
      {
        headers: {
          AccountKey: LTA_API_KEY || '',
          accept: 'application/json',
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from LTA DataMall' });
  }
});`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleExpressSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Backend Connection Architecture
              </h3>
              <p className="text-xs text-slate-500">
                LTA DataMall v2/v3 contract & proxy integration instructions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            &times;
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
            <h4 className="font-bold text-xs flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Front-End Ready for Immediate Drop-in Connection</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              This application has been built 100% compliant with Singapore LTA DataMall v2/v3 JSON schemas (`BusStopCode`, `Services`, `NextBus`, `Load: SEA/SDA/LSD`, `Type: SD/DD/BD`, `Feature: WAB`). Currently running high-fidelity simulation engine with Singapore transit coordinates.
            </p>
          </div>

          {/* Custom Endpoint URL Configuration */}
          <div>
            <label className="font-bold text-slate-900 block mb-1">
              Target Custom Backend API Endpoint
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Leave blank to keep using the built-in LTA simulation engine, or enter your backend URL (e.g. <code>/api/bus-arrival</code> or full URL):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                placeholder="/api/bus-arrival"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors shrink-0"
              >
                Save Endpoint
              </button>
            </div>
            {saveStatus && (
              <p className="text-emerald-600 font-medium text-[11px] mt-1.5">{saveStatus}</p>
            )}
          </div>

          {/* Express Proxy Code Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-slate-600" />
                <span>Ready-to-paste Express Proxy Snippet</span>
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {sampleExpressSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
