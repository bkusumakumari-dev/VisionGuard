import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { EventLog } from '../types';

interface EventLogViewProps {
  events: EventLog[];
  onAcknowledgeEvent: (id: string) => void;
  onAddEvent: (newEvent: Partial<EventLog>) => void;
  onRefreshEvents: () => void;
}

export const EventLogView: React.FC<EventLogViewProps> = ({
  events,
  onAcknowledgeEvent,
  onAddEvent,
  onRefreshEvents
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1-second automatic background polling for live logs
  useEffect(() => {
    const timer = setInterval(() => {
      onRefreshEvents();
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefreshEvents]);

  // Derived severity logic
  const getSeverity = (evt: EventLog): 'INFO' | 'WARNING' | 'CRITICAL' => {
    if (evt.decision === 'EMERGENCY_STOP' || evt.decision === 'CAMERA_FAILURE') return 'CRITICAL';
    if (evt.decision === 'WARNING' || evt.cameraStatus === 'Warning') return 'WARNING';
    return 'INFO';
  };

  // Filtering
  const filteredEvents = events.filter(e => {
    const severity = getSeverity(e);

    const matchesSearch =
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.detectionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDecision = filterDecision === 'ALL' || e.decision === filterDecision;
    const matchesType = filterType === 'ALL' || e.detectionType === filterType;
    const matchesSeverity = filterSeverity === 'ALL' || severity === filterSeverity;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(e.timestamp) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(e.timestamp) <= new Date(`${endDate}T23:59:59`);
    }

    return matchesSearch && matchesDecision && matchesType && matchesSeverity && matchesDate;
  });

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'Event ID',
      'Timestamp',
      'Detection Type',
      'Severity',
      'Confidence %',
      'Camera Status',
      'Decision',
      'Response Time (ms)',
      'Saw Blade Status',
      'Acknowledged',
      'Notes'
    ];
    const rows = filteredEvents.map(e => [
      e.id,
      e.timestamp,
      `"${e.detectionType}"`,
      getSeverity(e),
      (e.confidenceScore * 100).toFixed(1),
      e.cameraStatus,
      e.decision,
      e.responseTimeMs,
      e.sawBladeStatus,
      e.acknowledged ? 'Yes' : 'No',
      `"${e.notes || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VisionGuard_AI_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title & Header
    doc.setFontSize(16);
    doc.setTextColor(15, 76, 129); // #0F4C81
    doc.text('VisionGuard AI - Industrial Safety Audit Log', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Logs: ${filteredEvents.length}`, 14, 28);
    doc.text(`Filter Criteria: Search="${searchQuery || 'None'}", Severity=${filterSeverity}, Decision=${filterDecision}`, 14, 34);

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    // Logs entries
    let y = 46;
    doc.setFontSize(9);

    filteredEvents.slice(0, 25).forEach((e, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const severity = getSeverity(e);
      const isCritical = severity === 'CRITICAL';

      if (isCritical) {
        doc.setTextColor(225, 29, 72); // rose red
      } else if (severity === 'WARNING') {
        doc.setTextColor(217, 119, 6); // amber
      } else {
        doc.setTextColor(30, 41, 59); // slate
      }

      const timeStr = new Date(e.timestamp).toLocaleTimeString();
      doc.setFont('helvetica', 'bold');
      doc.text(`${e.id} [${severity}] - ${timeStr}`, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Type: ${e.detectionType} | Conf: ${(e.confidenceScore * 100).toFixed(1)}% | Decision: ${e.decision} (${e.responseTimeMs}ms)`,
        14,
        y + 5
      );

      if (e.notes) {
        doc.setTextColor(100, 116, 139);
        doc.text(`Note: ${e.notes.slice(0, 85)}`, 14, y + 10);
        y += 16;
      } else {
        y += 12;
      }
    });

    doc.save(`VisionGuard_AI_Safety_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">SQLite Live Event Logs & Safety History</h2>
          <p className="text-xs text-slate-500">
            Real-time automated logging powered by SQLite (`visionguard.db`). Auto-updates every second without refresh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefreshEvents}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1"
            title="Refresh logs from backend SQLite DB"
          >
            <RefreshCw className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportToPDF}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Event ID, detection type, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Severity:</span>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="WARNING">WARNING</option>
                <option value="INFO">INFO</option>
              </select>
            </div>

            {/* Decision Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Decision:</span>
              <select
                value={filterDecision}
                onChange={e => setFilterDecision(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Decisions</option>
                <option value="EMERGENCY_STOP">Emergency Stop</option>
                <option value="CAMERA_FAILURE">Camera Failure</option>
                <option value="WARNING">Warning</option>
                <option value="SAFE">Safe</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Type:</span>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="Hand in Danger Zone">Hand in Danger Zone</option>
                <option value="Proximity Warning">Proximity Warning</option>
                <option value="Camera Obstruction">Camera Obstruction</option>
                <option value="Camera Blur">Camera Blur</option>
                <option value="System Restart">System Restart</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Filter Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
            />
          </div>

          {(startDate || endDate || filterSeverity !== 'ALL' || filterDecision !== 'ALL' || filterType !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDecision('ALL');
                setFilterType('ALL');
                setFilterSeverity('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Detection Type</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Camera Status</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Response Time</th>
                <th className="py-3 px-4">Notes / Details</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No matching event logs found in SQLite database.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(evt => {
                  const severity = getSeverity(evt);
                  const severityBadge =
                    severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : severity === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{evt.id}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${severityBadge}`}>
                          {severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{evt.detectionType}</td>
                      <td className="py-3 px-4 font-mono">{(evt.confidenceScore * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            evt.cameraStatus === 'Healthy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {evt.cameraStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            evt.decision === 'EMERGENCY_STOP'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : evt.decision === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {evt.decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{evt.responseTimeMs}ms</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{evt.notes || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {evt.acknowledged ? (
                          <span className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Acked
                          </span>
                        ) : (
                          <button
                            onClick={() => onAcknowledgeEvent(evt.id)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[10px] cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
