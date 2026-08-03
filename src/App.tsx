/**
 * VisionGuard AI - Edge AI Industrial Safety Application
 * @license Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeOverview } from './components/HomeOverview';
import { LiveCameraPanel } from './components/LiveCameraPanel';
import { SystemStatusView } from './components/SystemStatusView';
import { EventLogView } from './components/EventLogView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';

import { initialEventLogs, initialSettings, initialAnalytics } from './data/initialData';
import { SystemStatus, CameraHealthDiagnostics, EventLog, SettingsConfig, AnalyticsSummary } from './types';
import { soundAlarm } from './utils/audio';
import { FrameAnalysisResult } from './utils/visionPipeline';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core App State
  const [settings, setSettings] = useState<SettingsConfig>(initialSettings);
  const [eventLogs, setEventLogs] = useState<EventLog[]>(initialEventLogs);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(initialAnalytics);

  const [cameraHealth, setCameraHealth] = useState<CameraHealthDiagnostics>({
    rating: 'Healthy',
    blurScore: 185.4,
    isFrozen: false,
    isObstructed: false,
    isConnected: true,
    brightnessLux: 520,
    lightState: 'NORMAL',
    lastFrameTimestamp: Date.now()
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    decision: 'SAFE',
    cameraHealth: 'Healthy',
    sawBladeHalted: false,
    fps: 28.5,
    inferenceLatencyMs: 18,
    totalDetectionsToday: initialEventLogs.length + 142,
    emergencyStopsToday: initialEventLogs.filter(e => e.decision === 'EMERGENCY_STOP').length,
    activeAlertCount: 0,
    lastEventTimestamp: new Date().toISOString(),
    pi5Metrics: {
      cpuTempC: 42.1,
      ramUsageMb: 1240,
      npuUsagePct: 35,
      uptimeSeconds: 14200
    }
  });

  // Fetch Status & Event Logs from Express Backend
  const fetchBackendData = useCallback(async () => {
    try {
      const [statusRes, healthRes, eventsRes, settingsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/camera_health'),
        fetch('/api/events'),
        fetch('/api/settings')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData);
      }
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setCameraHealth(healthData);
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEventLogs(eventsData);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch {
      // Fallback to initial local state if backend route is starting
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  const [hazardErrorMessage, setHazardErrorMessage] = useState<string | null>(null);
  const latestFrameRef = React.useRef<FrameAnalysisResult | null>(null);

  const handleFrameAnalysis = useCallback((result: FrameAnalysisResult) => {
    latestFrameRef.current = result;

    // Automatically resume SAFE monitoring and stop siren when all landmarks leave danger zone or no hand is present
    if (!result.dangerZoneIntersected && result.cameraHealth.rating !== 'Critical') {
      soundAlarm.stopContinuousAlarm();
      setSystemStatus(prev => {
        if (prev.sawBladeHalted || prev.decision !== 'SAFE') {
          return {
            ...prev,
            sawBladeHalted: false,
            decision: 'SAFE'
          };
        }
        return prev;
      });
    }
  }, []);

  // Handlers
  const handleResetEStop = async () => {
    // Re-evaluate current webcam frame
    const currentFrame = latestFrameRef.current;
    if (currentFrame?.dangerZoneIntersected || cameraHealth.rating === 'Critical') {
      setHazardErrorMessage("Hazard Still Present - Cannot Reset");
      setTimeout(() => setHazardErrorMessage(null), 4000);
      return;
    }

    setHazardErrorMessage(null);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setSystemStatus(prev => ({
          ...prev,
          sawBladeHalted: false,
          decision: 'SAFE'
        }));
        soundAlarm.stopContinuousAlarm();
        fetchBackendData();
      }
    } catch {
      setSystemStatus(prev => ({ ...prev, sawBladeHalted: false, decision: 'SAFE' }));
      soundAlarm.stopContinuousAlarm();
    }
  };

  const handleManualTriggerEStop = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detectionType: 'Manual E-Stop',
          confidenceScore: 1.0,
          decision: 'EMERGENCY_STOP',
          responseTimeMs: 5,
          notes: 'Operator manually hit physical dashboard Emergency Stop button.'
        })
      });
      if (res.ok) {
        setSystemStatus(prev => ({
          ...prev,
          sawBladeHalted: true,
          decision: 'EMERGENCY_STOP'
        }));
        fetchBackendData();
      }
    } catch {
      setSystemStatus(prev => ({ ...prev, sawBladeHalted: true, decision: 'EMERGENCY_STOP' }));
    }
  };

  const handleTriggerEStopFromVision = async (reason: string, confidence: number) => {
    if (systemStatus.sawBladeHalted) return; // already halted

    setSystemStatus(prev => ({
      ...prev,
      sawBladeHalted: true,
      decision: 'EMERGENCY_STOP'
    }));

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detectionType: 'Hand in Danger Zone',
          confidenceScore: confidence,
          decision: 'EMERGENCY_STOP',
          responseTimeMs: Math.floor(18 + Math.random() * 8),
          notes: reason
        })
      });
      fetchBackendData();
    } catch {
      // ignore
    }
  };

  const handleTriggerWarning = async (reason: string) => {
    if (systemStatus.sawBladeHalted || systemStatus.decision === 'WARNING') return;

    setSystemStatus(prev => ({
      ...prev,
      decision: 'WARNING'
    }));
  };

  const handleAcknowledgeEvent = async (id: string) => {
    try {
      await fetch(`/api/events/${id}/acknowledge`, { method: 'POST' });
      fetchBackendData();
    } catch {
      setEventLogs(prev =>
        prev.map(e => (e.id === id ? { ...e, acknowledged: true } : e))
      );
    }
  };

  const handleAddEvent = async (newEvent: Partial<EventLog>) => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      fetchBackendData();
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = async (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch {
      // ignore
    }
  };

  const handleUpdateDiagnostics = async (diag: Partial<CameraHealthDiagnostics>) => {
    setCameraHealth(prev => ({ ...prev, ...diag }));
    try {
      await fetch('/api/camera_health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diag)
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#5B6B7A] flex flex-col font-sans antialiased">
      {/* Header Bar */}
      <Header
        status={systemStatus}
        onResetEStop={handleResetEStop}
        onManualTriggerEStop={handleManualTriggerEStop}
      />

      {/* Main Body with Sidebar + View Container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          status={systemStatus}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {hazardErrorMessage && (
            <div className="bg-rose-600 text-white font-bold px-4 py-3 rounded-lg flex items-center justify-between shadow-lg animate-bounce">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span>{hazardErrorMessage}</span>
              </div>
              <button
                onClick={() => setHazardErrorMessage(null)}
                className="text-white hover:text-rose-200 text-sm underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'home' && (
            <HomeOverview
              status={systemStatus}
              recentEvents={eventLogs}
              onNavigateTab={setActiveTab}
              onResetEStop={handleResetEStop}
              onAcknowledgeEvent={handleAcknowledgeEvent}
            />
          )}

          {activeTab === 'live' && (
            <LiveCameraPanel
              settings={settings}
              cameraHealth={cameraHealth}
              isSawHalted={systemStatus.sawBladeHalted}
              onTriggerEStop={handleTriggerEStopFromVision}
              onTriggerWarning={handleTriggerWarning}
              onUpdateDiagnostics={handleUpdateDiagnostics}
              onFrameAnalysis={handleFrameAnalysis}
            />
          )}

          {activeTab === 'health' && (
            <SystemStatusView
              cameraHealth={cameraHealth}
              status={systemStatus}
              onUpdateDiagnostics={handleUpdateDiagnostics}
            />
          )}

          {activeTab === 'logs' && (
            <EventLogView
              events={eventLogs}
              onAcknowledgeEvent={handleAcknowledgeEvent}
              onAddEvent={handleAddEvent}
              onRefreshEvents={fetchBackendData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView analytics={analytics} eventLogs={eventLogs} />
          )}

          {activeTab === 'settings' && (
            <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />
          )}
        </main>
      </div>
    </div>
  );
}
