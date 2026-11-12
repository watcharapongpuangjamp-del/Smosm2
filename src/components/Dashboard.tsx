import React from 'react';
import {
  Users,
  Home,
  UserCheck,
  AlertTriangle,
  HeartHandshake,
  Heart,
  Droplet,
  PlusCircle,
  MapPin,
  ClipboardList,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Bug,
} from 'lucide-react';
import { Household, Person, HealthScreening, Village } from '../types';
import { calculateAge, formatThaiDate } from '../utils/thaiId';
import { CARE_CATEGORY_CONFIG, evaluateBloodPressure } from '../utils/health';

interface DashboardProps {
  households: Household[];
  persons: Person[];
  screenings: HealthScreening[];
  villages: Village[];
  selectedVillageNo: number;
  onNavigateTab: (tab: string) => void;
  onOpenAddHousehold: () => void;
  onOpenAddPerson: () => void;
  onOpenScreening: (person: Person) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  households,
  persons,
  screenings,
  villages,
  selectedVillageNo,
  onNavigateTab,
  onOpenAddHousehold,
  onOpenAddPerson,
  onOpenScreening,
}) => {
  // Statistics calculations
  const totalHouseholds = households.length;
  const totalPersons = persons.length;
  const malesCount = persons.filter((p) => p.gender === 'male').length;
  const femalesCount = persons.filter((p) => p.gender === 'female').length;

  // Age 60+
  const elderlyCount = persons.filter((p) => calculateAge(p.birthDate) >= 60).length;

  // Care category
  const bedriddenCount = persons.filter((p) => p.careCategory === 'bedridden').length;
  const homeboundCount = persons.filter((p) => p.careCategory === 'homebound').length;
  const activeCount = persons.filter((p) => p.careCategory === 'active').length;

  // Chronic diseases
  const hypertensionCount = persons.filter((p) =>
    p.chronicDiseases.some((d) => d.includes('ความดัน'))
  ).length;

  const diabetesCount = persons.filter((p) =>
    p.chronicDiseases.some((d) => d.includes('เบาหวาน'))
  ).length;

  // Mosquito Larva House Index (HI)
  const larvaFoundHouseholds = households.filter((h) => h.mosquitoLarvaFound);
  const houseIndexPercent =
    totalHouseholds > 0 ? ((larvaFoundHouseholds.length / totalHouseholds) * 100).toFixed(1) : '0';

  // Urgent attention patients (bedridden, doctor referrals, or severe hypertension)
  const urgentPatients = persons.filter(
    (p) =>
      p.careCategory === 'bedridden' ||
      (p.systolic && p.systolic >= 140) ||
      (p.diastolic && p.diastolic >= 90) ||
      (p.bloodSugarDtx && p.bloodSugarDtx >= 180)
  );

  const selectedVillageName =
    selectedVillageNo === 0
      ? 'ทุกหมู่บ้านในเขตรับผิดชอบ'
      : villages.find((v) => v.no === selectedVillageNo)?.name || `หมู่ ${selectedVillageNo}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-600/60 text-emerald-100 text-xs font-semibold mb-2">
            <span>พื้นที่แสดงผล:</span>
            <span className="text-white underline">{selectedVillageName}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ระบบข้อมูลสุขภาพชุมชน Smart OSM Next</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            บันทึกข้อมูลครัวเรือน สำรวจประชากร คัดกรองสุขภาพ NCDs ติดตามผู้ป่วยติดบ้านติดเตียง
            และจัดทำรายงาน อสม. ประจำเดือน
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onOpenAddPerson}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>+ ทะเบียนประชากร</span>
          </button>
          <button
            onClick={onOpenAddHousehold}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors border border-emerald-400/40"
          >
            <Home className="w-4 h-4" />
            <span>+ เพิ่มหลังคาเรือน</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Households */}
        <div
          onClick={() => onNavigateTab('households')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              หลังคาเรือน
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{totalHouseholds}</span>
            <span className="text-xs text-slate-500">หลังคาเรือน</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center">
            <span>จัดการข้อมูลบ้าน & พิกัด GIS</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Population */}
        <div
          onClick={() => onNavigateTab('persons')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ประชากรทั้งหมด
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{totalPersons}</span>
            <span className="text-xs text-slate-500">คน</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>ชาย: {malesCount} คน</span>
            <span>หญิง: {femalesCount} คน</span>
          </div>
        </div>

        {/* Elderly */}
        <div
          onClick={() => onNavigateTab('persons')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ผู้สูงอายุ (60 ปีขึ้นไป)
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{elderlyCount}</span>
            <span className="text-xs text-slate-500">
              คน ({totalPersons > 0 ? ((elderlyCount / totalPersons) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">
            สังคมสูงวัย / ติดตามการคัดกรอง ADL
          </div>
        </div>

        {/* Larva HI Index */}
        <div
          onClick={() => onNavigateTab('households')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ดัชนีลูกน้ำยุงลาย (HI)
            </span>
            <div
              className={`p-2 rounded-lg ${
                larvaFoundHouseholds.length > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              } transition-colors`}
            >
              <Bug className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                parseFloat(houseIndexPercent) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {houseIndexPercent}%
            </span>
            <span className="text-xs text-slate-500">พบ {larvaFoundHouseholds.length} หลัง</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {parseFloat(houseIndexPercent) > 0 ? (
              <span className="text-rose-600 font-medium">ต้องกำจัดแหล่งเพาะพันธุ์เร่งด่วน</span>
            ) : (
              <span className="text-emerald-600 font-medium">ปลอดภัย ไม่พบลูกน้ำ</span>
            )}
          </div>
        </div>
      </div>

      {/* Care Category & Chronic Diseases Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Care Category (3 ติด: ติดสังคม, ติดบ้าน, ติดเตียง) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                การจำแนกกลุ่มสุขภาพตามภาวะพึ่งพิง (3 ติด)
              </h2>
              <p className="text-xs text-slate-500">
                เกณฑ์ประเมิน อสม. และกรมอนามัย (Barthel ADL)
              </p>
            </div>
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-3.5">
            {/* Active */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  ติดสังคม (ช่วยเหลือตัวเองได้ดี)
                </span>
                <span className="text-slate-700 font-bold">{activeCount} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${totalPersons ? (activeCount / totalPersons) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Homebound */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  ติดบ้าน (ต้องการการดูแลบางส่วน)
                </span>
                <span className="text-slate-700 font-bold">{homeboundCount} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${totalPersons ? (homeboundCount / totalPersons) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Bedridden */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  ติดเตียง (ช่วยเหลือตัวเองไม่ได้/ดูแลใกล้ชิด)
                </span>
                <span className="text-slate-700 font-bold">{bedriddenCount} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${totalPersons ? (bedriddenCount / totalPersons) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">ผู้ป่วยติดเตียงต้องการการเยี่ยมสัปดาห์ละ 1 ครั้ง</span>
            <button
              onClick={() => onNavigateTab('persons')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              <span>ดูรายชื่อกลุ่มเปราะบาง</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chronic Diseases (NCDs) & Health Monitoring */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                กลุ่มโรคเรื้อรัง NCDs และการคัดกรอง
              </h2>
              <p className="text-xs text-slate-500">
                ข้อมูลการคัดกรองความดันโลหิตและเบาหวาน
              </p>
            </div>
            <Heart className="w-5 h-5 text-rose-500" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">ความดันโลหิตสูง</div>
              <div className="mt-1 text-2xl font-bold text-slate-800">{hypertensionCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {totalPersons > 0 ? ((hypertensionCount / totalPersons) * 100).toFixed(0) : 0}% ของประชากร
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">เบาหวาน (DM)</div>
              <div className="mt-1 text-2xl font-bold text-slate-800">{diabetesCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {totalPersons > 0 ? ((diabetesCount / totalPersons) * 100).toFixed(0) : 0}% ของประชากร
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">คัดกรองสุขภาพสะสม</div>
              <div className="mt-1 text-2xl font-bold text-emerald-700">{screenings.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">ครั้งที่บันทึก</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">ส่งต่อ รพ.สต.</div>
              <div className="mt-1 text-2xl font-bold text-amber-600">
                {screenings.filter((s) => s.needDoctorReferral).length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">เคสที่ต้องพบแพทย์</div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">เป้าหมายคัดกรองผู้มีอายุ 35 ปีขึ้นไปทุกราย</span>
            <button
              onClick={() => onNavigateTab('vhv')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              <span>ดูรายงานผลงาน อสม.</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Attention / Priority Action List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                กลุ่มเสี่ยงและผู้ป่วยที่ต้องติดตามเยี่ยมบ้านด่วน
              </h2>
              <p className="text-xs text-slate-500">
                ผู้ป่วยติดเตียง, ความดันสูงเกินเกณฑ์, หรือมีภาวะเสี่ยงสุขภาพ
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
            {urgentPatients.length} ราย
          </span>
        </div>

        {urgentPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Heart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">ไม่พบประชากรในกลุ่มเสี่ยงสูงในพื้นที่ที่เลือก</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {urgentPatients.map((person) => {
              const bpEval = evaluateBloodPressure(person.systolic, person.diastolic);
              const age = calculateAge(person.birthDate);
              const careConfig = CARE_CATEGORY_CONFIG[person.careCategory];
              const house = households.find((h) => h.id === person.householdId);

              return (
                <div
                  key={person.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                      {person.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {person.title}
                          {person.firstName} {person.lastName}
                        </span>
                        <span className="text-xs text-slate-500">อายุ {age} ปี</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${careConfig.badgeClass}`}>
                          {careConfig.shortLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-slate-400" />
                          บ้านเลขที่ {house?.houseNo || '-'} หมู่ {person.villageNo}
                        </span>
                        {person.chronicDiseases.length > 0 && (
                          <span className="text-slate-500">
                            โรคประจำตัว: {person.chronicDiseases.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Vitals indicators */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {person.systolic && person.diastolic && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              bpEval ? bpEval.badgeClass : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            BP: {person.systolic}/{person.diastolic} mmHg
                          </span>
                        )}
                        {person.bloodSugarDtx && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            DTX: {person.bloodSugarDtx} mg/dL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => onOpenScreening(person)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>บันทึกคัดกรอง</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('map')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="ดูตำแหน่งบนแผนที่"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
