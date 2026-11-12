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
} from 'lucide-react';
import { storage } from '../services/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

interface SyncConflict {
  id: string;
  type: 'household' | 'person';
  title: string;
  localTime: string;
  serverTime: string;
  localDetails: string;
  serverDetails: string;
}

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearData: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearData,
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

  const households = storage.getHouseholds();
  const persons = storage.getPersons();
  const screenings = storage.getScreenings();
  const tombstones = storage.getTombstones();
  const logs = storage.getAuditLogs();

  const handleTriggerSync = (forceConflict = false) => {
    setIsSyncing(true);
    setSyncDone(false);

    setTimeout(() => {
      setIsSyncing(false);
      if (forceConflict || (households.length > 0 && Math.random() > 0.3)) {
        const sampleConflict: SyncConflict = {
          id: households[0]?.id || 'h-sample-1',
          type: 'household',
          title: `ข้อมูลหลังคาเรือน บ้านเลขที่ ${households[0]?.houseNo || '12/1'} หมู่ ${households[0]?.villageNo || 1}`,
          localTime: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          serverTime: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          localDetails: `แก้ไขในเครื่อง: หัวหน้าครัวเรือน "${households[0]?.headOfHouseholdName || 'นายสมชาย'}", สภาพแวดล้อม: ดี`,
          serverDetails: `แก้ไขบน Cloud: หัวหน้าครัวเรือน "${households[0]?.headOfHouseholdName || 'นายสมชาย'} (ปรับปรุงโดย อสม. ท่านอื่น)", สภาพแวดล้อม: พอใช้`,
        };
        setConflicts([sampleConflict]);
        setShowConflictModal(true);
        storage.log('sync', 'system', `[Conflict] ตรวจพบความขัดแย้งข้อมูลระหว่างเครื่องและเซิร์ฟเวอร์ (บ้านเลขที่ ${households[0]?.houseNo || '12/1'})`);
      } else {
        setSyncDone(true);
        storage.log('sync', 'system', 'ดำเนินการประสานข้อมูล (Sync) กับ Cloud สำเร็จ (ไม่มีความขัดแย้ง)');
      }
    }, 1000);
  };

  const handleResolveConflict = (conflictId: string, choice: 'local' | 'server') => {
    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
    if (conflicts.length <= 1) {
      setShowConflictModal(false);
      setSyncDone(true);
      storage.log('sync', 'system', `[Resolved] แก้ไขความขัดแย้งข้อมูลสำเร็จ โดยเลือกใช้ข้อมูลฝั่ง: ${choice === 'local' ? 'เครื่องท้องถิ่น' : 'เซิร์ฟเวอร์ Cloud'}`);
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
                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 border border-amber-300 shadow-xs"
              >
                ทดสอบจำลอง Conflict
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

      {/* Sync Conflict Resolution Modal Dialog */}
      <AnimatePresence>
        {showConflictModal && conflicts.length > 0 && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-amber-200 w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                  <h3 className="text-base font-bold">ตรวจพบความขัดแย้งในการซิงค์ข้อมูล (Sync Conflict)</h3>
                </div>
                <span className="text-xs bg-amber-700 px-2.5 py-1 rounded-lg font-mono">
                  {conflicts.length} รายการ
                </span>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  ระบบตรวจพบว่าข้อมูลชุดนี้ถูกแก้ไขทั้งในเครื่องของคุณและบน Cloud Server ในเวลาไล่เลี่ยกัน โปรดเลือกข้อมูลที่คุณต้องการเก็บรักษาไว้ก่อนซิงค์ต่อ:
                </div>

                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{conflict.title}</span>
                      <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-semibold">
                        ต้องตัดสินใจเลือก
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Local Version Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1">
                            <Smartphone className="w-4 h-4" />
                            <span>ข้อมูลในเครื่อง (Local)</span>
                          </div>
                          <p className="text-slate-500 text-[11px] mb-2 font-mono">เวลา: {conflict.localTime}</p>
                          <p className="text-slate-700 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 leading-relaxed">
                            {conflict.localDetails}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResolveConflict(conflict.id, 'local')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>ใช้ข้อมูลในเครื่องนี้</span>
                        </button>
                      </div>

                      {/* Server Version Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                            <Server className="w-4 h-4" />
                            <span>ข้อมูลบน Cloud (Server)</span>
                          </div>
                          <p className="text-slate-500 text-[11px] mb-2 font-mono">เวลา: {conflict.serverTime}</p>
                          <p className="text-slate-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 leading-relaxed">
                            {conflict.serverDetails}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResolveConflict(conflict.id, 'server')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>ใช้ข้อมูลบน Server นี้</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>การตัดสินใจจะถูกบันทึกใน Audit Trail อัตโนมัติ</span>
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                >
                  ยกเลิกการซิงค์
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
