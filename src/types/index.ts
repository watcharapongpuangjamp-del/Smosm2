export type Gender = 'male' | 'female';

export type ResidentStatus = 'resident' | 'moved_out' | 'deceased' | 'temporary';

export type CareCategory = 'active' | 'homebound' | 'bedridden'; // ติดสังคม, ติดบ้าน, ติดเตียง

export interface Village {
  id: string;
  no: number;
  name: string;
  subdistrict: string;
  district: string;
  province: string;
  centerLat: number;
  centerLng: number;
}

export interface VhvMember {
  id: string;
  name: string;
  citizenId: string;
  phone: string;
  villageNo: number;
  zoneName: string;
  assignedHouseIds: string[];
  isActive: boolean;
  registeredDate: string;
}

export interface Household {
  id: string;
  houseNo: string;
  villageNo: number;
  villageName: string;
  subdistrict: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  headOfHouseholdName: string;
  vhvMemberId: string;
  sanitationRating: 'good' | 'fair' | 'poor'; // สุขาภิบาล
  mosquitoLarvaFound: boolean; // พบลูกน้ำยุงลาย
  waterSource: string; // แหล่งน้ำอุปโภคบริโภค
  wasteManagement: string; // การกำจัดขยะ
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  householdId: string;
  villageNo: number;
  citizenId: string; // 13 digits
  title: string; // นาย, นาง, นางสาว, ด.ช., ด.ญ.
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  bloodGroup: 'A' | 'B' | 'AB' | 'O' | 'Rh-' | 'Unknown';
  phone?: string;
  occupation?: string;
  residentStatus: ResidentStatus;
  careCategory: CareCategory;
  chronicDiseases: string[]; // เบาหวาน, ความดัน, โรคไต, หัวใจ, etc.
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  systolic?: number;
  diastolic?: number;
  bloodSugarDtx?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HealthScreening {
  id: string;
  personId: string;
  householdId: string;
  villageNo: number;
  date: string; // YYYY-MM-DD
  vhvMemberId: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  systolic: number; // ความดันตัวบน
  diastolic: number; // ความดันตัวล่าง
  pulse?: number;
  bloodSugarDtx?: number; // ค่าน้ำตาลปลายนิ้ว (mg/dL)
  waistCm?: number; // รอบเอว (ซม.)
  smoker: boolean;
  alcohol: boolean;
  notes?: string;
  advice?: string;
  needDoctorReferral: boolean;
  createdAt: string;
}

export interface Tombstone {
  id: string;
  collection: 'households' | 'persons' | 'screenings' | 'vhv_members';
  villageNo: number;
  deletedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'sync' | 'import';
  collection: string;
  details: string;
  user: string;
}
