import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Edit2,
  CalendarDays,
  FileText,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Activity,
  Home,
  Syringe,
  Bug,
  HelpCircle,
} from 'lucide-react';
import {
  Person,
  Appointment,
  AppointmentType,
  AppointmentStatus,
  Household,
  VhvMember,
} from '../types';
import { calculateAge, formatThaiDate } from '../utils/thaiId';
import { CARE_CATEGORY_CONFIG } from '../utils/health';
import { storage } from '../services/storage';

interface PersonalAppointmentModalProps {
  isOpen: boolean;
  person: Person | null;
  household?: Household | null;
  vhvMembers: VhvMember[];
  onClose: () => void;
  onAppointmentsChange: () => void;
}

export const APPOINTMENT_TYPE_CONFIG: Record<
  AppointmentType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  home_visit: {
    label: 'เยี่ยมบ้านผู้ป่วยติดเตียง/ติดบ้าน',
    icon: Home,
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  vitals_check: {
    label: 'ตรวจวัดความดัน/เจาะน้ำตาล (DTX)',
    icon: Activity,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  hospital_visit: {
    label: 'พบแพทย์/รับยาที่ รพ.สต. หรือ รพ.',
    icon: Stethoscope,
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  vaccine: {
    label: 'นัดฉีดวัคซีน (ไข้หวัดใหญ่/เด็ก/ผู้สูงอายุ)',
    icon: Syringe,
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
  larva_survey: {
    label: 'สำรวจลูกน้ำยุงลายและสุขาภิบาลรอบบ้าน',
    icon: Bug,
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  other: {
    label: 'นัดหมายอื่นๆ',
    icon: HelpCircle,
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
  },
};

export const PersonalAppointmentModal: React.FC<PersonalAppointmentModalProps> = ({
  isOpen,
  person,
  household,
  vhvMembers,
  onClose,
  onAppointmentsChange,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AppointmentType>('home_visit');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [vhvMemberId, setVhvMemberId] = useState('');
  const [notes, setNotes] = useState('');

  // Calendar view month state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const loadAppointments = () => {
    if (person) {
      const list = storage.getAppointmentsByPerson(person.id);
      setAppointments(list);
    }
  };

  useEffect(() => {
    if (person && isOpen) {
      loadAppointments();
      setIsAdding(false);
      setEditingAppointmentId(null);
      resetForm();
    }
  }, [person, isOpen]);

  const resetForm = () => {
    setTitle('');
    setType('home_visit');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('09:30');
    setLocation(household ? `บ้านเลขที่ ${household.houseNo} หมู่ ${household.villageNo}` : 'บ้านผู้ป่วย');
    setVhvMemberId(household?.vhvMemberId || vhvMembers[0]?.id || '');
    setNotes('');
  };

  if (!isOpen || !person) return null;

  const age = calculateAge(person.birthDate);
  const careConfig = CARE_CATEGORY_CONFIG[person.careCategory];

  const handleStartAdd = () => {
    resetForm();
    setEditingAppointmentId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (apt: Appointment) => {
    setTitle(apt.title);
    setType(apt.type);
    setDate(apt.date);
    setTime(apt.time || '09:00');
    setLocation(apt.location);
    setVhvMemberId(apt.vhvMemberId);
    setNotes(apt.notes || '');
    setEditingAppointmentId(apt.id);
    setIsAdding(true);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingAppointmentId(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert('กรุณากรอกหัวข้อนัดหมายและเลือกวันที่');
      return;
    }

    const payload: Appointment = {
      id: editingAppointmentId || `apt-${Date.now()}`,
      personId: person.id,
      householdId: person.householdId,
      villageNo: person.villageNo,
      vhvMemberId: vhvMemberId || 'vhv-1',
      title: title.trim(),
      type,
      date,
      time: time || undefined,
      location: location.trim() || 'บ้านผู้ป่วย',
      status: 'upcoming',
      notes: notes.trim() || undefined,
      createdAt: editingAppointmentId
        ? appointments.find((a) => a.id === editingAppointmentId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveAppointment(payload);
    loadAppointments();
    onAppointmentsChange();
    setIsAdding(false);
    setEditingAppointmentId(null);
  };

  const handleStatusChange = (aptId: string, status: AppointmentStatus) => {
    storage.updateAppointmentStatus(aptId, status);
    loadAppointments();
    onAppointmentsChange();
  };

  const handleDelete = (aptId: string) => {
    if (confirm('ยืนยันการลบนัดหมายนี้หรือไม่?')) {
      storage.deleteAppointment(aptId);
      loadAppointments();
      onAppointmentsChange();
    }
  };

  // Calendar calculation
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay(); // 0 = Sun

  const monthNameThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ][calendarMonth.getMonth()];
  const yearThai = calendarMonth.getFullYear() + 543;

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">ปฏิทินนัดหมายและลงพื้นที่รายบุคคล</h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${careConfig.badgeClass}`}>
                  {careConfig.shortLabel}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {person.title}{person.firstName} {person.lastName} • อายุ {age} ปี • บ้านเลขที่ {household?.houseNo || '-'} หมู่ {person.villageNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Actions: Add New Appointment Button */}
          {!isAdding && (
            <div className="flex items-center justify-between bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
              <div className="text-xs text-emerald-900">
                <span className="font-bold">นัดหมายทั้งหมดของ {person.firstName}: </span>
                <span>มี {appointments.filter((a) => a.status === 'upcoming').length} นัดหมายที่รอลงพื้นที่</span>
              </div>
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มนัดหมายใหม่</span>
              </button>
            </div>
          )}

          {/* Add / Edit Form Drawer */}
          {isAdding && (
            <form onSubmit={handleSaveForm} className="bg-slate-50 p-5 rounded-2xl border border-emerald-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-sm text-slate-800">
                  {editingAppointmentId ? 'แก้ไขข้อมูลการนัดหมาย' : 'สร้างการนัดหมาย / วางแผนลงพื้นที่ใหม่'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  ✕ ยกเลิก
                </button>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หัวข้อนัดหมาย <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น เยี่ยมบ้านติดตามแผลกดทับ, ตรวจ DTX"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ประเภทการนัดหมาย <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AppointmentType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                  >
                    <option value="home_visit">🏠 เยี่ยมบ้านผู้ป่วยติดเตียงและติดบ้าน</option>
                    <option value="vitals_check">🩺 นัดตรวจวัดความดันและเจาะน้ำตาลปลายนิ้ว (DTX)</option>
                    <option value="hospital_visit">🏥 นัดพบแพทย์และรับยาประจำที่ รพ.สต. หรือ รพ.</option>
                    <option value="vaccine">💉 นัดฉีดวัคซีน (ไข้หวัดใหญ่/เด็ก/ผู้สูงอายุ)</option>
                    <option value="larva_survey">🦟 นัดสำรวจลูกน้ำยุงลายและสุขาภิบาลรอบบ้าน</option>
                    <option value="other">📋 นัดหมายอื่นๆ</option>
                  </select>
                </div>
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่นัดหมาย <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลานัดหมาย</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานที่นัดหมาย</label>
                  <input
                    type="text"
                    placeholder="เช่น บ้านผู้ป่วย, รพ.สต."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* VHV Assignee & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อสม. ผู้รับผิดชอบ</label>
                  <select
                    value={vhvMemberId}
                    onChange={(e) => setVhvMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  >
                    {vhvMembers.map((vhv) => (
                      <option key={vhv.id} value={vhv.id}>
                        {vhv.name} ({vhv.zoneName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ / คำแนะนำการเตรียมตัว</label>
                  <input
                    type="text"
                    placeholder="เช่น อดอาหาร 8 ชม., เตรียมสมุดประจำตัวผู้ป่วย"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  {editingAppointmentId ? 'บันทึกการแก้ไข' : 'บันทึกการนัดหมาย'}
                </button>
              </div>
            </form>
          )}

          {/* Grid Layout: Left = Monthly Calendar View, Right = Appointment Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Mini Monthly Calendar (2 cols) */}
            <div className="lg:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">
                  {monthNameThai} {yearThai}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
                <span>อา</span>
                <span>จ</span>
                <span>อ</span>
                <span>พ</span>
                <span>พฤ</span>
                <span>ศ</span>
                <span>ส</span>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {/* Empty slots before day 1 */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8"></div>
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const monthStr = String(calendarMonth.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(dayNum).padStart(2, '0');
                  const dateStr = `${calendarMonth.getFullYear()}-${monthStr}-${dayStr}`;

                  const dayApts = appointments.filter((a) => a.date === dateStr);
                  const hasUpcoming = dayApts.some((a) => a.status === 'upcoming');
                  const hasCompleted = dayApts.some((a) => a.status === 'completed');

                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                        isToday
                          ? 'bg-emerald-100 font-bold text-emerald-800 border border-emerald-300'
                          : 'hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[11px]">{dayNum}</span>
                      {dayApts.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasUpcoming && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                          {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>นัดหมายที่กำลังจะมาถึง</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>เสร็จสิ้นแล้ว</span>
                </div>
              </div>
            </div>

            {/* Right: Appointments List (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <span>รายการนัดหมาย ({appointments.length} รายการ)</span>
                </h3>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">ยังไม่มีนัดหมายส่วนบุคคลสำหรับประชากรท่านนี้</p>
                  <p className="text-[11px] text-slate-400 mt-1">คลิก "+ เพิ่มนัดหมายใหม่" เพื่อกำหนดแผนการลงพื้นที่</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {appointments.map((apt) => {
                    const typeConfig = APPOINTMENT_TYPE_CONFIG[apt.type] || APPOINTMENT_TYPE_CONFIG.other;
                    const IconComp = typeConfig.icon;
                    const vhv = vhvMembers.find((v) => v.id === apt.vhvMemberId);

                    return (
                      <div
                        key={apt.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          apt.status === 'completed'
                            ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                            : apt.status === 'cancelled'
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-lg ${typeConfig.bgClass} ${typeConfig.colorClass} shrink-0 mt-0.5`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {apt.title}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.bgClass} ${typeConfig.colorClass} border ${typeConfig.borderClass}`}>
                                  {typeConfig.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {formatThaiDate(apt.date)} {apt.time && `เวลา ${apt.time} น.`}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {apt.location}
                                </span>
                              </div>

                              {apt.notes && (
                                <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  {apt.notes}
                                </p>
                              )}

                              <div className="text-[10px] text-slate-400 mt-1">
                                อสม. ผู้รับผิดชอบ: {vhv?.name || '-'}
                              </div>
                            </div>
                          </div>

                          {/* Status Actions */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {apt.status === 'upcoming' && (
                              <button
                                onClick={() => handleStatusChange(apt.id, 'completed')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                                title="ทำเครื่องหมายว่าลงพื้นที่/ดำเนินการเสร็จสิ้นแล้ว"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>เสร็จสิ้น</span>
                              </button>
                            )}

                            {apt.status === 'completed' && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ดำเนินการแล้ว</span>
                              </span>
                            )}

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(apt)}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded"
                                title="แก้ไขนัดหมาย"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(apt.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                                title="ลบนัดหมาย"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
