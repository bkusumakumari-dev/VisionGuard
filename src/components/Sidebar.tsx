import React from 'react';
import {
  LayoutDashboard,
  Video,
  Activity,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  status: SystemStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  status
}) => {
  const navItems = [
    { id: 'home', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Camera Feed', icon: Video, badge: 'YOLOv8n' },
    { id: 'health', label: 'Camera Health', icon: Activity, badge: status.cameraHealth },
    { id: 'logs', label: 'Event Logs', icon: FileText, badge: status.totalDetectionsToday },
    { id: 'analytics', label: 'Analytics & AI', icon: BarChart3 },
    { id: 'settings', label: 'Danger Zone & Settings', icon: Settings }
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative z-20 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-full p-1 shadow-xs z-30 cursor-pointer"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-xs transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#0F4C81]/10 text-[#0F4C81] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0F4C81]' : 'text-slate-400'}`} />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    isActive
                      ? 'bg-[#0F4C81] text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Edge Hardware Specs Footer */}
      {!collapsed && (
        <div className="p-3 m-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0F4C81]" />
              RPi 5 Engine
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              ONLINE
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-mono text-slate-700">YOLOv8 Nano</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="font-mono text-slate-700">SQLite Local</span>
            </div>
            <div className="flex justify-between">
              <span>Relay Pin:</span>
              <span className="font-mono text-slate-700">GPIO 18</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
