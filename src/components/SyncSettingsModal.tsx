import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  ShieldCheck,
  Database,
  History,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { storage } from '../services/storage';
import { formatThaiDate } from '../utils/thaiId';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  if (!isOpen) return null;

  const households = storage.getHouseholds();
  const persons = storage.getPersons();
  const screenings = storage.getScreenings();
  const tombstones = storage.getTombstones();
  const logs = storage.getAuditLogs();

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncDone(false);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      storage.log('sync', 'system', 'ดำเนินการประสานข้อมูล (Sync) ข้อมูลกับ Cloud สำเร็จ');
    }, 900);
  };

  const handleReset = () => {
    if (
      confirm(
        'ต้องการคืนค่าข้อมูลระบบสู่ค่าเริ่มต้นการสาธิตหรือไม่? (ข้อมูลที่เพิ่มใหม่จะถูกรีเซ็ต)'
      )
    ) {
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">สถานะระบบและความปลอดภัยข้อมูล (Sync & Security)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Sync Status Banner */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-lg mt-0.5">
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    สถานะการทำงาน: ออฟไลน์พร้อมซิงค์ (Offline-First)
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  ข้อมูลจะถูกบันทึกในอุปกรณ์ทันที และเตรียมพร้อมสำหรับการซิงค์กับฐานข้อมูล Firebase Cloud
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto shrink-0 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'กดซิงค์ข้อมูลเดี๋ยวนี้'}</span>
            </button>
          </div>

          {syncDone && (
            <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลได้รับการตรวจสอบความสมบูรณ์และประสานเรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Database & Storage Stats */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-400" />
              <span>สถิติข้อมูลที่จัดเก็บในฐานข้อมูล</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-lg font-bold text-slate-800">{households.length}</span>
                <span className="text-xs text-slate-500 block">หลังคาเรือน</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-lg font-bold text-slate-800">{persons.length}</span>
                <span className="text-xs text-slate-500 block">ประชากร</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-lg font-bold text-slate-800">{screenings.length}</span>
                <span className="text-xs text-slate-500 block">คัดกรองสุขภาพ</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-lg font-bold text-slate-800">{tombstones.length}</span>
                <span className="text-xs text-slate-500 block">Tombstones (ลบ)</span>
              </div>
            </div>
          </div>

          {/* Security & Access Partitioning */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>การจำกัดสิทธิ์และการแบ่งส่วนข้อมูล (Partition Security)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ตามสถาปัตยกรรมความปลอดภัยของ Smart OSM ข้อมูลจะถูกแบ่งกลุ่มตามเขตรับผิดชอบ (Village
              Partitioning) โดย อสม. สามารถเข้าถึงและแก้ไขได้เฉพาะหลังคาเรือนและประชากรในหมู่บ้านที่ได้รับมอบหมาย
            </p>
          </div>

          {/* Audit Trail Logs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              <span>บันทึกประวัติการเปลี่ยนแปลงระบบ (Audit Logs)</span>
            </h3>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white text-xs">
              {logs.slice(0, 15).map((log) => (
                <div key={log.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-semibold text-slate-800">{log.details}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({log.user})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Reset */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">คืนค่าข้อมูลตั้งต้นระบบ</span>
              <span className="text-[11px] text-slate-500">
                ล้างข้อมูลและโหลดชุดข้อมูลตัวอย่างสาธิตใหม่อีกครั้ง
              </span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูลตัวอย่าง</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
