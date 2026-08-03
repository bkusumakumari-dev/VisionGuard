export type DecisionState = 'SAFE' | 'WARNING' | 'EMERGENCY_STOP' | 'CAMERA_FAILURE';

declare global {
  interface Window {
    Hands?: any;
    Camera?: any;
  }
}

export type CameraHealthRating = 'Healthy' | 'Warning' | 'Critical';

export interface CameraHealthDiagnostics {
  rating: CameraHealthRating;
  reason: string; // e.g. 'Healthy', 'Blur Detected', 'Severe Blur', 'Lens Blocked', 'Camera Disconnected', 'Frozen Frame', 'Low Light', 'Overexposed', 'Frame Corrupted'
  blurScore: number; // Laplacian variance (e.g. 150+ healthy, <25 blurred)
  isFrozen: boolean;
  isObstructed: boolean;
  isConnected: boolean;
  isCorrupted?: boolean;
  brightnessLux: number; // e.g. 500 lx (normal 300-800, <50 dark, >1200 bright)
  lightState: 'NORMAL' | 'TOO_DARK' | 'TOO_BRIGHT';
  lastFrameTimestamp: number;
}

export interface DangerZoneConfig {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  shape: 'rectangle' | 'polygon';
  points?: { x: number; y: number }[]; // for polygon
}

export interface HandLandmark {
  x: number; // percentage 0-100 relative to video frame width
  y: number; // percentage 0-100 relative to video frame height
  z?: number;
  name?: string;
  inDangerZone?: boolean;
}

export interface HandDetection {
  id: string;
  label: 'human_hand';
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number }; // percentage relative to video canvas
  landmarks: HandLandmark[]; // Complete 21 MediaPipe Landmarks
  distanceToSawMm: number; // calculated distance to blade center in mm
  inDangerZone: boolean;
  velocityX: number;
  velocityY: number;
}

export interface EventLog {
  id: string;
  timestamp: string;
  detectionType: 'Hand in Danger Zone' | 'Proximity Warning' | 'Camera Obstruction' | 'Camera Blur' | 'System Restart' | 'Manual E-Stop';
  confidenceScore: number;
  cameraStatus: CameraHealthRating;
  decision: DecisionState;
  responseTimeMs: number;
  sawBladeStatus: 'OPERATIONAL' | 'HALTED_ESTOP';
  acknowledged?: boolean;
  notes?: string;
}

export interface SystemStatus {
  decision: DecisionState;
  cameraHealth: CameraHealthRating;
  sawBladeHalted: boolean;
  fps: number;
  inferenceLatencyMs: number;
  totalDetectionsToday: number;
  emergencyStopsToday: number;
  activeAlertCount: number;
  lastEventTimestamp: string;
  pi5Metrics: {
    cpuTempC: number;
    ramUsageMb: number;
    npuUsagePct: number;
    uptimeSeconds: number;
  };
}

export interface SettingsConfig {
  confidenceThreshold: number; // 0.50 to 0.99
  cameraSource: 'webcam' | 'simulated_saw' | 'test_feed_1' | 'test_feed_2';
  dangerZone: DangerZoneConfig;
  detectionSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  soundAlarmEnabled: boolean;
  emergencyLatchMode: 'MANUAL_RESET' | 'AUTO_RESET';
  hardwareRelayGpioPin: number;
}

export interface AnalyticsSummary {
  dailyDetections: { date: string; detections: number; eStops: number }[];
  incidentTypes: { name: string; count: number; color: string }[];
  hourlyResponseTimes: { hour: string; latencyMs: number }[];
  weeklySafetyScore: { day: string; score: number }[];
  totalIncidents: number;
  avgResponseTimeMs: number;
  safetyCompliancePct: number;
}
