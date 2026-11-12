import React from 'react';
import {
  X,
  Home,
  Users,
  MapPin,
  UserPlus,
  Heart,
  Bug,
  Droplet,
  Trash2,
  Edit,
  ClipboardList,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Household, Person, VhvMember } from '../types';
import { calculateAge, formatThaiDate } from '../utils/thaiId';
import { CARE_CATEGORY_CONFIG } from '../utils/health';

interface HouseholdDetailModalProps {
  isOpen: boolean;
  household: Household | null;
  persons: Person[];
  vhvMembers: VhvMember[];
  onClose: () => void;
  onAddMember: (householdId: string) => void;
  onEditMember: (person: Person) => void;
  onDeleteMember: (personId: string) => void;
  onScreenMember: (person: Person) => void;
  onOpenAppointments: (person: Person) => void;
}

export const HouseholdDetailModal: React.FC<HouseholdDetailModalProps> = ({
  isOpen,
  household,
  persons,
  vhvMembers,
  onClose,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onScreenMember,
  onOpenAppointments,
}) => {
  if (!isOpen || !household) return null;

  const members = persons.filter((p) => p.householdId === household.id);
  const vhv = vhvMembers.find((v) => v.id === household.vhvMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="text-lg font-bold">
                บ้านเลขที่ {household.houseNo} หมู่ {household.villageNo}
              </h2>
              <p className="text-xs text-emerald-100">
                {household.villageName} ต.{household.subdistrict} อ.{household.district} จ.{household.province}
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* House Info Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">เจ้าบ้าน / หัวหน้าครอบครัว</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {household.headOfHouseholdName}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">อสม. ผู้รับผิดชอบ</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {vhv ? vhv.name : 'ไม่ได้ระบุ'}
              </span>
              <span className="text-[11px] text-slate-500">{vhv?.phone || ''}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">พิกัด GIS & สถานะยุงลาย</span>
              <div className="flex items-center gap-1 text-xs text-slate-700 font-mono mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{household.latitude.toFixed(5)}, {household.longitude.toFixed(5)}</span>
              </div>
              <div className="mt-1">
                {household.mosquitoLarvaFound ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <Bug className="w-3.5 h-3.5" /> พบลูกน้ำยุงลาย
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ปลอดลูกน้ำยุงลาย
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Members List Header & Action */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-800">
                  รายชื่อผู้อยู่อาศัยในครัวเรือน ({members.length} คน)
                </h3>
              </div>

              <button
                onClick={() => onAddMember(household.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่มสมาชิกในบ้าน</span>
              </button>
            </div>

            {members.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">ยังไม่มีข้อมูลสมาชิกที่ผูกกับบ้านเลขที่นี้</p>
                <button
                  onClick={() => onAddMember(household.id)}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  คลิกที่นี่เพื่อลงทะเบียนสมาชิกคนแรก
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {members.map((person) => {
                  const age = calculateAge(person.birthDate);
                  const careConfig = CARE_CATEGORY_CONFIG[person.careCategory];

                  return (
                    <div
                      key={person.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {person.title}
                            {person.firstName} {person.lastName}
                          </span>
                          <span className="text-xs text-slate-500">
                            อายุ {age} ปี ({person.gender === 'male' ? 'ชาย' : 'หญิง'})
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${careConfig.badgeClass}`}>
                            {careConfig.shortLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span>เลขบัตร: {person.citizenId}</span>
                          <span>หมู่เลือด: {person.bloodGroup}</span>
                          {person.phone && <span>โทร: {person.phone}</span>}
                        </div>

                        {person.chronicDiseases.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {person.chronicDiseases.map((disease, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                              >
                                {disease}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => onOpenAppointments(person)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                          title="ปฏิทินนัดหมายและลงพื้นที่รายบุคคล"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>นัดหมาย</span>
                        </button>
                        <button
                          onClick={() => onScreenMember(person)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
                          title="บันทึกคัดกรองสุขภาพ"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>คัดกรอง</span>
                        </button>
                        <button
                          onClick={() => onEditMember(person)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="แก้ไขข้อมูลบุคคล"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ยืนยันการลบ ${person.firstName} ${person.lastName} หรือไม่?`)) {
                              onDeleteMember(person.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="ลบข้อมูลบุคคล"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
