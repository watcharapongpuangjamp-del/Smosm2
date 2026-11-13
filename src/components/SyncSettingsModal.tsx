import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  History,
  AlertTriangle,
  RotateCcw,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { Household, Person, HealthScreening, Tombstone, AuditLog } from '../types';
import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

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
  const [dragY, setDragY] = useState(0);

  const bindDrag = useDrag(({ down, movement: [, my] }) => {
    if (my > 0) {
      setDragY(down ? my : 0);
      if (!down && my > 100) onClose();
    }
  }, { filterTaps: true });

  if (!isOpen) return null;

  const handleReset = () => {
    if (confirm('ต้องการคืนค่าข้อมูลระบบสู่ค่าเริ่มต้นการสาธิตหรือไม่? (ข้อมูลที่เพิ่มใหม่จะถูกรีเซ็ต)')) {
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
        <div {...bindDrag()} className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing bg-slate-50 border-b border-slate-100 md:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">สถานะระบบและความปลอดภัยข้อมูล</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 shadow-sm">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">สถานะการทำงาน: เก็บข้อมูลในอุปกรณ์</span>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                รุ่นนี้ยังไม่ได้กำหนดและตรวจสอบปลายทาง Cloud จึงไม่มีการซิงก์หรือส่งข้อมูลออกจากอุปกรณ์อัตโนมัติ
                ควรส่งออกไฟล์ JSON จากเมนูนำเข้า/ส่งออกเพื่อสำรองข้อมูลก่อนเปลี่ยนหรือล้างอุปกรณ์
              </p>
            </div>
          </div>

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

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>ข้อควรระวังด้านสิทธิ์เข้าถึง</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              รุ่นนี้ยังไม่มีระบบบัญชีผู้ใช้หรือการกำหนดสิทธิ์จากเซิร์ฟเวอร์ ผู้ที่ปลดล็อกอุปกรณ์สามารถเข้าถึงข้อมูลในแอปได้
              ควรใช้รหัสล็อกอุปกรณ์ ไม่แชร์ไฟล์สำรอง JSON และลบข้อมูลก่อนส่งต่ออุปกรณ์
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              <span>บันทึกประวัติการเปลี่ยนแปลงระบบ</span>
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

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">คืนค่าข้อมูลตั้งต้นระบบ</span>
              <span className="text-[11px] text-slate-500">ล้างข้อมูลและโหลดชุดข้อมูลตัวอย่างสาธิตใหม่อีกครั้ง</span>
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
              <span className="text-xs font-bold text-rose-700 block">ล้างข้อมูลทั้งหมด</span>
              <span className="text-[11px] text-slate-500">ล้างข้อมูลทั้งหมดในเครื่องออกทันที โดยไม่โหลดค่าเริ่มต้น</span>
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

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            ปิด
          </button>
        </div>
      </motion.div>
    </div>
  );
};
