import React from 'react';
import {
  Activity,
  Camera,
  Sun,
  Moon,
  EyeOff,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';
import { CameraHealthDiagnostics, SystemStatus } from '../types';

interface SystemStatusViewProps {
  cameraHealth: CameraHealthDiagnostics;
  status: SystemStatus;
  onUpdateDiagnostics: (diag: Partial<CameraHealthDiagnostics>) => void;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({
  cameraHealth,
  status,
  onUpdateDiagnostics
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Camera Health & System Diagnostics</h2>
          <p className="text-xs text-slate-500">
            Continuous automated diagnostics evaluating Laplacian blur, lighting lux, lens obstruction, and frame freezing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdateDiagnostics({
                rating: 'Healthy',
                blurScore: 195.0,
                isObstructed: false,
                isFrozen: false,
                brightnessLux: 520,
                lightState: 'NORMAL'
              })
            }
            className="px-3 py-1.5 bg-[#0F4C81] text-white rounded-lg text-xs font-semibold hover:bg-[#0c3e6b] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Camera Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Main Rating Banner */}
      <div
        className={`p-6 rounded-2xl border flex flex-wrap items-center justify-between gap-6 shadow-xs ${
          cameraHealth.rating === 'Healthy'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : cameraHealth.rating === 'Warning'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
              cameraHealth.rating === 'Healthy'
                ? 'bg-emerald-600'
                : cameraHealth.rating === 'Warning'
                ? 'bg-amber-600'
                : 'bg-rose-600'
            }`}
          >
            {cameraHealth.rating === 'Healthy' ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : cameraHealth.rating === 'Warning' ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <AlertOctagon className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold tracking-tight">Camera Health: {cameraHealth.rating}</h3>
              <span className="px-2 py-0.5 bg-white/60 text-xs font-bold rounded-full border border-current">
                Live Sensor Feed
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {cameraHealth.rating === 'Healthy'
                ? 'Image clarity, frame rate, and illumination are optimal for YOLOv8 hand detection.'
                : cameraHealth.rating === 'Warning'
                ? 'Minor image degradation or dust accumulation detected on lens. Cleaning recommended.'
                : 'Critical camera fault detected. Safety interlock fallback activated.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Laplacian Blur Variance</span>
            <span className="font-mono font-bold text-sm text-slate-800">{cameraHealth.blurScore.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 block">&gt; 100 is Crisp</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Ambient Illumination</span>
            <span className="font-mono font-bold text-sm text-slate-800">{cameraHealth.brightnessLux} lx</span>
            <span className="text-[10px] text-slate-400 block">300-800 lx Optimal</span>
          </div>
        </div>
      </div>

      {/* 4 Diagnostic Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Meter 1: Blur Check */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              Lens Blur (Laplacian)
            </span>
            <span className={cameraHealth.blurScore > 100 ? 'text-emerald-600' : 'text-amber-600'}>
              {cameraHealth.blurScore > 100 ? 'PASSED' : 'BLURRED'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                cameraHealth.blurScore > 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (cameraHealth.blurScore / 250) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Calculates 2D second derivative variance across image gradients to ensure sharp saw edge detection.
          </p>

          <button
            onClick={() =>
              onUpdateDiagnostics({
                blurScore: cameraHealth.blurScore > 100 ? 38.5 : 185.0,
                rating: cameraHealth.blurScore > 100 ? 'Warning' : 'Healthy'
              })
            }
            className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            {cameraHealth.blurScore > 100 ? 'Simulate Dust Blur' : 'Clear Blur'}
          </button>
        </div>

        {/* Meter 2: Illumination Check */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Lighting (Lux Level)
            </span>
            <span className="text-slate-800 font-mono">{cameraHealth.brightnessLux} lx</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (cameraHealth.brightnessLux / 1000) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Monitors Workshop ambient light levels to prevent extreme glare or dark shadows around saw blade.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onUpdateDiagnostics({
                  brightnessLux: 25,
                  lightState: 'TOO_DARK',
                  rating: 'Warning'
                })
              }
              className="py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 cursor-pointer"
            >
              Darkness
            </button>
            <button
              onClick={() =>
                onUpdateDiagnostics({
                  brightnessLux: 1400,
                  lightState: 'TOO_BRIGHT',
                  rating: 'Warning'
                })
              }
              className="py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 cursor-pointer"
            >
              Glare
            </button>
          </div>
        </div>

        {/* Meter 3: Obstruction Check */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
            <span className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-500" />
              Lens Obstruction
            </span>
            <span className={cameraHealth.isObstructed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
              {cameraHealth.isObstructed ? 'OBSTRUCTED' : 'CLEAR'}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl text-center font-bold text-xs ${
              cameraHealth.isObstructed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {cameraHealth.isObstructed ? 'LENS COVERED / DUST SHIELDED' : 'UNOBSTRUCTED FIELD OF VIEW'}
          </div>

          <p className="text-[11px] text-slate-500">
            Detects complete blackouts or uniform blocking shapes covering camera lens field.
          </p>

          <button
            onClick={() =>
              onUpdateDiagnostics({
                isObstructed: !cameraHealth.isObstructed,
                rating: !cameraHealth.isObstructed ? 'Critical' : 'Healthy'
              })
            }
            className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            {cameraHealth.isObstructed ? 'Remove Obstruction' : 'Simulate Obstruction'}
          </button>
        </div>

        {/* Meter 4: Frame Freeze & Connection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-500" />
              Frame Frozen Check
            </span>
            <span className="text-emerald-600 font-bold">28.5 FPS</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs font-mono text-slate-700">
            Frame Hash: 0xF84A12E (OK)
          </div>

          <p className="text-[11px] text-slate-500">
            Computes pixel differential across consecutive frames to confirm feed is live and not frozen.
          </p>

          <button
            onClick={() =>
              onUpdateDiagnostics({
                rating: 'Healthy',
                blurScore: 190.0,
                brightnessLux: 500,
                isObstructed: false
              })
            }
            className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 cursor-pointer"
          >
            Pass Diagnostics
          </button>
        </div>
      </div>

      {/* Decision Engine Rules Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm">Decision Engine Fail-Safe Matrix</h3>
          <p className="text-xs text-slate-500">Truth table evaluating hand detection + camera health for output relay</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-2.5">Hand Detected</th>
                <th className="p-2.5">In Danger Zone</th>
                <th className="p-2.5">Camera Health</th>
                <th className="p-2.5">Decision Output</th>
                <th className="p-2.5">GPIO Relay Pin 18</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="bg-rose-50/50">
                <td className="p-2.5 font-semibold text-rose-800">YES (&gt;85%)</td>
                <td className="p-2.5 font-bold text-rose-800">YES (Breached)</td>
                <td className="p-2.5">Healthy</td>
                <td className="p-2.5"><span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded">EMERGENCY STOP</span></td>
                <td className="p-2.5 font-mono text-rose-700 font-bold">TRIPPED (0V)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">YES (&gt;85%)</td>
                <td className="p-2.5 text-amber-700 font-semibold">NO (Proximity &lt;150mm)</td>
                <td className="p-2.5">Healthy</td>
                <td className="p-2.5"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">WARNING</span></td>
                <td className="p-2.5 font-mono text-emerald-700">ENERGIZED (3.3V)</td>
              </tr>
              <tr>
                <td className="p-2.5">NO</td>
                <td className="p-2.5">NO</td>
                <td className="p-2.5 text-rose-600 font-semibold">Critical / Blocked</td>
                <td className="p-2.5"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">CAMERA FAILURE</span></td>
                <td className="p-2.5 font-mono text-rose-700 font-bold">TRIPPED (SAFETY FALLBACK)</td>
              </tr>
              <tr className="bg-emerald-50/30">
                <td className="p-2.5">NO</td>
                <td className="p-2.5">NO</td>
                <td className="p-2.5 text-emerald-700 font-semibold">Healthy</td>
                <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">SAFE</span></td>
                <td className="p-2.5 font-mono text-emerald-700">ENERGIZED (3.3V)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
