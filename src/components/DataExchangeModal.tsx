import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { storage } from '../services/storage';
import { Household, Person } from '../types';

interface DataExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export const DataExchangeModal: React.FC<DataExchangeModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
}) => {
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  // 1. Export Excel
  const handleExportExcel = () => {
    const households = storage.getHouseholds();
    const persons = storage.getPersons();
    const screenings = storage.getScreenings();
    const vhvMembers = storage.getVhvMembers();

    const wb = XLSX.utils.book_new();

    // Households sheet
    const houseRows = households.map((h) => ({
      บ้านเลขที่: h.houseNo,
      หมู่ที่: h.villageNo,
      ชื่อหมู่บ้าน: h.villageName,
      ตำบล: h.subdistrict,
      อำเภอ: h.district,
      จังหวัด: h.province,
      ชื่อเจ้าบ้าน: h.headOfHouseholdName,
      ละติจูด: h.latitude,
      ลองจิจูด: h.longitude,
      สุขาภิบาล: h.sanitationRating,
      พบลูกน้ำยุงลาย: h.mosquitoLarvaFound ? 'พบ' : 'ไม่พบ',
      แหล่งน้ำ: h.waterSource,
      การจัดการขยะ: h.wasteManagement,
    }));
    const wsHouses = XLSX.utils.json_to_sheet(houseRows);
    XLSX.utils.book_append_sheet(wb, wsHouses, 'หลังคาเรือน');

    // Persons sheet
    const personRows = persons.map((p) => {
      const house = households.find((h) => h.id === p.householdId);
      return {
        เลขประจำตัวประชาชน: p.citizenId,
        คำนำหน้า: p.title,
        ชื่อ: p.firstName,
        นามสกุล: p.lastName,
        เพศ: p.gender === 'male' ? 'ชาย' : 'หญิง',
        วันเกิด: p.birthDate,
        หมู่เลือด: p.bloodGroup,
        บ้านเลขที่: house?.houseNo || '',
        หมู่ที่: p.villageNo,
        เบอร์โทร: p.phone || '',
        อาชีพ: p.occupation || '',
        ภาวะพึ่งพิง: p.careCategory,
        สถานะการอยู่อาศัย: p.residentStatus,
        โรคประจำตัว: p.chronicDiseases.join(', '),
        น้ำหนัก_กก: p.weightKg || '',
        ส่วนสูง_ซม: p.heightCm || '',
        BMI: p.bmi || '',
        ความดัน_บน: p.systolic || '',
        ความดัน_ล่าง: p.diastolic || '',
        น้ำตาล_DTX: p.bloodSugarDtx || '',
      };
    });
    const wsPersons = XLSX.utils.json_to_sheet(personRows);
    XLSX.utils.book_append_sheet(wb, wsPersons, 'ทะเบียนประชากร');

    // Screenings sheet
    const screeningRows = screenings.map((s) => {
      const person = persons.find((p) => p.id === s.personId);
      return {
        วันที่ตรวจ: s.date,
        ชื่อผู้รับการตรวจ: person ? `${person.title}${person.firstName} ${person.lastName}` : '',
        หมู่ที่: s.villageNo,
        ความดัน_บน: s.systolic,
        ความดัน_ล่าง: s.diastolic,
        น้ำตาล_DTX: s.bloodSugarDtx || '',
        BMI: s.bmi,
        ส่งต่อ_รพสต: s.needDoctorReferral ? 'ส่งต่อ' : 'ไม่ส่งต่อ',
        คำแนะนำ_อสม: s.advice || '',
      };
    });
    const wsScreenings = XLSX.utils.json_to_sheet(screeningRows);
    XLSX.utils.book_append_sheet(wb, wsScreenings, 'ผลการคัดกรองสุขภาพ');

    XLSX.writeFile(
      wb,
      `ข้อมูล_Smart_OSM_Next_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // 2. Export JSON backup
  const handleExportJson = () => {
    const data = storage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smart_OSM_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const samplePersons = [
      {
        เลขประจำตัวประชาชน: '3501200998877',
        คำนำหน้า: 'นาย',
        ชื่อ: 'สมชาย',
        นามสกุล: 'รักสงบ',
        เพศ: 'ชาย',
        วันเกิด: '1975-05-12',
        หมู่เลือด: 'O',
        บ้านเลขที่: '10/1',
        หมู่ที่: 1,
        เบอร์โทร: '081-000-0000',
        อาชีพ: 'เกษตรกร',
        ภาวะพึ่งพิง: 'active',
        โรคประจำตัว: 'ความดันโลหิตสูง',
      },
      {
        เลขประจำตัวประชาชน: '3501200112233',
        คำนำหน้า: 'นาง',
        ชื่อ: 'สมพร',
        นามสกุล: 'รักสงบ',
        เพศ: 'หญิง',
        วันเกิด: '1948-10-20',
        หมู่เลือด: 'B',
        บ้านเลขที่: '10/1',
        หมู่ที่: 1,
        เบอร์โทร: '089-111-2222',
        อาชีพ: 'แม่บ้าน',
        ภาวะพึ่งพิง: 'homebound',
        โรคประจำตัว: 'เบาหวานชนิดที่ 2',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(samplePersons);
    XLSX.utils.book_append_sheet(wb, ws, 'แบบฟอร์มนำเข้าประชากร');
    XLSX.writeFile(wb, 'Smart_OSM_Template_ตัวอย่างนำเข้า.xlsx');
  };

  // 4. Import from file (JSON or Excel)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          storage.importAllData(content);
          setImportStatus({
            success: true,
            message: 'นำเข้าไฟล์ข้อมูลสำรอง JSON สำเร็จครบถ้วน',
          });
          onDataReload();
        } catch (err: any) {
          setImportStatus({
            success: false,
            message: `เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ${err.message}`,
          });
        }
      };
      reader.readAsText(file);
    } else {
      // Excel file
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

          let importedCount = 0;
          const currentHouses = storage.getHouseholds();

          rows.forEach((row, i) => {
            const citizenId = String(row['เลขประจำตัวประชาชน'] || '').replace(/\D/g, '');
            const firstName = row['ชื่อ'] || row['firstname'];
            const lastName = row['นามสกุล'] || row['lastname'];

            if (firstName && lastName) {
              const houseNo = String(row['บ้านเลขที่'] || '1');
              const villageNo = Number(row['หมู่ที่'] || 1);

              let house = currentHouses.find((h) => h.houseNo === houseNo && h.villageNo === villageNo);
              if (!house) {
                house = {
                  id: `house-imp-${Date.now()}-${i}`,
                  houseNo,
                  villageNo,
                  villageName: `หมู่ที่ ${villageNo}`,
                  subdistrict: 'ตำบลสุขภาพดี',
                  district: 'อำเภอเมือง',
                  province: 'เชียงใหม่',
                  latitude: 18.7883 + (Math.random() - 0.5) * 0.005,
                  longitude: 98.9853 + (Math.random() - 0.5) * 0.005,
                  headOfHouseholdName: `${firstName} ${lastName}`,
                  vhvMemberId: 'vhv-1',
                  sanitationRating: 'good',
                  mosquitoLarvaFound: false,
                  waterSource: 'ประปาหมู่บ้าน',
                  wasteManagement: 'คัดแยกขยะ',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                storage.saveHousehold(house);
                currentHouses.push(house);
              }

              const newPerson: Person = {
                id: `person-imp-${Date.now()}-${i}`,
                householdId: house.id,
                villageNo,
                citizenId: citizenId || `3501200${Math.floor(100000 + Math.random() * 900000)}`,
                title: row['คำนำหน้า'] || 'นาย',
                firstName,
                lastName,
                gender: row['เพศ'] === 'หญิง' ? 'female' : 'male',
                birthDate: row['วันเกิด'] || '1980-01-01',
                bloodGroup: (row['หมู่เลือด'] as any) || 'O',
                phone: row['เบอร์โทร'] ? String(row['เบอร์โทร']) : undefined,
                occupation: row['อาชีพ'] || undefined,
                residentStatus: 'resident',
                careCategory: (row['ภาวะพึ่งพิง'] as any) || 'active',
                chronicDiseases: row['โรคประจำตัว']
                  ? String(row['โรคประจำตัว']).split(',').map((s) => s.trim())
                  : [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              storage.savePerson(newPerson);
              importedCount++;
            }
          });

          setImportStatus({
            success: true,
            message: `นำเข้าข้อมูลประชากรจาก Excel สำเร็จแล้ว ${importedCount} ราย`,
          });
          onDataReload();
        } catch (err: any) {
          setImportStatus({
            success: false,
            message: `เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ${err.message}`,
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">นำเข้าและส่งออกข้อมูล (Excel / CSV / JSON)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {importStatus && (
            <div
              className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 ${
                importStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Section 1: Export */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ส่งออกข้อมูลระบบ (Export)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ดาวน์โหลดข้อมูลทั้งระบบเพื่อนำไปเปิดในโปรแกรม Microsoft Excel, Google Sheets หรือเก็บสำรอง
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold text-xs sm:text-sm border border-emerald-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ส่งออกไฟล์ Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-semibold text-xs sm:text-sm border border-slate-200 transition-colors"
              >
                <FileJson className="w-4 h-4 text-slate-600" />
                <span>สำรองข้อมูลระบบ (.json)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Import */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>นำเข้าข้อมูล (Import)</span>
            </h3>
            <p className="text-xs text-slate-500">
              อัปโหลดไฟล์ Excel (.xlsx, .xls, .csv) หรือไฟล์สำรอง JSON เพื่อเพิ่มข้อมูลประชากรเข้าสู่ระบบ
            </p>

            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-6 text-center bg-slate-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx, .xls, .csv, .json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์ Excel หรือ JSON
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  รองรับ .xlsx, .xls, .csv และ .json
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">ต้องการไฟล์ตัวอย่างรูปแบบคอลัมน์?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด Excel Template ตัวอย่าง</span>
              </button>
            </div>
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
