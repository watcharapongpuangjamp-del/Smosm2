import React from 'react';
import {
  Activity,
  Home,
  Users,
  MapPin,
  FileText,
  BookOpen,
  RefreshCw,
  FileSpreadsheet,
  HeartPulse,
} from 'lucide-react';
import { Village } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  villages: Village[];
  selectedVillageNo: number;
  onVillageChange: (no: number) => void;
  onOpenSyncModal: () => void;
  onOpenDataExchange: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  villages,
  selectedVillageNo,
  onVillageChange,
  onOpenSyncModal,
  onOpenDataExchange,
}) => {
  return (
    <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold text-xl shadow-sm">
              <HeartPulse className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">Smart OSM Next</span>
                <span className="text-[11px] font-semibold uppercase bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full">
                  อสม. ดิจิทัล
                </span>
              </div>
              <p className="text-xs text-emerald-100 hidden sm:block">
                ระบบทะเบียนประชากร ครัวเรือน และแผนที่สุขภาพชุมชน
              </p>
            </div>
          </div>

          {/* Village Filter & Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Village Selector */}
            <div className="flex items-center bg-emerald-800/80 rounded-lg px-2.5 py-1 text-sm border border-emerald-600/50">
              <span className="text-emerald-200 mr-2 text-xs font-medium hidden md:inline">พื้นที่รับผิดชอบ:</span>
              <select
                value={selectedVillageNo}
                onChange={(e) => onVillageChange(Number(e.target.value))}
                className="bg-transparent text-white font-medium text-xs sm:text-sm focus:outline-none cursor-pointer"
              >
                <option value={0} className="text-slate-800">
                  ทุกหมู่บ้าน (ทั้งหมด)
                </option>
                {villages.map((v) => (
                  <option key={v.id} value={v.no} className="text-slate-800">
                    หมู่ {v.no} {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Excel / Import / Export Button */}
            <button
              onClick={onOpenDataExchange}
              title="นำเข้า / ส่งออก Excel & ข้อมูล"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel/นำเข้า</span>
            </button>

            {/* Sync Status / Settings Button */}
            <button
              onClick={onOpenSyncModal}
              title="สถานะระบบและความปลอดภัยข้อมูล"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-emerald-100 text-xs sm:text-sm font-medium transition-colors border border-emerald-600/40"
            >
              <RefreshCw className="w-4 h-4 text-emerald-300" />
              <span className="hidden md:inline">ระบบ Sync</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-emerald-800/95 border-t border-emerald-600/40 px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-1 text-sm font-medium">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>ภาพรวม & แดชบอร์ด</span>
          </button>

          <button
            onClick={() => onTabChange('households')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'households'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>จัดการครัวเรือน</span>
          </button>

          <button
            onClick={() => onTabChange('persons')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'persons'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ทะเบียนประชากร</span>
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'map'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>แผนที่สุขภาพ GIS</span>
          </button>

          <button
            onClick={() => onTabChange('vhv')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'vhv'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>รายงาน อสม. ประจำเดือน</span>
          </button>

          <button
            onClick={() => onTabChange('knowledge')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
              currentTab === 'knowledge'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>คู่มือ & AI สุขภาพ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
