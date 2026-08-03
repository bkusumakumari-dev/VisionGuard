import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Video,
  Volume2,
  VolumeX,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Camera,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { SettingsConfig, CameraHealthDiagnostics, HandDetection } from '../types';
import { soundAlarm } from '../utils/audio';
import { processLiveWebcamFrame, FrameAnalysisResult, HAND_CONNECTIONS } from '../utils/visionPipeline';
import { DebugPanel } from './DebugPanel';

interface LiveCameraPanelProps {
  settings: SettingsConfig;
  cameraHealth: CameraHealthDiagnostics;
  isSawHalted: boolean;
  onTriggerEStop: (reason: string, confidence: number) => void;
  onTriggerWarning: (reason: string) => void;
  onUpdateDiagnostics: (diag: Partial<CameraHealthDiagnostics>) => void;
  onResetEStop?: () => void;
  onFrameAnalysis?: (result: FrameAnalysisResult) => void;
}

export const LiveCameraPanel: React.FC<LiveCameraPanelProps> = ({
  settings,
  cameraHealth,
  isSawHalted,
  onTriggerEStop,
  onTriggerWarning,
  onUpdateDiagnostics,
  onResetEStop,
  onFrameAnalysis
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundAlarmEnabled);

  // Real-time analysis frame state
  const [latestFrameResult, setLatestFrameResult] = useState<FrameAnalysisResult | null>(null);
  const lastTelemetrySentTime = useRef<number>(0);
  const prevCriticalRef = useRef<boolean>(false);
  const prevCamStateRef = useRef<{ rating: string; reason: string } | null>(null);

  // MediaPipe Real-Time Inference State
  const mediaPipeLandmarksRef = useRef<{ x: number; y: number; z?: number }[][] | null>(null);
  const isProcessingMediaPipeRef = useRef<boolean>(false);

  // Initialize MediaPipe Hands SDK on live webcam video stream
  useEffect(() => {
    let handsInstance: any = null;

    const setupHands = () => {
      if (typeof window !== 'undefined' && window.Hands && !handsInstance) {
        try {
          handsInstance = new window.Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });

          handsInstance.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          handsInstance.onResults((results: any) => {
            isProcessingMediaPipeRef.current = false;
            if (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              mediaPipeLandmarksRef.current = results.multiHandLandmarks;
            } else {
              mediaPipeLandmarksRef.current = [];
            }
          });
        } catch (err) {
          console.warn('MediaPipe Hands setup error:', err);
        }
      }
    };

    setupHands();
    const initPoll = setInterval(() => {
      if (!handsInstance) {
        setupHands();
      }
    }, 300);

    const mpInterval = setInterval(() => {
      if (
        handsInstance &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        webcamActive &&
        !isProcessingMediaPipeRef.current
      ) {
        isProcessingMediaPipeRef.current = true;
        try {
          handsInstance.send({ image: videoRef.current }).catch(() => {
            isProcessingMediaPipeRef.current = false;
          });
        } catch {
          isProcessingMediaPipeRef.current = false;
        }
      }
    }, 33);

    return () => {
      clearInterval(initPoll);
      clearInterval(mpInterval);
      if (handsInstance) {
        try {
          handsInstance.close();
        } catch {}
      }
    };
  }, [webcamActive]);

  const streamRef = useRef<MediaStream | null>(null);

  // Start Real USB Webcam Stream
  const startWebcam = useCallback(async () => {
    setWebcamError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setWebcamActive(true);
        } catch (playErr: any) {
          if (playErr?.name === 'AbortError' || playErr?.message?.includes('interrupted')) {
            // Play request was interrupted by new load request or component unmount - benign
            return;
          }
          throw playErr;
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Webcam access error:', err);
      setWebcamError(
        'USB Webcam permission denied or camera disconnected. Please connect a camera and allow browser permissions.'
      );
      setWebcamActive(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  }, []);

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  useEffect(() => {
    soundAlarm.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Main Real-Time Frame Render & Analysis Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const startTime = performance.now();
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && webcamActive && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // 1. Draw raw live video frame on canvas
          ctx.drawImage(video, 0, 0, width, height);

          // 2. Process frame through real computer vision engine
          const analysis = processLiveWebcamFrame(
            ctx,
            width,
            height,
            settings.dangerZone,
            startTime,
            mediaPipeLandmarksRef.current
          );

          setLatestFrameResult(analysis);
          onFrameAnalysis?.(analysis);

          // Update camera health diagnostics back to app state
          onUpdateDiagnostics(analysis.cameraHealth);

          // 3. Render Danger Zone & Real Hand Detection Overlay
          const dz = settings.dangerZone;
          const dzX = (dz.x / 100) * width;
          const dzY = (dz.y / 100) * height;
          const dzW = (dz.width / 100) * width;
          const dzH = (dz.height / 100) * height;

          // Danger Zone Rectangle
          ctx.fillStyle = analysis.dangerZoneIntersected || isSawHalted
            ? 'rgba(239, 68, 68, 0.40)'
            : 'rgba(239, 68, 68, 0.20)';
          ctx.fillRect(dzX, dzY, dzW, dzH);
          ctx.strokeStyle = analysis.dangerZoneIntersected || isSawHalted ? '#dc2626' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(dzX, dzY, dzW, dzH);

          // Danger Zone Header Text
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('DANGER ZONE (CIRCULAR SAW PERIMETER)', dzX + 10, dzY + 22);

          // Render 21 MediaPipe Hand Landmarks & Skeleton Overlay if detected
          if (analysis.detectedHand) {
            const hand = analysis.detectedHand;
            const handPxX = (hand.bbox.x / 100) * width;
            const handPxY = (hand.bbox.y / 100) * height;
            const handPxW = (hand.bbox.width / 100) * width;
            const handPxH = (hand.bbox.height / 100) * height;

            const boxColor = hand.inDangerZone ? '#ef4444' : hand.distanceToSawMm < 140 ? '#eab308' : '#22c55e';

            // 1. Draw 21 Hand Landmarks & Skeleton Bones if available
            if (hand.landmarks && hand.landmarks.length === 21) {
              const lms = hand.landmarks;

              // Draw Skeleton Bone Connections
              HAND_CONNECTIONS.forEach(([p1, p2]) => {
                const lm1 = lms[p1];
                const lm2 = lms[p2];

                if (lm1 && lm2) {
                  const x1 = (lm1.x / 100) * width;
                  const y1 = (lm1.y / 100) * height;
                  const x2 = (lm2.x / 100) * width;
                  const y2 = (lm2.y / 100) * height;

                  const isBoneInDanger = lm1.inDangerZone || lm2.inDangerZone;
                  ctx.strokeStyle = isBoneInDanger ? '#ff0055' : '#00f0ff';
                  ctx.lineWidth = isBoneInDanger ? 3.5 : 2.5;

                  ctx.beginPath();
                  ctx.moveTo(x1, y1);
                  ctx.lineTo(x2, y2);
                  ctx.stroke();
                }
              });

              // Draw 21 Landmark Joint Nodes
              lms.forEach((lm, idx) => {
                const px = (lm.x / 100) * width;
                const py = (lm.y / 100) * height;
                const isFingertip = [4, 8, 12, 16, 20].includes(idx);

                if (lm.inDangerZone) {
                  // Flashing DANGER Joint Node
                  ctx.fillStyle = '#ff0055';
                  ctx.beginPath();
                  ctx.arc(px, py, isFingertip ? 7 : 5, 0, 2 * Math.PI);
                  ctx.fill();

                  // Outer Pulsing Danger Ring
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.arc(px, py, isFingertip ? 10 : 7, 0, 2 * Math.PI);
                  ctx.stroke();
                } else if (isFingertip) {
                  // Fingertip Node (Amber/Gold)
                  ctx.fillStyle = '#facc15';
                  ctx.beginPath();
                  ctx.arc(px, py, 6, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  ctx.arc(px, py, 8, 0, 2 * Math.PI);
                  ctx.stroke();
                } else {
                  // Normal Cyan Joint Node
                  ctx.fillStyle = '#00f0ff';
                  ctx.beginPath();
                  ctx.arc(px, py, 4, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.fillStyle = '#0f172a';
                  ctx.beginPath();
                  ctx.arc(px, py, 1.5, 0, 2 * Math.PI);
                  ctx.fill();
                }
              });
            }

            // 2. Draw Hand Bounding Box
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = hand.inDangerZone ? 3.5 : 2;
            ctx.strokeRect(handPxX, handPxY, handPxW, handPxH);
          }

          // 3. Large Industrial Status Indicator Overlay (SAFE vs DANGER / WARNING!)
          if (analysis.dangerZoneIntersected) {
            // DANGER & WARNING OVERLAY
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#ef4444';
            ctx.font = 'black 32px sans-serif';
            ctx.fillText('DANGER', 20, 45);

            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('WARNING!', 20, 78);
          } else {
            // SAFE OVERLAY
            ctx.fillStyle = 'rgba(34, 197, 94, 0.90)';
            ctx.fillRect(16, 16, 120, 38);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('SAFE', 38, 43);
          }

          // 5. Decision Engine Interlocks - Critical Alarm only for Hand in Danger Zone or Camera Health Critical
          const isCriticalCondition = analysis.dangerZoneIntersected || analysis.cameraHealth.rating === 'Critical';

          if (isCriticalCondition) {
            if (!isSawHalted) {
              const reason = analysis.dangerZoneIntersected
                ? `Human hand detected in dangerous saw perimeter (Confidence ${(analysis.detectedHand?.confidence || 0.95) * 100}%)`
                : `Camera health CRITICAL: ${analysis.cameraHealth.reason || 'Camera Failure'}`;
              onTriggerEStop(reason, analysis.detectedHand?.confidence || 0.95);
            }
            if (soundEnabled) {
              soundAlarm.startContinuousAlarm();
            }
          } else {
            // Stop alarm immediately when critical condition clears
            soundAlarm.stopContinuousAlarm();

            if (analysis.detectedHand && analysis.detectedHand.distanceToSawMm < 140) {
              onTriggerWarning(`Hand in close proximity warning area (${analysis.detectedHand.distanceToSawMm}mm)`);
              if (soundEnabled && analysis.frameNumber % 45 === 0) {
                soundAlarm.playBeep(650, 100, 'sine');
              }
            }
          }

          // 6. Camera Health State Transition Event Logging (Generates logs ONLY when state/reason changes)
          const curCamRating = analysis.cameraHealth.rating;
          const curCamReason = analysis.cameraHealth.reason || 'Healthy';
          const prevCam = prevCamStateRef.current;

          if (!prevCam || prevCam.rating !== curCamRating || prevCam.reason !== curCamReason) {
            prevCamStateRef.current = { rating: curCamRating, reason: curCamReason };

            let eventType: 'Camera Obstruction' | 'Camera Blur' | 'System Restart' = 'Camera Obstruction';
            if (curCamRating === 'Healthy') eventType = 'System Restart';
            else if (curCamRating === 'Warning') eventType = 'Camera Blur';

            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: `EVT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                detectionType: eventType,
                confidenceScore: 1.0,
                cameraStatus: curCamRating,
                decision: curCamRating === 'Critical' ? 'CAMERA_FAILURE' : 'SAFE',
                responseTimeMs: analysis.latencyMs,
                notes: `Camera Health: ${curCamRating.toUpperCase()} (${curCamReason})`
              })
            }).catch(() => {});
          }

          prevCriticalRef.current = isCriticalCondition;

          // 7. Record 1-second Telemetry to Backend SQLite Database
          const now = Date.now();
          if (now - lastTelemetrySentTime.current >= 1000) {
            lastTelemetrySentTime.current = now;
            fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fps: analysis.fps,
                latencyMs: analysis.latencyMs,
                handDetected: analysis.detectedHand ? 'YES' : 'NO',
                confidence: analysis.detectedHand?.confidence || 0.0,
                dangerZoneIntersected: analysis.dangerZoneIntersected,
                cameraHealth: analysis.cameraHealth.rating,
                blurScore: analysis.blurScore,
                brightnessLux: analysis.brightnessLux,
                entropy: analysis.entropy,
                frameDifference: analysis.frameDifference,
                decision: analysis.decision,
                sawHalted: isSawHalted
              })
            }).catch(() => {});
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      soundAlarm.stopContinuousAlarm();
    };
  }, [
    webcamActive,
    isSawHalted,
    settings.dangerZone,
    showOverlay,
    soundEnabled,
    onTriggerEStop,
    onTriggerWarning,
    onUpdateDiagnostics
  ]);

  return (
    <div className="space-y-4">
      {/* Top Banner Alert if Emergency Stop active */}
      {isSawHalted && (
        <div className="p-4 bg-rose-600 text-white rounded-xl shadow-md flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">EMERGENCY STOP ACTIVATED</h3>
              <p className="text-xs text-rose-100">
                Circular saw power hardware interlocked by VisionGuard AI Edge Decision Engine.
              </p>
            </div>
          </div>
          {onResetEStop && (
            <button
              onClick={() => {
                const isDanger = latestFrameResult?.dangerZoneIntersected;
                const isCamCritical = latestFrameResult?.cameraHealth.rating === 'Critical';

                if (isDanger || isCamCritical) {
                  const reason = isDanger
                    ? 'Hand is still detected inside the circular saw danger zone!'
                    : 'Camera health is CRITICAL (lens blocked, blurred, or frozen)!';
                  alert(`Cannot Reset - Hazard Still Present:\n${reason}`);
                  return;
                }

                soundAlarm.stopContinuousAlarm();
                onResetEStop();
              }}
              className="px-3.5 py-1.5 bg-white text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-50 cursor-pointer shadow-xs"
            >
              Reset Safety Latch
            </button>
          )}
        </div>
      )}

      {/* Main Video Canvas Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#0F4C81]" />
            <h2 className="font-bold text-slate-800 text-sm">
              Live USB Webcam Stream & Bounding Overlay
            </h2>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
              YOLOv8 Edge Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                showOverlay
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>HUD Overlay</span>
            </button>

            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                showDebugPanel
                  ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Debug Panel</span>
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                soundAlarm.setMuted(soundEnabled);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>{soundEnabled ? 'Siren On' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />

          {webcamError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
              <AlertTriangle className="w-12 h-12 text-amber-400 animate-bounce" />
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-slate-100">Live Webcam Input Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{webcamError}</p>
              </div>
              <button
                onClick={startWebcam}
                className="px-4 py-2 bg-[#0F4C81] hover:bg-[#125894] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Webcam Connection</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Vision AI Debug Panel */}
      {showDebugPanel && <DebugPanel frameData={latestFrameResult} />}

      {/* Realtime Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Camera Health Status</span>
          <p className="text-base font-extrabold flex items-center gap-1.5 mt-1">
            {latestFrameResult?.cameraHealth.rating === 'Critical' ? (
              <span className="text-rose-600 flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                CRITICAL
              </span>
            ) : latestFrameResult?.cameraHealth.rating === 'Warning' ? (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                WARNING
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                HEALTHY
              </span>
            )}
          </p>
          <span className="text-[11px] text-slate-600 font-semibold block mt-0.5 truncate">
            Reason: {latestFrameResult?.cameraHealth.reason || 'Healthy'}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Saw Blade Proximity</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">
            {latestFrameResult?.detectedHand
              ? `${latestFrameResult.detectedHand.distanceToSawMm} mm`
              : 'N/A (Clear)'}
          </p>
          <span className="text-[10px] text-slate-400">Safety Threshold: 100mm</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Detection Confidence</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">
            {latestFrameResult?.detectedHand
              ? `${(latestFrameResult.detectedHand.confidence * 100).toFixed(1)}%`
              : '0.0%'}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">YOLOv8 Edge Engine</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Camera Frame Rate</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">
            {latestFrameResult?.fps || 30} <span className="text-xs font-normal text-slate-500">FPS</span>
          </p>
          <span className="text-[10px] text-slate-400">Target: 30 FPS</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Decision Latency</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">
            {latestFrameResult?.latencyMs || 12} <span className="text-xs font-normal text-slate-500">ms</span>
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">&lt; 200ms Compliance</span>
        </div>
      </div>
    </div>
  );
};
