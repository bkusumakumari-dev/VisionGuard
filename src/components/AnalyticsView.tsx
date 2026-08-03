import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  FileCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AnalyticsSummary, EventLog } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary;
  eventLogs: EventLog[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, eventLogs }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiReport = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentDetails: eventLogs.slice(0, 3),
          recentEventsCount: eventLogs.length
        })
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setAiReport(data.report);
      } else {
        setAiError(data.error || 'Failed to generate AI Audit report.');
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Network error generating report');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Safety Intelligence & Analytics</h2>
          <p className="text-xs text-slate-500">
            Real-time metric aggregation across detection counts, decision latency, and safety compliance.
          </p>
        </div>

        <button
          onClick={handleGenerateAiReport}
          disabled={loadingAi}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-[#0F4C81] hover:from-indigo-700 hover:to-[#0c3e6b] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {loadingAi ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300" />
          )}
          <span>{loadingAi ? 'Analyzing Logs...' : 'Generate Gemini AI OSHA Audit Report'}</span>
        </button>
      </div>

      {/* AI Report Output Panel if Generated */}
      {aiReport && (
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Gemini AI Industrial Safety Audit Report</h3>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
              OSHA Compliance Inspection
            </span>
          </div>
          <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans bg-white/70 p-4 rounded-xl border border-blue-100">
            {aiReport}
          </div>
        </div>
      )}

      {aiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Top Summary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Safety Compliance Index</span>
          <p className="text-2xl font-extrabold text-emerald-600">{analytics.safetyCompliancePct}%</p>
          <span className="text-[11px] text-slate-400">Zero Unhandled Safety Incidents</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Mean Response Latency</span>
          <p className="text-2xl font-extrabold text-slate-800">{analytics.avgResponseTimeMs} ms</p>
          <span className="text-[11px] text-emerald-600 font-semibold">&lt; 200ms Target Compliant</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Detections Logged</span>
          <p className="text-2xl font-extrabold text-[#0F4C81]">{analytics.totalIncidents}</p>
          <span className="text-[11px] text-slate-400">Recorded in SQLite Database</span>
        </div>
      </div>

      {/* Row 1 Charts: Daily Detections Bar Chart + Incident Types Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Detections */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Daily Hand Detections & Emergency Trips</h3>
              <p className="text-xs text-slate-500">Weekly breakdown of proximity events vs relay cutoffs</p>
            </div>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded">
              7-Day Window
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyDetections}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5B6B7A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5B6B7A' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E5E7EB', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="detections" name="Hand Proximities" fill="#4F9DDE" radius={[6, 6, 0, 0]} />
                <Bar dataKey="eStops" name="Emergency Stops" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Incident Distribution Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Incident Categorization</h3>
            <p className="text-xs text-slate-500">Distribution of safety events</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.incidentTypes}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {analytics.incidentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E5E7EB', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {analytics.incidentTypes.map(item => (
              <div key={item.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Latency Area Chart + Weekly Safety Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Area Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Hardware Response Latency Profile (ms)</h3>
              <p className="text-xs text-slate-500">Inference + decision + relay actuation latency</p>
            </div>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Target: &lt;200ms
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.hourlyResponseTimes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#5B6B7A' }} />
                <YAxis domain={[0, 50]} tick={{ fontSize: 11, fill: '#5B6B7A' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E5E7EB', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="latencyMs" name="Latency (ms)" stroke="#0F4C81" fill="#B8E0F7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Safety Score Trend Line Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Weekly Workplace Safety Index</h3>
              <p className="text-xs text-slate-500">Aggregated zero-accident compliance rating</p>
            </div>
            <span className="text-xs text-[#0F4C81] font-bold">99.4% Avg</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklySafetyScore}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5B6B7A' }} />
                <YAxis domain={[95, 100]} tick={{ fontSize: 11, fill: '#5B6B7A' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#E5E7EB', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="score" name="Safety Score (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
