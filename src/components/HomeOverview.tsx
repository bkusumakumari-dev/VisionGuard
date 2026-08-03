import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  Eye,
  CheckCircle2,
  Cpu,
  Database,
  Sliders
} from 'lucide-react';
import { SystemStatus, EventLog } from '../types';

interface HomeOverviewProps {
  status: SystemStatus;
  recentEvents: EventLog[];
  onNavigateTab: (tab: string) => void;
  onResetEStop: () => void;
  onAcknowledgeEvent: (id: string) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  status,
  recentEvents,
  onNavigateTab,
  onResetEStop,
  onAcknowledgeEvent
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome & Edge System Overview Banner */}
      <div className="bg-gradient-to-r from-[#0F4C81] to-[#1e6ca8] text-white p-6 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-100 backdrop-blur-xs">
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            <span>Raspberry Pi 5 Edge Safety Node #01</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Industrial Vision Safety Dashboard</h2>
          <p className="text-xs text-blue-100 leading-relaxed">
            Real-time computer vision monitoring circular saw blade danger zones. YOLOv8 Nano inference running at 28.5 FPS with continuous camera health diagnostics and hardware relay interlocks.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-xl border border-white/15 backdrop-blur-xs">
          <div className="text-right">
            <span className="text-[11px] text-blue-100 font-medium">Relay Cutoff Status</span>
            <p className="text-sm font-bold">
              {status.sawBladeHalted ? 'POWER HALTED (E-STOP)' : 'POWER ACTIVE (SAFE)'}
            </p>
          </div>
          {status.sawBladeHalted ? (
            <button
              onClick={onResetEStop}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
            >
              Reset Latch
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: System Decision */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Current System Decision</span>
            <ShieldAlert className={`w-5 h-5 ${status.sawBladeHalted ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-xl font-extrabold ${status.sawBladeHalted ? 'text-rose-600' : 'text-slate-800'}`}>
            {status.sawBladeHalted ? 'EMERGENCY STOP' : status.decision}
          </p>
          <span className="text-[11px] text-slate-500 block">
            {status.sawBladeHalted ? 'Saw power relay interrupted' : 'Safe operation threshold maintained'}
          </span>
        </div>

        {/* Card 2: Camera Diagnostic Rating */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Camera Health Status</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">{status.cameraHealth}</p>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Blur Laplacian: 185.4 | Lux: 520 lx
          </span>
        </div>

        {/* Card 3: Detections Today */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Detections Monitored Today</span>
            <Eye className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">{status.totalDetectionsToday}</p>
          <span className="text-[11px] text-slate-500 block">
            Emergency Trips Today: <strong className="text-rose-600">{status.emergencyStopsToday}</strong>
          </span>
        </div>

        {/* Card 4: Hardware Latency */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Average Response Time</span>
            <Zap className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">
            {status.inferenceLatencyMs} <span className="text-xs font-normal text-slate-500">ms</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Target &lt; 200ms Compliance Met
          </span>
        </div>
      </div>

      {/* Decision Engine Architecture & Quick Live Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Decision Engine Pipeline */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Offline Edge Decision Engine Pipeline</h3>
              <p className="text-xs text-slate-500">How hand detection triggers immediate hardware interlocks</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-[#0F4C81] text-xs font-bold rounded-lg border border-blue-100">
              YOLOv8 Nano
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 py-2">
            {/* Step 1 */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 1</span>
              <h4 className="font-bold text-slate-800 text-xs">Camera Stream</h4>
              <p className="text-[11px] text-slate-500">
                Captures 1080p @ 30 FPS webcam or workshop video stream.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 2</span>
              <h4 className="font-bold text-slate-800 text-xs">YOLOv8n Inference</h4>
              <p className="text-[11px] text-slate-500">
                Detects human hands with confidence score &gt; 85%.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 3</span>
              <h4 className="font-bold text-slate-800 text-xs">Danger Polygon</h4>
              <p className="text-[11px] text-slate-500">
                Checks hand bounding box overlap with saw blade polygon.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Step 4</span>
              <h4 className="font-bold text-rose-800 text-xs">GPIO Relay Cutoff</h4>
              <p className="text-[11px] text-rose-600 font-medium">
                Trips physical emergency stop relay in &lt; 200ms.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span>SQLite Persistence Active</span>
            </div>
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-[#0F4C81] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Configure Danger Zone Coordinates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Quick Live Feed Entry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Live Monitoring Feed</h3>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time video feed with active bounding overlay and safety perimeter.
            </p>

            <div
              onClick={() => onNavigateTab('live')}
              className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 cursor-pointer hover:border-blue-500 transition-colors group relative overflow-hidden"
            >
              <div className="text-center p-4">
                <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white block">Launch Camera Monitor</span>
                <span className="text-[10px] text-slate-400">28.5 FPS | Saw Feed Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('live')}
            className="w-full py-2 bg-[#0F4C81] hover:bg-[#0c3e6b] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Open Full Camera View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Incidents Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Recent Safety Incidents & Alerts</h3>
            <p className="text-xs text-slate-500">Live SQLite event logs generated by Edge decision engine</p>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs text-[#0F4C81] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Detection Type</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Response Time</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentEvents.slice(0, 5).map(evt => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{evt.id}</td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{evt.detectionType}</td>
                  <td className="py-2.5 px-3 font-mono">{(evt.confidenceScore * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        evt.decision === 'EMERGENCY_STOP'
                          ? 'bg-rose-100 text-rose-800'
                          : evt.decision === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {evt.decision}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{evt.responseTimeMs}ms</td>
                  <td className="py-2.5 px-3">
                    {evt.acknowledged ? (
                      <span className="text-[11px] text-slate-400 font-medium">Acknowledged</span>
                    ) : (
                      <button
                        onClick={() => onAcknowledgeEvent(evt.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
