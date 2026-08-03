import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Power,
  RotateCcw,
  Cpu,
  Clock,
  Radio
} from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus;
  onResetEStop: () => void;
  onManualTriggerEStop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onResetEStop,
  onManualTriggerEStop
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (status.sawBladeHalted || status.decision === 'EMERGENCY_STOP') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-800 rounded-lg font-semibold text-xs border border-rose-200 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>EMERGENCY STOP (POWER HALTED)</span>
        </div>
      );
    }
    if (status.decision === 'WARNING') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg font-semibold text-xs border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>WARNING - PROXIMITY BREACH</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs border border-emerald-200">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>SYSTEM SAFE - OPERATIONAL</span>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F4C81] flex items-center justify-center text-white shadow-xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">VisionGuard AI</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase tracking-wider">
              Raspberry Pi 5 Edge
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Industrial Circular Saw Blade Safety Monitor & Diagnostic System
          </p>
        </div>
      </div>

      {/* Center Status & Hardware Info */}
      <div className="hidden lg:flex items-center gap-6">
        {getStatusBadge()}

        <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>CPU: <strong className="text-slate-700">{status.pi5Metrics.cpuTempC}°C</strong></span>
          </div>
          <div className="w-px h-3 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>Latency: <strong className="text-slate-700">{status.inferenceLatencyMs}ms</strong></span>
          </div>
          <div className="w-px h-3 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono font-semibold text-slate-700">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Reset / E-Stop Manual Button */}
      <div className="flex items-center gap-3">
        {status.sawBladeHalted ? (
          <button
            onClick={onResetEStop}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET SAFETY LATCH</span>
          </button>
        ) : (
          <button
            onClick={onManualTriggerEStop}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>MANUAL E-STOP</span>
          </button>
        )}
      </div>
    </header>
  );
};
