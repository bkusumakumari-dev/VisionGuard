import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;
const dbDir = path.join(process.cwd(), 'database');
const dbPath = path.join(dbDir, 'visionguard.db');

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize Tables
  db.run(`
    CREATE TABLE IF NOT EXISTS event_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      detection_type TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      camera_status TEXT NOT NULL,
      decision TEXT NOT NULL,
      response_time_ms INTEGER NOT NULL,
      saw_blade_status TEXT NOT NULL,
      acknowledged INTEGER DEFAULT 0,
      notes TEXT,
      severity TEXT NOT NULL DEFAULT 'INFO',
      blur_score REAL DEFAULT 0,
      brightness REAL DEFAULT 0,
      frame_number INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS system_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      fps REAL NOT NULL,
      inference_latency_ms INTEGER NOT NULL,
      detection_status TEXT NOT NULL,
      hand_detected TEXT NOT NULL,
      confidence REAL NOT NULL,
      danger_zone_status TEXT NOT NULL,
      camera_health TEXT NOT NULL,
      blur_score REAL NOT NULL,
      brightness REAL NOT NULL,
      entropy REAL NOT NULL,
      frame_diff REAL NOT NULL,
      decision TEXT NOT NULL,
      system_state TEXT NOT NULL,
      saw_halted INTEGER NOT NULL
    );
  `);

  // Seed initial event logs if empty
  const checkLogs = db.exec("SELECT COUNT(*) FROM event_logs;");
  const count = checkLogs[0]?.values[0][0] as number;

  if (count === 0) {
    const stmt = db.prepare(`
      INSERT INTO event_logs (
        id, timestamp, detection_type, confidence_score, camera_status, decision,
        response_time_ms, saw_blade_status, acknowledged, notes, severity, blur_score, brightness, frame_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const initialEvents = [
      {
        id: 'EVT-9001',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        detectionType: 'System Started',
        confidenceScore: 1.0,
        cameraStatus: 'Healthy',
        decision: 'SAFE',
        responseTimeMs: 12,
        sawBladeStatus: 'OPERATIONAL',
        acknowledged: 1,
        notes: 'VisionGuard AI Edge engine initialized with live USB webcam feed.',
        severity: 'INFO',
        blurScore: 185.4,
        brightness: 120.0,
        frameNumber: 1
      },
      {
        id: 'EVT-9002',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        detectionType: 'Proximity Warning',
        confidenceScore: 0.92,
        cameraStatus: 'Healthy',
        decision: 'WARNING',
        responseTimeMs: 16,
        sawBladeStatus: 'OPERATIONAL',
        acknowledged: 1,
        notes: 'Hand detected approaching circular saw perimeter (135mm distance).',
        severity: 'WARNING',
        blurScore: 178.2,
        brightness: 118.5,
        frameNumber: 420
      }
    ];

    for (const evt of initialEvents) {
      stmt.run([
        evt.id,
        evt.timestamp,
        evt.detectionType,
        evt.confidenceScore,
        evt.cameraStatus,
        evt.decision,
        evt.responseTimeMs,
        evt.sawBladeStatus,
        evt.acknowledged,
        evt.notes,
        evt.severity,
        evt.blurScore,
        evt.brightness,
        evt.frameNumber
      ]);
    }
    stmt.free();
    saveDatabase(db);
  }

  return db;
}

export function saveDatabase(database: Database): void {
  try {
    const data = database.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}
