import React, { useState, useEffect } from 'react';
import { X, User, Check, AlertCircle, Heart, Activity } from 'lucide-react';
import { Person, Household, Village, CareCategory, ResidentStatus, Gender } from '../types';
import { validateThaiCitizenId, calculateAge } from '../utils/thaiId';
import { calculateBmi, evaluateBloodPressure } from '../utils/health';

interface PersonModalProps {
  isOpen: boolean;
  personToEdit?: Person | null;
  defaultHouseholdId?: string;
  households: Household[];
  villages: Village[];
  onClose: () => void;
  onSave: (person: Person) => void;
}

const COMMON_CHRONIC_DISEASES = [
  'ความดันโลหิตสูง',
  'เบาหวานชนิดที่ 2',
  'โรคไตเรื้อรัง (CKD)',
  'โรคหลอดเลือดสมอง (Stroke)',
  'โรคหลอดเลือดหัวใจ',
  'ไขมันในเลือดสูง',
  'โรคเกาต์',
  'โรคหอบหืด / ปอดอุดกั้นเรื้อรัง (COPD)',
  'ข้อเข่าเสื่อม',
  'หญิงตั้งครรภ์',
];

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  personToEdit,
  defaultHouseholdId,
  households,
  villages,
  onClose,
  onSave,
}) => {
  const [citizenId, setCitizenId] = useState('');
  const [title, setTitle] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('1980-01-01');
  const [isBirthDateUnknown, setIsBirthDateUnknown] = useState(false);
  const [bloodGroup, setBloodGroup] = useState<Person['bloodGroup']>('O');
  const [householdId, setHouseholdId] = useState('');
  const [villageNo, setVillageNo] = useState<number>(1);
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [careCategory, setCareCategory] = useState<CareCategory>('active');
  const [residentStatus, setResidentStatus] = useState<ResidentStatus>('resident');
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [customDisease, setCustomDisease] = useState('');
  const [birthYear, setBirthYear] = useState(new Date().getFullYear().toString());

  // Initial vitals
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined);
  const [heightCm, setHeightCm] = useState<number | undefined>(undefined);
  const [systolic, setSystolic] = useState<number | undefined>(undefined);
  const [diastolic, setDiastolic] = useState<number | undefined>(undefined);
  const [bloodSugarDtx, setBloodSugarDtx] = useState<number | undefined>(undefined);

  const [idValidation, setIdValidation] = useState<{ isValid: boolean; message?: string }>({
    isValid: true,
  });

  useEffect(() => {
    if (personToEdit) {
      setCitizenId(personToEdit.citizenId);
      setTitle(personToEdit.title);
      setFirstName(personToEdit.firstName);
      setLastName(personToEdit.lastName);
      setGender(personToEdit.gender);
      setBirthDate(personToEdit.birthDate);
      setIsBirthDateUnknown(personToEdit.birthDatePrecision === 'year');
      setBirthYear(personToEdit.birthDate.substring(0, 4));
      setBloodGroup(personToEdit.bloodGroup);
      setHouseholdId(personToEdit.householdId);
      setVillageNo(personToEdit.villageNo);
      setPhone(personToEdit.phone || '');
      setOccupation(personToEdit.occupation || '');
      setCareCategory(personToEdit.careCategory);
      setResidentStatus(personToEdit.residentStatus);
      setSelectedDiseases(personToEdit.chronicDiseases || []);
      setWeightKg(personToEdit.weightKg);
      setHeightCm(personToEdit.heightCm);
      setSystolic(personToEdit.systolic);
      setDiastolic(personToEdit.diastolic);
      setBloodSugarDtx(personToEdit.bloodSugarDtx);
      setIdValidation(validateThaiCitizenId(personToEdit.citizenId));
    } else {
      setCitizenId('');
      setTitle('นาย');
      setFirstName('');
      setLastName('');
      setGender('male');
      setBirthDate('1985-06-15');
      setIsBirthDateUnknown(false);
      setBirthYear(new Date().getFullYear().toString());
      setBloodGroup('O');
      const targetHouse =
        households.find((h) => h.id === defaultHouseholdId) || households[0];
      setHouseholdId(targetHouse?.id || '');
      setVillageNo(targetHouse?.villageNo || 1);
      setPhone('');
      setOccupation('');
      setCareCategory('active');
      setResidentStatus('resident');
      setSelectedDiseases([]);
      setWeightKg(undefined);
      setHeightCm(undefined);
      setSystolic(undefined);
      setDiastolic(undefined);
      setBloodSugarDtx(undefined);
      setIdValidation({ isValid: true });
    }
  }, [personToEdit, defaultHouseholdId, households, isOpen]);

  if (!isOpen) return null;

  const handleCitizenIdChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 13);
    setCitizenId(clean);
    if (clean.length === 13) {
      setIdValidation(validateThaiCitizenId(clean));
    } else if (clean.length > 0) {
      setIdValidation({ isValid: false, message: `กรอกแล้ว ${clean.length}/13 หลัก` });
    } else {
      setIdValidation({ isValid: true });
    }
  };

  const handleHouseholdChange = (hId: string) => {
    setHouseholdId(hId);
    const house = households.find((h) => h.id === hId);
    if (house) {
      setVillageNo(house.villageNo);
    }
  };

  const toggleDisease = (disease: string) => {
    if (selectedDiseases.includes(disease)) {
      setSelectedDiseases(selectedDiseases.filter((d) => d !== disease));
    } else {
      setSelectedDiseases([...selectedDiseases, disease]);
    }
  };

  const handleAddCustomDisease = () => {
    if (customDisease.trim() && !selectedDiseases.includes(customDisease.trim())) {
      setSelectedDiseases([...selectedDiseases, customDisease.trim()]);
      setCustomDisease('');
    }
  };

  const calculatedAge = calculateAge(isBirthDateUnknown ? `${birthYear}-01-01` : birthDate);
  const bmiInfo = weightKg && heightCm ? calculateBmi(weightKg, heightCm) : null;
  const bpInfo = systolic && diastolic ? evaluateBloodPressure(systolic, diastolic) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    if (citizenId.length > 0 && citizenId.length !== 13) {
      alert('เลขประจำตัวประชาชนต้องครบ 13 หลัก');
      return;
    }

    const payload: Person = {
      id: personToEdit?.id || `person-${Date.now()}`,
      householdId,
      villageNo,
      citizenId: citizenId.trim() || `3501200${Math.floor(100000 + Math.random() * 900000)}`,
      title,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate: isBirthDateUnknown ? `${birthYear}-01-01` : birthDate,
      birthDatePrecision: isBirthDateUnknown ? 'year' : 'full',
      bloodGroup,
      phone: phone.trim() || undefined,
      occupation: occupation.trim() || undefined,
      residentStatus,
      careCategory,
      chronicDiseases: selectedDiseases,
      weightKg: weightKg ? Number(weightKg) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      bmi: bmiInfo?.bmi,
      systolic: systolic ? Number(systolic) : undefined,
      diastolic: diastolic ? Number(diastolic) : undefined,
      bloodSugarDtx: bloodSugarDtx ? Number(bloodSugarDtx) : undefined,
      createdAt: personToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">
              {personToEdit ? 'แก้ไขข้อมูลประชากร' : 'ลงทะเบียนประชากรใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Thai Citizen ID */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                เลขประจำตัวประชาชน (13 หลัก)
              </label>
              {citizenId.length === 13 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    idValidation.isValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {idValidation.isValid ? '✓ เลขบัตรถูกต้องตาม Checksum' : '✗ Checksum ไม่ถูกต้อง'}
                </span>
              )}
            </div>
            <input
              type="text"
              maxLength={13}
              placeholder="กรอกตัวเลข 13 หลัก เช่น 3501200847192"
              value={citizenId}
              onChange={(e) => handleCitizenIdChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            {idValidation.message && citizenId.length > 0 && citizenId.length < 13 && (
              <span className="text-[11px] text-amber-600 mt-1 block">
                {idValidation.message}
              </span>
            )}
          </div>

          {/* Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">คำนำหน้า</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
                <option value="พระภิกษุ">พระภิกษุ</option>
              </select>
            </div>

            <div className="sm:col-span-1.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ชื่อจริง"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div className="sm:col-span-1.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="นามสกุล"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เพศ</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </select>
            </div>
          </div>

          {/* Household & Village */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผูกกับบ้านเลขที่ <span className="text-rose-500">*</span>
              </label>
              <select
                value={householdId}
                onChange={(e) => handleHouseholdChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    บ้านเลขที่ {h.houseNo} (หมู่ {h.villageNo} - เจ้าบ้าน: {h.headOfHouseholdName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันเดือนปีเกิด (ค.ศ.)
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isBirthDateUnknown}
                    onChange={(e) => setIsBirthDateUnknown(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  ทราบเฉพาะปีเกิด (ไม่ทราบวัน/เดือน)
                </label>
                
                <div className="flex items-center gap-2">
                  {isBirthDateUnknown ? (
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    />
                  ) : (
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    />
                  )}
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap px-2.5 py-2 bg-slate-100 rounded-lg border border-slate-200">
                    อายุ {calculatedAge} ปี
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Blood group, Phone, Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">หมู่เลือด</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="Rh-">Rh- (หายาก)</option>
                <option value="Unknown">ไม่ระบุ/ไม่ทราบ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                placeholder="เช่น 081-234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">อาชีพ</label>
              <input
                type="text"
                placeholder="เช่น เกษตรกร, ค้าขาย"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Care category (3 ติด) & Resident Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                การจำแนกตามภาวะพึ่งพิง (3 ติด) <span className="text-rose-500">*</span>
              </label>
              <select
                value={careCategory}
                onChange={(e) => setCareCategory(e.target.value as CareCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium outline-none"
              >
                <option value="active">🟢 ติดสังคม (ช่วยเหลือตัวเองได้ดี แข็งแรง)</option>
                <option value="homebound">🟡 ติดบ้าน (ช่วยเหลือตัวเองได้บ้าง ต้องการผู้ดูแล)</option>
                <option value="bedridden">🔴 ติดเตียง (ช่วยเหลือตัวเองไม่ได้ ต้องการดูแลใกล้ชิด)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะการอยู่อาศัย
              </label>
              <select
                value={residentStatus}
                onChange={(e) => setResidentStatus(e.target.value as ResidentStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="resident">อยู่จริงในพื้นที่</option>
                <option value="temporary">ชั่วคราว / มาพักอาศัย</option>
                <option value="moved_out">ย้ายออกไปแล้ว</option>
                <option value="deceased">เสียชีวิต</option>
              </select>
            </div>
          </div>

          {/* Chronic Diseases Selection */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              โรคประจำตัว / โรคไม่ติดต่อเรื้อรัง (NCDs)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_CHRONIC_DISEASES.map((disease) => {
                const isSelected = selectedDiseases.includes(disease);
                return (
                  <button
                    type="button"
                    key={disease}
                    onClick={() => toggleDisease(disease)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors border ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {disease}
                  </button>
                );
              })}
            </div>

            {/* Custom Disease input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="ระบุโรคประจำตัวอื่นๆ..."
                value={customDisease}
                onChange={(e) => setCustomDisease(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomDisease}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
              >
                เพิ่ม
              </button>
            </div>
          </div>

          {/* Vitals & Health screening initial values */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              สัญญาณชีพล่าสุด (ถ้ามี)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">น้ำหนัก (กก.)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="เช่น 65"
                  value={weightKg ?? ''}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || undefined)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">ส่วนสูง (ซม.)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="เช่น 168"
                  value={heightCm ?? ''}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || undefined)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">ความดันตัวบน (Sys)</label>
                <input
                  type="number"
                  placeholder="เช่น 120"
                  value={systolic ?? ''}
                  onChange={(e) => setSystolic(parseInt(e.target.value, 10) || undefined)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">ความดันตัวล่าง (Dia)</label>
                <input
                  type="number"
                  placeholder="เช่น 80"
                  value={diastolic ?? ''}
                  onChange={(e) => setDiastolic(parseInt(e.target.value, 10) || undefined)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>
            </div>

            {bmiInfo && (
              <div className="text-xs flex items-center gap-2 pt-1">
                <span className="text-slate-600">BMI: </span>
                <span className={`font-bold px-2 py-0.5 rounded ${bmiInfo.bgClass} ${bmiInfo.colorClass}`}>
                  {bmiInfo.bmi} ({bmiInfo.label})
                </span>
              </div>
            )}
          </div>

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
              <span>{personToEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลประชากร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
