import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Heart,
  Droplet,
  Check,
  AlertTriangle,
  ClipboardList,
  Calendar,
  User,
  History,
} from 'lucide-react';
import { Person, HealthScreening, Household, VhvMember } from '../types';
import { calculateAge, formatThaiDate } from '../utils/thaiId';
import {
  calculateBmi,
  evaluateBloodPressure,
  evaluateBloodSugar,
  CARE_CATEGORY_CONFIG,
} from '../utils/health';
import { storage } from '../services/storage';

interface HealthScreeningModalProps {
  isOpen: boolean;
  person: Person | null;
  household?: Household | null;
  vhvMembers: VhvMember[];
  onClose: () => void;
  onSave: (screening: HealthScreening) => void;
}

export const HealthScreeningModal: React.FC<HealthScreeningModalProps> = ({
  isOpen,
  person,
  household,
  vhvMembers,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vhvMemberId, setVhvMemberId] = useState('');
  const [weightKg, setWeightKg] = useState<number>(60);
  const [heightCm, setHeightCm] = useState<number>(160);
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(76);
  const [bloodSugarDtx, setBloodSugarDtx] = useState<number | undefined>(undefined);
  const [waistCm, setWaistCm] = useState<number | undefined>(undefined);
  const [smoker, setSmoker] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [needDoctorReferral, setNeedDoctorReferral] = useState(false);
  const [pastScreenings, setPastScreenings] = useState<HealthScreening[]>([]);

  useEffect(() => {
    if (person && isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setWeightKg(person.weightKg || 60);
      setHeightCm(person.heightCm || 160);
      setSystolic(person.systolic || 120);
      setDiastolic(person.diastolic || 80);
      setPulse(75);
      setBloodSugarDtx(person.bloodSugarDtx);
      setWaistCm(undefined);
      setSmoker(false);
      setAlcohol(false);
      setNotes('');
      setAdvice('');
      setNeedDoctorReferral(false);

      // Default VHV
      setVhvMemberId(household?.vhvMemberId || vhvMembers[0]?.id || '');

      // Load past screenings
      const history = storage.getScreeningsByPerson(person.id);
      setPastScreenings(history);
    }
  }, [person, household, vhvMembers, isOpen]);

  if (!isOpen || !person) return null;

  const age = calculateAge(person.birthDate);
  const careConfig = CARE_CATEGORY_CONFIG[person.careCategory];
  const bmiResult = calculateBmi(weightKg, heightCm);
  const bpResult = evaluateBloodPressure(systolic, diastolic);
  const sugarResult = evaluateBloodSugar(bloodSugarDtx);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: HealthScreening = {
      id: `scr-${Date.now()}`,
      personId: person.id,
      householdId: person.householdId,
      villageNo: person.villageNo,
      date,
      vhvMemberId: vhvMemberId || 'vhv-1',
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      bmi: bmiResult?.bmi || 22,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: pulse ? Number(pulse) : undefined,
      bloodSugarDtx: bloodSugarDtx ? Number(bloodSugarDtx) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      smoker,
      alcohol,
      notes: notes.trim(),
      advice: advice.trim(),
      needDoctorReferral,
      createdAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="text-lg font-bold">บันทึกคัดกรองสุขภาพ / ตรวจเยี่ยมบ้าน</h2>
              <p className="text-xs text-emerald-100">
                ประเมินสัญญาณชีพ ความดันโลหิต น้ำตาลในเลือด และคำแนะนำ อสม.
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

        {/* Person Summary Banner */}
        <div className="bg-emerald-50/70 p-4 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800 text-sm">
              {person.title}
              {person.firstName} {person.lastName}
            </span>
            <span className="text-slate-500 ml-2">อายุ {age} ปี</span>
            <span className="text-slate-500 ml-2">
              (บ้านเลขที่ {household?.houseNo || '-'} หมู่ {person.villageNo})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${careConfig.badgeClass}`}>
              {careConfig.shortLabel}
            </span>
            {person.chronicDiseases.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                {person.chronicDiseases.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Date & VHV Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ตรวจคัดกรอง <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อสม. ผู้ทำการตรวจคัดกรอง
              </label>
              <select
                value={vhvMemberId}
                onChange={(e) => setVhvMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                {vhvMembers.map((vhv) => (
                  <option key={vhv.id} value={vhv.id}>
                    {vhv.name} ({vhv.zoneName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Blood Pressure Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                การวัดความดันโลหิต (Blood Pressure)
              </span>
              {bpResult && (
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${bpResult.badgeClass}`}>
                  {bpResult.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">
                  ความดันตัวบน (Systolic)
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  max={300}
                  value={systolic}
                  onChange={(e) => setSystolic(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">
                  ความดันตัวล่าง (Diastolic)
                </label>
                <input
                  type="number"
                  required
                  min={30}
                  max={200}
                  value={diastolic}
                  onChange={(e) => setDiastolic(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">
                  ชีพจร (ครั้ง/นาที)
                </label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  value={pulse}
                  onChange={(e) => setPulse(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {bpResult?.status === 'stage2' || bpResult?.status === 'crisis' ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>ความดันโลหิตสูงเกินเกณฑ์มาตรฐาน แนะนำพัก 15 นาทีแล้ววัดซ้ำ หากยังสูงควรส่งต่อ รพ.สต.</span>
              </div>
            ) : null}
          </div>

          {/* Blood Sugar (DTX) & Physical Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Blood Sugar DTX */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-purple-600" />
                  ระดับน้ำตาลปลายนิ้ว (DTX)
                </span>
                {sugarResult && (
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${sugarResult.badgeClass}`}>
                    {sugarResult.label}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">ค่าน้ำตาล (mg/dL)</label>
                <input
                  type="number"
                  placeholder="เช่น 110 (ปล่อยว่างถ้าไม่ได้เจาะ)"
                  value={bloodSugarDtx ?? ''}
                  onChange={(e) => setBloodSugarDtx(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Weight, Height, BMI */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">ดัชนีมวลกาย (BMI)</span>
                {bmiResult && (
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${bmiResult.bgClass} ${bmiResult.colorClass}`}>
                    BMI {bmiResult.bmi} ({bmiResult.label})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">น้ำหนัก (กก.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">ส่วนสูง (ซม.)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">รอบเอว (ซม.)</label>
                  <input
                    type="number"
                    placeholder="รอบเอว"
                    value={waistCm ?? ''}
                    onChange={(e) => setWaistCm(parseFloat(e.target.value) || undefined)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lifestyle habits: Smoker / Alcohol */}
          <div className="flex items-center gap-6 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={smoker}
                onChange={(e) => setSmoker(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span className="text-xs text-slate-700">สูบบุหรี่เป็นประจำ</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alcohol}
                onChange={(e) => setAlcohol(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span className="text-xs text-slate-700">ดื่มเครื่องดื่มแอลกอฮอล์</span>
            </label>
          </div>

          {/* Notes & Advice */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บันทึกการตรวจเยี่ยมบ้าน / อาการที่พบ
              </label>
              <textarea
                rows={2}
                placeholder="เช่น ผู้ป่วยรับประทานยาตรงเวลา แผลกดทับที่หลังมีอาการดีขึ้น หรือมีอาการเวียนศีรษะ"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำแนะนำที่ อสม. ให้แก่ผู้ป่วยหรือญาติ
              </label>
              <textarea
                rows={2}
                placeholder="เช่น แนะนำลดอาหารรสเค็ม ดื่มน้ำสะอาด ออกกำลังกายแกว่งแขน และพลิกตัวผู้ป่วยติดเตียงทุก 2 ชั่วโมง"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Referral Checkbox */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={needDoctorReferral}
                onChange={(e) => setNeedDoctorReferral(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  ต้องส่งต่อเจ้าหน้าที่สาธารณสุข / แพทย์ รพ.สต.
                </span>
                <span className="text-[11px] text-amber-700">
                  (กรณีความดันสูงมาก, แผลลุกลาม, มีอาการผิดปกติเฉียบพลัน, หรือยาหมด)
                </span>
              </div>
            </label>
          </div>

          {/* Previous Screenings History */}
          {pastScreenings.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>ประวัติการคัดกรองครั้งก่อนหน้า ({pastScreenings.length} ครั้ง)</span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg text-xs">
                {pastScreenings.slice(0, 5).map((s) => (
                  <div key={s.id} className="p-2.5 flex items-center justify-between bg-white">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {formatThaiDate(s.date)}:
                      </span>
                      <span className="ml-2 font-mono text-emerald-700 font-medium">
                        BP: {s.systolic}/{s.diastolic} mmHg
                      </span>
                      {s.bloodSugarDtx && (
                        <span className="ml-2 text-purple-700">DTX: {s.bloodSugarDtx}</span>
                      )}
                      {s.notes && <span className="ml-2 text-slate-500">({s.notes})</span>}
                    </div>
                    {s.needDoctorReferral && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                        ส่งต่อ รพ.สต.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกผลการคัดกรอง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
