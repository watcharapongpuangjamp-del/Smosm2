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
  Check,
  Server,
  Smartphone,
  ChevronDown,
  GitCompare,
} from 'lucide-react';
import { storage } from '../services/storage';
import { Household, Person, HealthScreening, Tombstone, AuditLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

interface DiffField {
  label: string;
  localValue: string;
  serverValue: string;
  isModified: boolean;
}

interface SyncConflict {
  id: string;
  type: 'household' | 'person';
  title: string;
  localTime: string;
  serverTime: string;
  diffFields: DiffField[];
}

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearData: () => void;
  households: Household[];
  persons: Person[];
  screenings: HealthScreening[];
  tombstones: Tombstone[];
  logs: AuditLog[];
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearData,
  households,
  persons,
  screenings,
  tombstones,
  logs,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [dragY, setDragY] = useState(0);

  const bindDrag = useDrag(({ down, movement: [, my] }) => {
    if (my > 0) {
      setDragY(down ? my : 0);
      if (!down && my > 100) {
        onClose();
      }
    }
  }, { filterTaps: true });

  if (!isOpen) return null;



  const handleTriggerSync = (forceConflict = false) => {
    setIsSyncing(true);
    setSyncDone(false);

    setTimeout(async () => {
      setIsSyncing(false);
      if (forceConflict || (households.length > 0 && Math.random() > 0.3)) {
        const h = households[0];
        const sampleConflict: SyncConflict = {
          id: h?.id || 'h-sample-1',
          type: 'household',
          title: `ข้อมูลหลังคาเรือน บ้านเลขที่ ${h?.houseNo || '12/1'} หมู่ ${h?.villageNo || 1}`,
          localTime: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          serverTime: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          diffFields: [
            {
              label: 'หัวหน้าครัวเรือน',
              localValue: h?.headOfHouseholdName || 'นายสมชาย ใจดี',
              serverValue: h?.headOfHouseholdName || 'นายสมชาย ใจดี',
              isModified: false,
            },
            {
              label: 'คะแนนสุขภิบาล',
              localValue: h?.sanitationRating === 'good' ? 'ดี (Good)' : 'พอใช้ (Fair)',
              serverValue: 'พอใช้ (Fair)',
              isModified: true,
            },
            {
              label: 'พบลูกน้ำยุงลาย',
              localValue: h?.mosquitoLarvaFound ? 'พบ (Found)' : 'ไม่พบ (Not Found)',
              serverValue: 'พบ (Found)',
              isModified: true,
            },
            {
              label: 'แหล่งน้ำใช้',
              localValue: h?.waterSource || 'ประปาหมู่บ้าน',
              serverValue: 'น้ำบาดาล',
              isModified: true,
            },
            {
              label: 'ผู้รับผิดชอบ (อสม.)',
              localValue: 'อสม. สมศรี รักสุขภาพ',
              serverValue: 'อสม. มาיר์ ใจดี',
              isModified: true,
            },
          ],
        };
        setConflicts([sampleConflict]);
        setShowConflictModal(true);
        await storage.log('sync', 'system', `[Conflict] ตรวจพบความขัดแย้งข้อมูลระหว่างเครื่องและเซิร์ฟเวอร์ (บ้านเลขที่ ${h?.houseNo || '12/1'})`);
      } else {
        setSyncDone(true);
        await storage.log('sync', 'system', 'ดำเนินการประสานข้อมูล (Sync) กับ Cloud สำเร็จ (ไม่มีความขัดแย้ง)');
      }
    }, 1000);
  };

  const handleResolveConflict = async (conflictId: string, choice: 'local' | 'server') => {
    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
    if (conflicts.length <= 1) {
      setShowConflictModal(false);
      setSyncDone(true);
      await storage.log('sync', 'system', `[Resolved] แก้ไขความขัดแย้งข้อมูลสำเร็จ โดยเลือกใช้ข้อมูลฝั่ง: ${choice === 'local' ? 'เครื่องท้องถิ่น' : 'เซิร์ฟเวอร์ Cloud'}`);
    }
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ y: dragY }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Drag Indicator handle for mobile swipe-to-dismiss */}
        <div {...bindDrag()} className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing bg-slate-50 border-b border-slate-100 md:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">สถานะระบบและความปลอดภัยข้อมูล (Sync & Security)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Sync Status Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl mt-0.5 shadow-sm">
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    สถานะการทำงาน: ออฟไลน์พร้อมซิงค์ (Offline-First)
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ข้อมูลจะถูกบันทึกในอุปกรณ์ทันที และเตรียมพร้อมซิงค์กับ Cloud พร้อมระบบตรวจจับความขัดแย้งอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={() => handleTriggerSync(true)}
                disabled={isSyncing}
                title="ทดสอบจำลองความขัดแย้งของข้อมูล"
                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 border border-amber-300 shadow-xs flex items-center gap-1.5"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>จำลอง Conflict Diff</span>
              </button>
              <button
                onClick={() => handleTriggerSync(false)}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'กดซิงค์ข้อมูล'}</span>
              </button>
            </div>
          </div>

          {syncDone && (
            <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ข้อมูลได้รับการตรวจสอบความสมบูรณ์และประสานกับ Cloud เรียบร้อยแล้ว (ไม่มีความขัดแย้ง)</span>
            </div>
          )}

          {/* Database & Storage Stats */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-400" />
              <span>สถิติข้อมูลที่จัดเก็บในฐานข้อมูล</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-lg font-bold text-slate-800">{households.length}</span>
                <span className="text-xs text-slate-500 block">หลังคาเรือน</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-lg font-bold text-slate-800">{persons.length}</span>
                <span className="text-xs text-slate-500 block">ประชากร</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-lg font-bold text-slate-800">{screenings.length}</span>
                <span className="text-xs text-slate-500 block">คัดกรองสุขภาพ</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-lg font-bold text-slate-800">{tombstones.length}</span>
                <span className="text-xs text-slate-500 block">Tombstones (ลบ)</span>
              </div>
            </div>
          </div>

          {/* Security & Access Partitioning */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
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

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white text-xs shadow-2xs">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูลตัวอย่าง</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-700 block">ล้างข้อมูลทั้งหมด (Clear All)</span>
              <span className="text-[11px] text-slate-500">
                ล้างข้อมูลทั้งหมดในเครื่องออกทันที โดยไม่โหลดค่าเริ่มต้น
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('ต้องการล้างข้อมูลทั้งหมดในเครื่องทันทีหรือไม่? (ไม่สามารถกู้คืนได้)')) {
                  onClearData();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างข้อมูลทั้งหมด</span>
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
      </motion.div>

      {/* Sync Conflict Resolution Side-by-Side Diff Modal Dialog */}
      <AnimatePresence>
        {showConflictModal && conflicts.length > 0 && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-amber-200 w-full max-w-3xl overflow-hidden flex flex-col my-8"
            >
              <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-amber-200" />
                  <h3 className="text-base font-bold">เครื่องมือเปรียบเทียบความขัดแย้งข้อมูล (Side-by-Side Diff)</h3>
                </div>
                <span className="text-xs bg-amber-700 px-2.5 py-1 rounded-lg font-mono">
                  {conflicts.length} รายการที่ต้องตรวจสอบ
                </span>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>ตรวจพบความขัดแย้งการแก้ไขข้อมูล (Sync Conflict):</strong> รายการด้านล่างถูกแก้ไขทั้งในอุปกรณ์ของคุณ (Local) และบน Cloud Server โปรดตรวจสอบตารางเปรียบเทียบ (Side-by-Side Diff) และเลือกเวอร์ชันที่ต้องการเก็บรักษา
                  </div>
                </div>

                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/60 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{conflict.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">ID: {conflict.id}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                        ต้องเลือกเวอร์ชัน
                      </span>
                    </div>

                    {/* Side-by-Side Diff Comparison Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                            <th className="p-3 font-semibold w-1/4">ฟิลด์ข้อมูล</th>
                            <th className="p-3 font-semibold w-3/8 text-blue-700 bg-blue-50/50">
                              <div className="flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>ในเครื่อง (Local) — {conflict.localTime}</span>
                              </div>
                            </th>
                            <th className="p-3 font-semibold w-3/8 text-emerald-700 bg-emerald-50/50">
                              <div className="flex items-center gap-1.5">
                                <Server className="w-3.5 h-3.5" />
                                <span>บน Cloud (Server) — {conflict.serverTime}</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {conflict.diffFields.map((field, idx) => (
                            <tr
                              key={idx}
                              className={field.isModified ? 'bg-amber-50/40 hover:bg-amber-50/80 transition' : 'hover:bg-slate-50'}
                            >
                              <td className="p-3 font-semibold text-slate-700">{field.label}</td>
                              <td
                                className={`p-3 font-medium ${
                                  field.isModified
                                    ? 'bg-blue-50/70 text-blue-900 font-semibold border-l-2 border-blue-500'
                                    : 'text-slate-600'
                                }`}
                              >
                                {field.localValue}
                              </td>
                              <td
                                className={`p-3 font-medium ${
                                  field.isModified
                                    ? 'bg-emerald-50/70 text-emerald-900 font-semibold border-l-2 border-emerald-500'
                                    : 'text-slate-600'
                                }`}
                              >
                                {field.serverValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Resolution Choice Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'local')}
                        className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>เก็บข้อมูลในเครื่อง (Keep Local)</span>
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'server')}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>เก็บข้อมูลบน Cloud (Accept Server)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>ระบบจะบันทึกประวัติการเลือกความขัดแย้งลง Audit Logs โดยอัตโนมัติ</span>
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
