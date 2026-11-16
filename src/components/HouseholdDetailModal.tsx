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
  Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Smart OSM Report - Household No. ${household.houseNo}`, 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Village No: ${household.villageNo} (${household.villageName})`, 14, 28);
    doc.text(`Subdistrict: ${household.subdistrict} | District: ${household.district} | Province: ${household.province}`, 14, 34);
    doc.text(`Head of Household: ${household.headOfHouseholdName} | VHV Member: ${vhv ? vhv.name : 'N/A'}`, 14, 40);
    doc.text(`Sanitation Rating: ${household.sanitationRating} | Mosquito Larva Found: ${household.mosquitoLarvaFound ? 'YES' : 'NO'}`, 14, 46);

    const memberRows = members.map((p, idx) => [
      idx + 1,
      `${p.title}${p.firstName} ${p.lastName}`,
      p.citizenId,
      p.gender === 'male' ? 'Male' : 'Female',
      calculateAge(p.birthDate),
      p.careCategory,
      p.chronicDiseases.join(', ') || '-'
    ]);

    (doc as any).autoTable({
      startY: 54,
      head: [['No.', 'Full Name', 'Citizen ID', 'Gender', 'Age', 'Care Status', 'Chronic Diseases']],
      body: memberRows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 9 }
    });

    doc.save(`Household_${household.houseNo}_Village_${household.villageNo}_Report.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              title="พิมพ์รายงาน PDF ครัวเรือน"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* House Info Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">เจ้าบ้าน / หัวหน้าครอบครัว</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                {household.headOfHouseholdName}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">อสม. ผู้รับผิดชอบ</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                {vhv ? vhv.name : 'ไม่ได้ระบุ'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{vhv?.phone || ''}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">พิกัด GIS & สถานะยุงลาย</span>
              <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-mono mt-0.5">
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
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
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
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ยังไม่มีข้อมูลสมาชิกที่ผูกกับบ้านเลขที่นี้</p>
                <button
                  onClick={() => onAddMember(household.id)}
                  className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  คลิกที่นี่เพื่อลงทะเบียนสมาชิกคนแรก
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                {members.map((person) => {
                  const age = calculateAge(person.birthDate);
                  const careConfig = CARE_CATEGORY_CONFIG[person.careCategory];

                  return (
                    <div
                      key={person.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {person.title}
                            {person.firstName} {person.lastName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            อายุ {age} ปี ({person.gender === 'male' ? 'ชาย' : 'หญิง'})
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${careConfig.badgeClass}`}>
                            {careConfig.shortLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>เลขบัตร: {person.citizenId}</span>
                          <span>หมู่เลือด: {person.bloodGroup}</span>
                          {person.phone && <span>โทร: {person.phone}</span>}
                        </div>

                        {person.chronicDiseases.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {person.chronicDiseases.map((disease, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium"
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
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors"
                          title="ปฏิทินนัดหมายและลงพื้นที่รายบุคคล"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>นัดหมาย</span>
                        </button>
                        <button
                          onClick={() => onScreenMember(person)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                          title="บันทึกคัดกรองสุขภาพ"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>คัดกรอง</span>
                        </button>
                        <button
                          onClick={() => onEditMember(person)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
