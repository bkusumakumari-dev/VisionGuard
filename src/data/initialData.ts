import { EventLog, SettingsConfig, AnalyticsSummary } from '../types';

export const initialSettings: SettingsConfig = {
  confidenceThreshold: 0.85,
  cameraSource: 'simulated_saw',
  dangerZone: {
    x: 35,
    y: 35,
    width: 30,
    height: 30,
    shape: 'rectangle',
    points: [
      { x: 35, y: 35 },
      { x: 65, y: 35 },
      { x: 65, y: 65 },
      { x: 35, y: 65 }
    ]
  },
  detectionSensitivity: 'HIGH',
  soundAlarmEnabled: true,
  emergencyLatchMode: 'MANUAL_RESET',
  hardwareRelayGpioPin: 18
};

export const initialEventLogs: EventLog[] = [
  {
    id: 'EVT-1092',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    detectionType: 'Hand in Danger Zone',
    confidenceScore: 0.968,
    cameraStatus: 'Healthy',
    decision: 'EMERGENCY_STOP',
    responseTimeMs: 24,
    sawBladeStatus: 'HALTED_ESTOP',
    acknowledged: false,
    notes: 'Operator hand crossed 50mm safety boundary. Relay tripped.'
  },
  {
    id: 'EVT-1091',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    detectionType: 'Proximity Warning',
    confidenceScore: 0.912,
    cameraStatus: 'Healthy',
    decision: 'WARNING',
    responseTimeMs: 28,
    sawBladeStatus: 'OPERATIONAL',
    acknowledged: true,
    notes: 'Hand detected near 120mm zone boundary.'
  },
  {
    id: 'EVT-1090',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    detectionType: 'Camera Obstruction',
    confidenceScore: 0.985,
    cameraStatus: 'Warning',
    decision: 'WARNING',
    responseTimeMs: 18,
    sawBladeStatus: 'OPERATIONAL',
    acknowledged: true,
    notes: 'Wood dust particles partially obstructed camera lens.'
  },
  {
    id: 'EVT-1089',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    detectionType: 'Hand in Danger Zone',
    confidenceScore: 0.974,
    cameraStatus: 'Healthy',
    decision: 'EMERGENCY_STOP',
    responseTimeMs: 22,
    sawBladeStatus: 'HALTED_ESTOP',
    acknowledged: true,
    notes: 'Fast hand movement detected towards circular blade. Instant trip.'
  },
  {
    id: 'EVT-1088',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    detectionType: 'Camera Blur',
    confidenceScore: 0.880,
    cameraStatus: 'Warning',
    decision: 'WARNING',
    responseTimeMs: 31,
    sawBladeStatus: 'OPERATIONAL',
    acknowledged: true,
    notes: 'Laplacian variance dropped below 80. Recommended lens wipe.'
  },
  {
    id: 'EVT-1087',
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    detectionType: 'Proximity Warning',
    confidenceScore: 0.941,
    cameraStatus: 'Healthy',
    decision: 'WARNING',
    responseTimeMs: 26,
    sawBladeStatus: 'OPERATIONAL',
    acknowledged: true,
    notes: 'Plywood feed operator hand approached safety guard.'
  },
  {
    id: 'EVT-1086',
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    detectionType: 'System Restart',
    confidenceScore: 0.999,
    cameraStatus: 'Healthy',
    decision: 'SAFE',
    responseTimeMs: 12,
    sawBladeStatus: 'OPERATIONAL',
    acknowledged: true,
    notes: 'VisionGuard AI Edge Daemon initialized on Raspberry Pi 5.'
  },
  {
    id: 'EVT-1085',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    detectionType: 'Manual E-Stop',
    confidenceScore: 1.000,
    cameraStatus: 'Healthy',
    decision: 'EMERGENCY_STOP',
    responseTimeMs: 5,
    sawBladeStatus: 'HALTED_ESTOP',
    acknowledged: true,
    notes: 'Operator manually hit physical dashboard emergency stop.'
  }
];

export const initialAnalytics: AnalyticsSummary = {
  dailyDetections: [
    { date: 'Mon', detections: 142, eStops: 3 },
    { date: 'Tue', detections: 189, eStops: 2 },
    { date: 'Wed', detections: 165, eStops: 4 },
    { date: 'Thu', detections: 210, eStops: 1 },
    { date: 'Fri', detections: 198, eStops: 2 },
    { date: 'Sat', detections: 85, eStops: 0 },
    { date: 'Sun', detections: 42, eStops: 1 }
  ],
  incidentTypes: [
    { name: 'Danger Zone Entry', count: 18, color: '#FF6B6B' },
    { name: 'Proximity Warning', count: 42, color: '#FFD166' },
    { name: 'Camera Dust Blur', count: 12, color: '#7ED6DF' },
    { name: 'Lens Obstruction', count: 5, color: '#4F9DDE' },
    { name: 'Manual Stop Test', count: 8, color: '#A8E6CF' }
  ],
  hourlyResponseTimes: [
    { hour: '08:00', latencyMs: 22 },
    { hour: '10:00', latencyMs: 19 },
    { hour: '12:00', latencyMs: 24 },
    { hour: '14:00', latencyMs: 21 },
    { hour: '16:00', latencyMs: 23 },
    { hour: '18:00', latencyMs: 20 }
  ],
  weeklySafetyScore: [
    { day: 'Mon', score: 98.2 },
    { day: 'Tue', score: 99.1 },
    { day: 'Wed', score: 97.8 },
    { day: 'Thu', score: 99.5 },
    { day: 'Fri', score: 98.9 },
    { day: 'Sat', score: 100.0 },
    { day: 'Sun', score: 99.4 }
  ],
  totalIncidents: 85,
  avgResponseTimeMs: 21.8,
  safetyCompliancePct: 99.4
};
