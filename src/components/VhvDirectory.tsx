import React, { useState } from 'react';
import {
  FileText,
  UserCheck,
  Phone,
  Home,
  CheckCircle2,
  Download,
  Printer,
  Calendar,
  Award,
  Users,
  Building,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { VhvMember, Household, Person, HealthScreening, Village } from '../types';
import { calculateAge } from '../utils/thaiId';

interface VhvDirectoryProps {
  vhvMembers: VhvMember[];
  households: Household[];
  persons: Person[];
  screenings: HealthScreening[];
  villages: Village[];
  selectedVillageNo: number;
}

export const VhvDirectory: React.FC<VhvDirectoryProps> = ({
  vhvMembers,
  households,
  persons,
  screenings,
  villages,
  selectedVillageNo,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'directory'>('report');
  const [reportMonth, setReportMonth] = useState('2026-10');

  // Filtered lists
  const displayVhvs = vhvMembers.filter(
    (v) => selectedVillageNo === 0 || v.villageNo === selectedVillageNo
  );

  const displayHouses = households.filter(
    (h) => selectedVillageNo === 0 || h.villageNo === selectedVillageNo
  );

  const displayPersons = persons.filter(
    (p) => selectedVillageNo === 0 || p.villageNo === selectedVillageNo
  );

  const displayScreenings = screenings.filter((s) => {
    if (selectedVillageNo !== 0 && s.villageNo !== selectedVillageNo) return false;
    return s.date.startsWith(reportMonth);
  });

  // Monthly stats calculations
  const totalHouses = displayHouses.length;
  const larvaHouses = displayHouses.filter((h) => h.mosquitoLarvaFound).length;
  const hiPercent = totalHouses > 0 ? ((larvaHouses / totalHouses) * 100).toFixed(1) : '0';

  const elderlyCount = displayPersons.filter((p) => calculateAge(p.birthDate) >= 60).length;
  const bedriddenCount = displayPersons.filter((p) => p.careCategory === 'bedridden').length;
  const homeboundCount = displayPersons.filter((p) => p.careCategory === 'homebound').length;

  const totalScreened = displayScreenings.length;
  const doctorReferrals = displayScreenings.filter((s) => s.needDoctorReferral).length;

  // Export to Excel function
  const handleExportReportExcel = () => {
    const rows = [
      ['รายงานผลการปฏิบัติงาน อสม. ประจำเดือน (แบบ อสม. 1 / Smart OSM)'],
      ['ประจำเดือน', reportMonth, 'พื้นที่', selectedVillageNo === 0 ? 'ทุกหมู่บ้าน' : `หมู่ ${selectedVillageNo}`],
      ['วันที่พิมพ์รายงาน', new Date().toLocaleDateString('th-TH')],
      [''],
      ['หมวดที่ 1: ข้อมูลประชากรและครัวเรือน'],
      ['จำนวนหลังคาเรือนทั้งหมดในเขตรับผิดชอบ (หลัง)', totalHouses],
      ['จำนวนประชากรทั้งหมด (คน)', displayPersons.length],
      ['จำนวนผู้สูงอายุ 60 ปีขึ้นไป (คน)', elderlyCount],
      ['จำนวนผู้ป่วยติดบ้าน (คน)', homeboundCount],
      ['จำนวนผู้ป่วยติดเตียง (คน)', bedriddenCount],
      [''],
      ['หมวดที่ 2: งานป้องกันและควบคุมโรค (ลูกน้ำยุงลาย)'],
      ['จำนวนครัวเรือนที่สำรวจลูกน้ำยุงลาย (หลัง)', totalHouses],
      ['จำนวนครัวเรือนที่ตรวจพบลูกน้ำยุงลาย (หลัง)', larvaHouses],
      ['ดัชนีลูกน้ำยุงลายในชุมชน House Index (HI %)', `${hiPercent}%`],
      [''],
      ['หมวดที่ 3: งานคัดกรองสุขภาพ NCDs และเยี่ยมบ้าน'],
      ['จำนวนการคัดกรองความดันโลหิตและเบาหวาน (ครั้ง)', totalScreened],
      ['จำนวนเคสที่มีภาวะผิดปกติและส่งต่อ รพ.สต. (ราย)', doctorReferrals],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายงาน_อสม_ประจำเดือน');
    XLSX.writeFile(wb, `รายงานผลงาน_อสม_${reportMonth}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>รายงานผลการปฏิบัติงาน อสม. & ทำเนียบ อสม.</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ระบบสรุปรายงาน อสม. 1 ประจำเดือน และรายชื่ออาสาสมัครสาธารณสุขประจำหมู่บ้าน
          </p>
        </div>

        {/* Tab toggles */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'report' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>รายงาน อสม. 1</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'directory' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>ทำเนียบ อสม. ({displayVhvs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'report' ? (
        /* Monthly Report View */
        <div className="space-y-6">
          {/* Controls: Month selector & Export button */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">ประจำเดือน / ปี (ค.ศ.):</span>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportReportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออกรายงาน (Excel .xlsx)</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none">
            {/* Report Document Title */}
            <div className="text-center border-b border-slate-200 pb-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                แบบรายงานผลการปฏิบัติงานของ อสม. (แบบ อสม. 1 / Smart OSM)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                ระบบข้อมูลสุขภาพระดับปฐมภูมิ ตำบลสุขภาพดี อำเภอเมือง จังหวัดเชียงใหม่
              </p>
              <div className="inline-flex items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                <span>ประจำเดือน: {reportMonth}</span>
                <span>•</span>
                <span>
                  พื้นที่: {selectedVillageNo === 0 ? 'ทุกหมู่บ้าน' : `หมู่ที่ ${selectedVillageNo}`}
                </span>
                <span>•</span>
                <span>วันที่ออกรายงาน: {new Date().toLocaleDateString('th-TH')}</span>
              </div>
            </div>

            {/* Section 1: Household & Population Summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                ส่วนที่ 1: ข้อมูลประชากรและครัวเรือนในเขตรับผิดชอบ
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">หลังคาเรือนทั้งหมด</span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">{totalHouses} หลัง</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">ประชากรทั้งหมด</span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">{displayPersons.length} คน</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">ผู้สูงอายุ (60 ปี+)</span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">{elderlyCount} คน</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">ผู้ป่วยติดบ้าน / ติดเตียง</span>
                  <span className="text-xl font-bold text-rose-700 mt-1 block">
                    {homeboundCount + bedriddenCount} คน (ติดเตียง {bedriddenCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Larva Survey & Dengue Prevention */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                ส่วนที่ 2: การสำรวจและทำลายแหล่งเพาะพันธุ์ลูกน้ำยุงลาย (ดัชนี HI)
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">จำนวนหลังคาเรือนที่สำรวจ</span>
                  <span className="text-lg font-bold text-slate-800 mt-0.5 block">{totalHouses} หลัง</span>
                </div>
                <div>
                  <span className="text-slate-500 block">หลังคาเรือนที่พบลูกน้ำยุงลาย</span>
                  <span className={`text-lg font-bold mt-0.5 block ${larvaHouses > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {larvaHouses} หลัง
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ค่า House Index (HI)</span>
                  <span className={`text-lg font-bold mt-0.5 block ${parseFloat(hiPercent) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {hiPercent}% {parseFloat(hiPercent) <= 5 ? '(เกณฑ์ปลอดภัย)' : '(เกินเกณฑ์เฝ้าระวัง)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Health Screening & Home Visits */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                ส่วนที่ 3: ผลการคัดกรองสุขภาพ NCDs และการเยี่ยมบ้าน
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">การตรวจคัดกรองในรอบเดือน</span>
                  <span className="text-lg font-bold text-emerald-700 mt-0.5 block">{totalScreened} ครั้ง</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ผู้ป่วยที่ส่งต่อ รพ.สต.</span>
                  <span className="text-lg font-bold text-amber-700 mt-0.5 block">{doctorReferrals} ราย</span>
                </div>
                <div>
                  <span className="text-slate-500 block">อสม. ที่ร่วมปฏิบัติงาน</span>
                  <span className="text-lg font-bold text-slate-800 mt-0.5 block">{displayVhvs.length} คน</span>
                </div>
              </div>
            </div>

            {/* Section 4: Sign-off block */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-8">
                <p className="text-slate-600">ลงชื่อ .................................................... ผู้รายงาน</p>
                <p className="text-slate-500">( ประธาน อสม. ประจำหมู่บ้าน )</p>
              </div>
              <div className="space-y-8">
                <p className="text-slate-600">ลงชื่อ .................................................... ผู้รับรอง</p>
                <p className="text-slate-500">( เจ้าหน้าที่สาธารณสุข รพ.สต. )</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VHV Directory View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayVhvs.map((vhv) => {
            const assignedHouses = households.filter((h) => h.vhvMemberId === vhv.id);
            const totalCared = persons.filter((p) =>
              assignedHouses.some((h) => h.id === p.householdId)
            ).length;

            return (
              <div
                key={vhv.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                      {vhv.name.replace(/(นาย|นาง|นางสาว)/, '').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{vhv.name}</h3>
                      <p className="text-xs text-slate-500">หมู่ {vhv.villageNo} {vhv.zoneName}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ปฏิบัติการ
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>โทร: {vhv.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <span>รับผิดชอบ {assignedHouses.length} หลังคาเรือน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>ดูแลประชากร {totalCared} คน</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  ขึ้นทะเบียนเมื่อ: {vhv.registeredDate}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
