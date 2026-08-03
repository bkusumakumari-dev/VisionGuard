import React from 'react';
import { Terminal, ShieldAlert, Cpu, Activity, AlertCircle, Eye, CheckCircle, Zap } from 'lucide-react';
import { FrameAnalysisResult } from '../utils/visionPipeline';

interface DebugPanelProps {
  frameData: FrameAnalysisResult | null;
  modelName?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  frameData,
  modelName = 'yolov8n-edge.onnx (WASM / WebGL)'
}) => {
  if (!frameData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white font-mono text-xs">
        <div className="flex items-center gap-2 text-slate-400 mb-3">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-200">REAL-TIME VISION AI DEBUG PANEL</span>
        </div>
        <p className="text-slate-500">Initializing live webcam frame analysis pipeline...</p>
      </div>
    );
  }

  const {
    frameNumber,
    fps,
    latencyMs,
    detectedHand,
    cameraHealth,
    decision,
    dangerZoneIntersected,
    blurScore,
    brightnessLux,
    entropy,
    frameDifference,
    isFrozen,
    isObstructed,
    inferenceTimeMs
  } = frameData;

  const decisionBadgeColor =
    decision === 'EMERGENCY_STOP'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
      : decision === 'CAMERA_FAILURE'
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
      : decision === 'WARNING'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';

  const healthBadgeColor =
    cameraHealth.rating === 'Critical'
      ? 'text-rose-400'
      : cameraHealth.rating === 'Warning'
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white font-mono text-xs shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-100 text-sm tracking-wide">
            REAL-TIME VISION AI DEBUG PANEL
          </span>
          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[10px] font-bold">
            LIVE FEED
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Frame:</span>
          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded">
            #{frameNumber}
          </span>
        </div>
      </div>

      {/* Primary Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Model Loaded */}
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 block font-sans">YOLO Model</span>
          <span className="text-[11px] font-bold text-sky-300 truncate block">{modelName}</span>
        </div>

        {/* Class Detected */}
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 block font-sans">Detected Class</span>
          <span
            className={`text-xs font-bold block ${
              detectedHand ? 'text-amber-300' : 'text-slate-400'
            }`}
          >
            {detectedHand ? detectedHand.label : 'None'}
          </span>
        </div>

        {/* Confidence */}
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 block font-sans">Confidence</span>
          <span className="text-xs font-bold text-emerald-400 block">
            {detectedHand ? `${(detectedHand.confidence * 100).toFixed(1)}%` : '0.0%'}
          </span>
        </div>

        {/* Danger Zone Overlap */}
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 block font-sans">Danger Zone Overlap</span>
          <span
            className={`text-xs font-bold block ${
              dangerZoneIntersected ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {dangerZoneIntersected ? 'BREACHED' : 'CLEAR'}
          </span>
        </div>

        {/* Decision */}
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 block font-sans">System Decision</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold block text-center ${decisionBadgeColor}`}>
            {decision}
          </span>
        </div>
      </div>

      {/* Secondary Vision Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
        <div>
          <span className="text-slate-500 block text-[10px] font-sans">Blur Score (Laplacian)</span>
          <span className="font-bold text-slate-200">{blurScore.toFixed(1)}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] font-sans">Brightness / Lux</span>
          <span className="font-bold text-slate-200">{brightnessLux} lx</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] font-sans">Entropy</span>
          <span className="font-bold text-slate-200">{entropy.toFixed(2)}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] font-sans">Frame Difference (ΔI)</span>
          <span className="font-bold text-slate-200">{frameDifference.toFixed(2)}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] font-sans">FPS / Latency</span>
          <span className="font-bold text-sky-400">
            {fps} FPS / {latencyMs}ms
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] font-sans">Camera Health</span>
          <span className={`font-bold ${healthBadgeColor}`}>{cameraHealth.rating}</span>
        </div>
      </div>

      {/* Bounding Box Coordinates Bar */}
      {detectedHand && (
        <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>
              BBox: <strong className="text-amber-300">X:{detectedHand.bbox.x}% Y:{detectedHand.bbox.y}% W:{detectedHand.bbox.width}% H:{detectedHand.bbox.height}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Distance to Blade Center: <strong className="text-sky-300">{detectedHand.distanceToSawMm} mm</strong>
            </span>
            <span>
              Inference Time: <strong className="text-emerald-400">{inferenceTimeMs}ms</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
