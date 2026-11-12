import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Heart,
  Home,
  ClipboardList,
  Edit,
  Trash2,
  AlertCircle,
  Activity,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Person, Household, Village } from '../types';
import { calculateAge, formatThaiCitizenId } from '../utils/thaiId';
import { CARE_CATEGORY_CONFIG, evaluateBloodPressure, evaluateBloodSugar } from '../utils/health';

interface PersonsProps {
  persons: Person[];
  households: Household[];
  villages: Village[];
  selectedVillageNo: number;
  onAddPerson: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
  onOpenScreening: (person: Person) => void;
  onOpenAppointments: (person: Person) => void;
}

export const Persons: React.FC<PersonsProps> = ({
  persons,
  households,
  villages,
  selectedVillageNo,
  onAddPerson,
  onEditPerson,
  onDeletePerson,
  onOpenScreening,
  onOpenAppointments,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [careFilter, setCareFilter] = useState<'all' | 'active' | 'homebound' | 'bedridden'>('all');
  const [diseaseFilter, setDiseaseFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const filteredPersons = useMemo(() => {
    return persons.filter((p) => {
      // Village filter
      if (selectedVillageNo !== 0 && p.villageNo !== selectedVillageNo) {
        return false;
      }

      // Care category filter
      if (careFilter !== 'all' && p.careCategory !== careFilter) {
        return false;
      }

      // Gender filter
      if (genderFilter !== 'all' && p.gender !== genderFilter) {
        return false;
      }

      // Chronic disease filter
      if (diseaseFilter !== 'all') {
        const hasDisease = p.chronicDiseases.some((d) => d.includes(diseaseFilter));
        if (!hasDisease) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${p.title}${p.firstName} ${p.lastName}`.toLowerCase();
        const citizenClean = p.citizenId.replace(/\D/g, '');
        const searchClean = term.replace(/\D/g, '');
        const matchesName = fullName.includes(term);
        const matchesId = searchClean.length > 0 && citizenClean.includes(searchClean);

        // Match house no
        const house = households.find((h) => h.id === p.householdId);
        const matchesHouse = house ? house.houseNo.toLowerCase().includes(term) : false;

        if (!matchesName && !matchesId && !matchesHouse) return false;
      }

      return true;
    });
  }, [persons, households, selectedVillageNo, careFilter, diseaseFilter, genderFilter, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            ทะเบียนประชากร (Population Registry)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            จัดการข้อมูลราษฎร ตรวจสอบเลข 13 หลัก สถานะพึ่งพิง 3 ติด โรคเรื้อรัง และสัญญาณชีพ
          </p>
        </div>

        <button
          onClick={onAddPerson}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ลงทะเบียนประชากรใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อ-สกุล, เลขประจำตัวประชาชน 13 หลัก, หรือบ้านเลขที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Care category filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setCareFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                careFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              ภาวะพึ่งพิง (ทั้งหมด)
            </button>
            <button
              onClick={() => setCareFilter('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                careFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              ติดสังคม
            </button>
            <button
              onClick={() => setCareFilter('homebound')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                careFilter === 'homebound' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              ติดบ้าน
            </button>
            <button
              onClick={() => setCareFilter('bedridden')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                careFilter === 'bedridden' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              ติดเตียง ⚠️
            </button>
          </div>

          {/* Disease filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">โรคประจำตัว:</span>
            <select
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ความดัน">ความดันโลหิตสูง</option>
              <option value="เบาหวาน">เบาหวาน</option>
              <option value="ไต">โรคไต</option>
              <option value="หัวใจ">โรคหัวใจ</option>
              <option value="ตั้งครรภ์">หญิงตั้งครรภ์</option>
            </select>
          </div>

          {/* Gender filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">เพศ:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="all">ทั้งหมด</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500 font-medium">
            พบทั้งหมด {filteredPersons.length} ราย
          </div>
        </div>
      </div>

      {/* Persons Table */}
      {filteredPersons.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">ไม่พบข้อมูลประชากรตามเงื่อนไข</h3>
          <p className="text-xs text-slate-500 mt-1">ลองปรับตัวกรอง หรือคลิก "ลงทะเบียนประชากรใหม่"</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">ชื่อ - สกุล</th>
                  <th className="py-3 px-4">เลขประจำตัวประชาชน</th>
                  <th className="py-3 px-4">อายุ / เพศ</th>
                  <th className="py-3 px-4">บ้านเลขที่</th>
                  <th className="py-3 px-4">ภาวะพึ่งพิง</th>
                  <th className="py-3 px-4">โรคเรื้อรัง (NCDs)</th>
                  <th className="py-3 px-4">สัญญาณชีพล่าสุด</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPersons.map((person) => {
                  const age = calculateAge(person.birthDate);
                  const house = households.find((h) => h.id === person.householdId);
                  const careConfig = CARE_CATEGORY_CONFIG[person.careCategory];
                  const bpEval = evaluateBloodPressure(person.systolic, person.diastolic);
                  const sugarEval = evaluateBloodSugar(person.bloodSugarDtx);

                  return (
                    <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {person.title}
                          {person.firstName} {person.lastName}
                        </div>
                        {person.phone && (
                          <div className="text-[11px] text-slate-500">{person.phone}</div>
                        )}
                      </td>

                      {/* Citizen ID */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        {formatThaiCitizenId(person.citizenId)}
                      </td>

                      {/* Age & Gender */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{age} ปี</div>
                        <div className="text-[11px] text-slate-500">
                          {person.gender === 'male' ? 'ชาย' : 'หญิง'} (หมู่เลือด {person.bloodGroup})
                        </div>
                      </td>

                      {/* House No */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {house ? house.houseNo : '-'}
                        </div>
                        <div className="text-[11px] text-slate-500">หมู่ {person.villageNo}</div>
                      </td>

                      {/* Care Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${careConfig.badgeClass}`}
                        >
                          {careConfig.shortLabel}
                        </span>
                      </td>

                      {/* Chronic Diseases */}
                      <td className="py-3 px-4">
                        {person.chronicDiseases.length === 0 ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {person.chronicDiseases.map((d, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Latest Vitals */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {person.systolic && person.diastolic ? (
                            <div className="text-[11px]">
                              <span className="text-slate-500">BP: </span>
                              <span className={`font-semibold ${bpEval?.colorClass || 'text-slate-700'}`}>
                                {person.systolic}/{person.diastolic}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">ยังไม่ตรวจ BP</span>
                          )}

                          {person.bloodSugarDtx && (
                            <div className="text-[11px]">
                              <span className="text-slate-500">DTX: </span>
                              <span className="font-semibold text-purple-700">
                                {person.bloodSugarDtx} mg/dL
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenAppointments(person)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ปฏิทินนัดหมายและลงพื้นที่รายบุคคล"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenScreening(person)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="บันทึกคัดกรองสุขภาพ / เยี่ยมบ้าน"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditPerson(person)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="แก้ไขข้อมูลประชากร"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `ยืนยันการลบข้อมูล ${person.title}${person.firstName} ${person.lastName} หรือไม่?`
                                )
                              ) {
                                onDeletePerson(person.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
