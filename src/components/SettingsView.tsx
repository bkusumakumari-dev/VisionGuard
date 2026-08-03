import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  Shield,
  Volume2,
  Cpu,
  RefreshCcw,
  Square,
  Move
} from 'lucide-react';
import { SettingsConfig } from '../types';

interface SettingsViewProps {
  settings: SettingsConfig;
  onSaveSettings: (newSettings: SettingsConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [formData, setFormData] = useState<SettingsConfig>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">VisionGuard AI System Configuration</h2>
          <p className="text-xs text-slate-500">
            Configure YOLOv8 confidence scores, danger zone bounding polygons, sensitivity, and hardware relay pins.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: AI & Detection Parameters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0F4C81]" />
            <h3 className="font-bold text-slate-800 text-sm">YOLOv8 AI Detection Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confidence Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700">YOLOv8 Confidence Threshold</label>
                <span className="font-mono font-bold text-[#0F4C81]">
                  {(formData.confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.99"
                step="0.01"
                value={formData.confidenceThreshold}
                onChange={e => setFormData({ ...formData, confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F4C81]"
              />
              <p className="text-[11px] text-slate-500">
                Minimum inference confidence required to register a human hand detection. High recommended (85%+).
              </p>
            </div>

            {/* Sensitivity */}
            <div className="space-y-2">
              <label className="block font-semibold text-xs text-slate-700">Detection Sensitivity</label>
              <select
                value={formData.detectionSensitivity}
                onChange={e =>
                  setFormData({ ...formData, detectionSensitivity: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30"
              >
                <option value="LOW">LOW (Slower response, zero false positives)</option>
                <option value="MEDIUM">MEDIUM (Balanced 50ms evaluation)</option>
                <option value="HIGH">HIGH (Ultra-fast &lt;20ms trip - Industrial Default)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                HIGH sensitivity evaluates consecutive frames instantly for saw blade proximity.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Danger Zone Perimeter Config */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-slate-800 text-sm">Danger Zone Polygon / Boundary Coordinates</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Normalized Frame Percentages (0-100%)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">X Origin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.dangerZone.x}
                onChange={e =>
                  setFormData({
                    ...formData,
                    dangerZone: { ...formData.dangerZone, x: parseInt(e.target.value) || 0 }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Y Origin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.dangerZone.y}
                onChange={e =>
                  setFormData({
                    ...formData,
                    dangerZone: { ...formData.dangerZone, y: parseInt(e.target.value) || 0 }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Width (%)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.dangerZone.width}
                onChange={e =>
                  setFormData({
                    ...formData,
                    dangerZone: { ...formData.dangerZone, width: parseInt(e.target.value) || 10 }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Height (%)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.dangerZone.height}
                onChange={e =>
                  setFormData({
                    ...formData,
                    dangerZone: { ...formData.dangerZone, height: parseInt(e.target.value) || 10 }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Hardware Interlock & Alarm Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Raspberry Pi 5 Hardware & Interlock Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Relay Latch Mode */}
            <div className="space-y-2">
              <label className="block font-semibold text-xs text-slate-700">E-Stop Latch Recovery Mode</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="latchMode"
                    value="MANUAL_RESET"
                    checked={formData.emergencyLatchMode === 'MANUAL_RESET'}
                    onChange={() => setFormData({ ...formData, emergencyLatchMode: 'MANUAL_RESET' })}
                    className="accent-[#0F4C81]"
                  />
                  <span>Manual Supervisor Latch Reset (OSHA Compliant)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="latchMode"
                    value="AUTO_RESET"
                    checked={formData.emergencyLatchMode === 'AUTO_RESET'}
                    onChange={() => setFormData({ ...formData, emergencyLatchMode: 'AUTO_RESET' })}
                    className="accent-[#0F4C81]"
                  />
                  <span>Automatic Reset when Hand Exits Danger Zone</span>
                </label>
              </div>
            </div>

            {/* Hardware Relay GPIO Pin */}
            <div className="space-y-2">
              <label className="block font-semibold text-xs text-slate-700">Pi 5 GPIO Output Relay Pin</label>
              <select
                value={formData.hardwareRelayGpioPin}
                onChange={e => setFormData({ ...formData, hardwareRelayGpioPin: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
              >
                <option value={18}>GPIO 18 (Pin 12) - High-Speed Optocoupler Relay</option>
                <option value={23}>GPIO 23 (Pin 16) - Secondary Contactor</option>
                <option value={24}>GPIO 24 (Pin 18) - Auxiliary Brake</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0F4C81] hover:bg-[#0c3e6b] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Industrial Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
