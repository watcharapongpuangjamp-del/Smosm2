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
  const handleExportExcel = async () => {
    const [households, persons, screenings, vhvMembers] = await Promise.all([
      storage.getHouseholds(),
      storage.getPersons(),
      storage.getScreenings(),
      storage.getVhvMembers(),
    ]);

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
        วันเกิด: p.birthDatePrecision === 'year' ? p.birthDate.slice(0, 4) : p.birthDate,
        ความละเอียดวันเกิด: p.birthDatePrecision || 'full',
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
  const handleExportJson = async () => {
    const data = await storage.exportAllData();
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
      reader.onload = async (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          await storage.importAllData(content);
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
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const preferredSheet = ['แบบฟอร์มนำเข้าประชากร', 'ทะเบียนประชากร'].find((name) => workbook.Sheets[name]);
          const firstSheetName = preferredSheet || workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const [currentHouses, currentPersons, villages, vhvMembers] = await Promise.all([
            storage.getHouseholds(),
            storage.getPersons(),
            storage.getVillages(),
            storage.getVhvMembers(),
          ]);

          const newHouseholds: Household[] = [];
          const newPersons: Person[] = [];
          const knownHouses = [...currentHouses];
          const knownCitizenIds = new Set(
            currentPersons.map((person) => String(person.citizenId || '').trim()).filter(Boolean)
          );
          let duplicateCount = 0;
          let invalidCount = 0;
          let checksumWarningCount = 0;
          const now = new Date().toISOString();

          const parseDate = (value: unknown): { date: string; precision?: Person['birthDatePrecision'] } | null => {
            if (value instanceof Date && !Number.isNaN(value.getTime())) {
              const year = value.getFullYear() > 2400 ? value.getFullYear() - 543 : value.getFullYear();
              return { date: `${String(year).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` };
            }
            if (typeof value === 'number') {
              const parsed = XLSX.SSF.parse_date_code(value);
              if (!parsed) return null;
              const year = parsed.y > 2400 ? parsed.y - 543 : parsed.y;
              return {
                date: `${String(year).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`,
              };
            }
            const text = String(value ?? '').trim();
            if (/^\\d{4}$/.test(text)) {
              const rawYear = Number(text);
              const year = rawYear > 2400 ? rawYear - 543 : rawYear;
              return { date: `${String(year).padStart(4, '0')}-01-01`, precision: 'year' };
            }
            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) {
              const [rawYear, month, day] = text.split('-').map(Number);
              const year = rawYear > 2400 ? rawYear - 543 : rawYear;
              const parsed = new Date(Date.UTC(year, month - 1, day));
              if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) {
                return { date: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
              }
              return null;
            }
            const dmy = text.match(/^(\\d{1,2})[\\/.-](\\d{1,2})[\\/.-](\\d{4})$/);
            if (dmy) {
              const rawYear = Number(dmy[3]);
              const year = rawYear > 2400 ? rawYear - 543 : rawYear;
              const month = Number(dmy[2]);
              const day = Number(dmy[1]);
              const date = new Date(Date.UTC(year, month - 1, day));
              if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
                return { date: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
              }
            }
            return null;
          };

          const toOptionalNumber = (value: unknown): number | undefined => {
            if (value === undefined || value === null || value === '') return undefined;
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
          };

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const firstName = String(row['ชื่อ'] ?? row['firstname'] ?? '').trim();
            const lastName = String(row['นามสกุล'] ?? row['lastname'] ?? '').trim();
            const houseNo = String(row['บ้านเลขที่'] ?? '').trim();
            const villageNo = Number(row['หมู่ที่']);
            const rawCitizenId = String(row['เลขประจำตัวประชาชน'] ?? '').trim();
            const citizenId = rawCitizenId.replace(/\\D/g, '');
            const birth = parseDate(row['วันเกิด']);
            const rawGender = String(row['เพศ'] ?? '').trim().toLowerCase();
            const gender = rawGender === 'หญิง' || rawGender === 'female'
              ? 'female'
              : rawGender === 'ชาย' || rawGender === 'male'
                ? 'male'
                : null;

            if (!firstName || !lastName || !houseNo || !Number.isInteger(villageNo) || villageNo <= 0 || !birth || !gender) {
              invalidCount++;
              continue;
            }

            // Never manufacture an identity number. A supplied value must contain exactly 13 digits.
            if (rawCitizenId && !/^\\d{13}$/.test(citizenId)) {
              invalidCount++;
              continue;
            }
            if (citizenId && knownCitizenIds.has(citizenId)) {
              duplicateCount++;
              continue;
            }
            if (citizenId) {
              let checksumSum = 0;
              for (let digit = 0; digit < 12; digit++) checksumSum += Number(citizenId[digit]) * (13 - digit);
              if ((11 - (checksumSum % 11)) % 10 !== Number(citizenId[12])) checksumWarningCount++;
            }

            let house = knownHouses.find((item) => item.houseNo === houseNo && item.villageNo === villageNo);
            if (!house) {
              const village = villages.find((item) => item.no === villageNo);
              const assignedVhv = vhvMembers.find((member) => member.villageNo === villageNo && member.isActive);
              const latitude = toOptionalNumber(row['ละติจูด']);
              const longitude = toOptionalNumber(row['ลองจิจูด']);
              const hasCoordinates = latitude !== undefined && longitude !== undefined
                && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
                && !(latitude === 0 && longitude === 0);

              house = {
                id: `house-imp-${crypto.randomUUID()}`,
                houseNo,
                villageNo,
                villageName: String(row['ชื่อหมู่บ้าน'] ?? village?.name ?? ''),
                subdistrict: String(row['ตำบล'] ?? village?.subdistrict ?? ''),
                district: String(row['อำเภอ'] ?? village?.district ?? ''),
                province: String(row['จังหวัด'] ?? village?.province ?? ''),
                latitude: hasCoordinates ? latitude! : 0,
                longitude: hasCoordinates ? longitude! : 0,
                headOfHouseholdName: `${firstName} ${lastName}`,
                vhvMemberId: assignedVhv?.id ?? '',
                sanitationRating: (() => {
                  const value = String(row['สุขาภิบาล'] ?? '').trim().toLowerCase();
                  if (['good', 'ดี'].includes(value)) return 'good';
                  if (['fair', 'พอใช้'].includes(value)) return 'fair';
                  if (['poor', 'ไม่ดี', 'แย่'].includes(value)) return 'poor';
                  return 'unknown';
                })() as Household['sanitationRating'],
                mosquitoLarvaFound: ['พบ', 'true', '1', 'yes'].includes(String(row['พบลูกน้ำยุงลาย'] ?? '').trim().toLowerCase()),
                waterSource: String(row['แหล่งน้ำ'] ?? 'ยังไม่ระบุ'),
                wasteManagement: String(row['การจัดการขยะ'] ?? 'ยังไม่ระบุ'),
                notes: [
                  'นำเข้าจากไฟล์ Excel',
                  hasCoordinates ? '' : 'ยังไม่ได้ระบุพิกัดบ้าน',
                  row['สุขาภิบาล'] ? '' : 'ยังไม่ได้ประเมินสุขาภิบาล',
                  row['พบลูกน้ำยุงลาย'] !== undefined ? '' : 'ยังไม่ได้สำรวจลูกน้ำยุงลาย',
                ].filter(Boolean).join('; '),
                createdAt: now,
                updatedAt: now,
              };
              newHouseholds.push(house);
              knownHouses.push(house);
            }

            const careValue = String(row['ภาวะพึ่งพิง'] ?? 'active').trim();
            const careCategory = ['active', 'homebound', 'bedridden'].includes(careValue)
              ? careValue as Person['careCategory']
              : 'active';

            const person: Person = {
              id: `person-imp-${crypto.randomUUID()}`,
              householdId: house.id,
              villageNo,
              citizenId,
              title: String(row['คำนำหน้า'] ?? ''),
              firstName,
              lastName,
              gender,
              birthDate: birth.date,
              birthDatePrecision: birth.precision,
              bloodGroup: (() => {
                const value = String(row['หมู่เลือด'] ?? '').trim().toUpperCase();
                return (['A', 'B', 'AB', 'O', 'RH-'].includes(value) ? value : 'Unknown') as Person['bloodGroup'];
              })(),
              phone: row['เบอร์โทร'] ? String(row['เบอร์โทร']) : undefined,
              occupation: row['อาชีพ'] ? String(row['อาชีพ']) : undefined,
              residentStatus: (() => {
                const value = String(row['สถานะการอยู่อาศัย'] ?? 'resident').trim();
                return (['resident', 'moved_out', 'deceased', 'temporary'].includes(value) ? value : 'resident') as Person['residentStatus'];
              })(),
              careCategory,
              chronicDiseases: row['โรคประจำตัว']
                ? String(row['โรคประจำตัว']).split(',').map((item) => item.trim()).filter(Boolean)
                : [],
              weightKg: toOptionalNumber(row['น้ำหนัก_กก']),
              heightCm: toOptionalNumber(row['ส่วนสูง_ซม']),
              bmi: toOptionalNumber(row['BMI']),
              systolic: toOptionalNumber(row['ความดัน_บน']),
              diastolic: toOptionalNumber(row['ความดัน_ล่าง']),
              bloodSugarDtx: toOptionalNumber(row['น้ำตาล_DTX']),
              createdAt: now,
              updatedAt: now,
            };

            newPersons.push(person);
            if (citizenId) knownCitizenIds.add(citizenId);
          }

          if (newPersons.length === 0) {
            throw new Error('ไม่พบแถวข้อมูลที่ถูกต้องสำหรับนำเข้า กรุณาตรวจสอบชื่อ-สกุล บ้านเลขที่ หมู่ที่ เพศ และวันเกิด');
          }

          await storage.importExcelBatch(newHouseholds, newPersons);
          setImportStatus({
            success: true,
            message: `นำเข้าสำเร็จ ${newPersons.length} ราย เพิ่มหลังคาเรือน ${newHouseholds.length} หลัง; ข้ามข้อมูลซ้ำ ${duplicateCount} ราย; ข้อมูลไม่ครบ/รูปแบบไม่ถูกต้อง ${invalidCount} ราย; เลขบัตรที่ควรตรวจ checksum อีกครั้ง ${checksumWarningCount} ราย`,
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
      <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-2xl my-8 overflow-hidden flex flex-col">
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
