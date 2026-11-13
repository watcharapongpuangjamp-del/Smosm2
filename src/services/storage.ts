import {
  Village,
  VhvMember,
  Household,
  Person,
  HealthScreening,
  Appointment,
  AppointmentStatus,
  Tombstone,
  AuditLog,
} from '../types';
import {
  INITIAL_VILLAGES,
  INITIAL_VHV_MEMBERS,
  INITIAL_HOUSEHOLDS,
  INITIAL_PERSONS,
  INITIAL_SCREENINGS,
  INITIAL_APPOINTMENTS,
} from '../data/mockData';
import { dbService } from './db';

const KEYS = {
  VILLAGES: 'smart_osm_villages',
  VHV_MEMBERS: 'smart_osm_vhv_members',
  HOUSEHOLDS: 'smart_osm_households',
  PERSONS: 'smart_osm_persons',
  SCREENINGS: 'smart_osm_screenings',
  APPOINTMENTS: 'smart_osm_appointments',
  TOMBSTONES: 'smart_osm_tombstones',
  LOGS: 'smart_osm_audit_logs',
  MIGRATED: 'smart_osm_migrated_to_sqlite'
};

const BACKUP_VERSION = '2.0.0';

type BackupPayload = {
  version: typeof BACKUP_VERSION;
  villages: Record<string, unknown>[];
  vhvMembers: Record<string, unknown>[];
  households: Record<string, unknown>[];
  persons: Record<string, unknown>[];
  screenings: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  tombstones: Record<string, unknown>[];
  logs?: Record<string, unknown>[];
};

const BACKUP_COLLECTIONS = [
  'villages',
  'vhvMembers',
  'households',
  'persons',
  'screenings',
  'appointments',
  'tombstones',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!isRecord(payload)) {
    throw new Error('ไฟล์สำรองข้อมูลต้องเป็น JSON object');
  }

  if (payload.version !== BACKUP_VERSION) {
    throw new Error(`ไม่รองรับไฟล์สำรองข้อมูลเวอร์ชัน ${String(payload.version || 'ไม่ระบุ')}`);
  }

  for (const collection of BACKUP_COLLECTIONS) {
    const records = payload[collection];
    if (!Array.isArray(records) || records.some((record) => !isRecord(record))) {
      throw new Error(`รูปแบบข้อมูล ${collection} ไม่ถูกต้อง`);
    }
  }

  if (payload.logs !== undefined && (!Array.isArray(payload.logs) || payload.logs.some((log) => !isRecord(log)))) {
    throw new Error('รูปแบบข้อมูล logs ไม่ถูกต้อง');
  }
}

class StorageService {
  private isReady = false;

  async init() {
    if (this.isReady) return;
    await dbService.init();
    // Older builds stored duplicate health records in a local "sync" queue even
    // though no server endpoint was configured. Remove that unused copy.
    await dbService.execute('DROP TABLE IF EXISTS sync_queue;');
    await this.migrateIfNeeded();
    this.isReady = true;
  }

  private async migrateIfNeeded() {
    const isMigrated = localStorage.getItem(KEYS.MIGRATED);
    if (isMigrated) return;

    console.log('Migrating data from localStorage to SQLite...');

    // Villages
    const villages = JSON.parse(localStorage.getItem('smart_osm_villages') || JSON.stringify(INITIAL_VILLAGES));
    for (const v of villages) {
      await dbService.run(
        'INSERT OR REPLACE INTO villages (id, no, name, subdistrict, district, province, centerLat, centerLng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [v.id, v.no, v.name, v.subdistrict, v.district, v.province, v.centerLat, v.centerLng]
      );
    }

    // VHV Members
    const vhv = JSON.parse(localStorage.getItem('smart_osm_vhv_members') || JSON.stringify(INITIAL_VHV_MEMBERS));
    for (const m of vhv) {
      await dbService.run(
        'INSERT OR REPLACE INTO vhv_members (id, name, citizenId, phone, villageNo, zoneName, assignedHouseIds, isActive, registeredDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [m.id, m.name, m.citizenId, m.phone, m.villageNo, m.zoneName, JSON.stringify(m.assignedHouseIds), m.isActive ? 1 : 0, m.registeredDate]
      );
    }

    // Households
    const households = JSON.parse(localStorage.getItem('smart_osm_households') || JSON.stringify(INITIAL_HOUSEHOLDS));
    for (const h of households) {
      await dbService.run(
        'INSERT OR REPLACE INTO households (id, houseNo, villageNo, villageName, subdistrict, district, province, latitude, longitude, headOfHouseholdName, vhvMemberId, sanitationRating, mosquitoLarvaFound, waterSource, wasteManagement, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [h.id, h.houseNo, h.villageNo, h.villageName, h.subdistrict, h.district, h.province, h.latitude, h.longitude, h.headOfHouseholdName, h.vhvMemberId, h.sanitationRating, h.mosquitoLarvaFound ? 1 : 0, h.waterSource, h.wasteManagement, h.notes, h.createdAt, h.updatedAt]
      );
    }

    // Persons
    const persons = JSON.parse(localStorage.getItem('smart_osm_persons') || JSON.stringify(INITIAL_PERSONS));
    for (const p of persons) {
      await dbService.run(
        'INSERT OR REPLACE INTO persons (id, householdId, villageNo, citizenId, title, firstName, lastName, gender, birthDate, birthDatePrecision, bloodGroup, phone, occupation, residentStatus, careCategory, chronicDiseases, weightKg, heightCm, bmi, systolic, diastolic, bloodSugarDtx, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.householdId, p.villageNo, p.citizenId, p.title, p.firstName, p.lastName, p.gender, p.birthDate, p.birthDatePrecision, p.bloodGroup, p.phone, p.occupation, p.residentStatus, p.careCategory, JSON.stringify(p.chronicDiseases), p.weightKg, p.heightCm, p.bmi, p.systolic, p.diastolic, p.bloodSugarDtx, p.createdAt, p.updatedAt]
      );
    }

    // Screenings
    const screenings = JSON.parse(localStorage.getItem('smart_osm_screenings') || JSON.stringify(INITIAL_SCREENINGS));
    for (const s of screenings) {
      await dbService.run(
        'INSERT OR REPLACE INTO screenings (id, personId, householdId, villageNo, date, vhvMemberId, weightKg, heightCm, bmi, systolic, diastolic, pulse, bloodSugarDtx, waistCm, smoker, alcohol, notes, advice, needDoctorReferral, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.personId, s.householdId, s.villageNo, s.date, s.vhvMemberId, s.weightKg, s.heightCm, s.bmi, s.systolic, s.diastolic, s.pulse, s.bloodSugarDtx, s.waistCm, s.smoker ? 1 : 0, s.alcohol ? 1 : 0, s.notes, s.advice, s.needDoctorReferral ? 1 : 0, s.createdAt]
      );
    }

    // Appointments
    const appointments = JSON.parse(localStorage.getItem('smart_osm_appointments') || JSON.stringify(INITIAL_APPOINTMENTS));
    for (const a of appointments) {
      await dbService.run(
        'INSERT OR REPLACE INTO appointments (id, personId, householdId, villageNo, vhvMemberId, title, type, date, time, location, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [a.id, a.personId, a.householdId, a.villageNo, a.vhvMemberId, a.title, a.type, a.date, a.time, a.location, a.status, a.notes, a.createdAt, a.updatedAt]
      );
    }

    // Tombstones
    const tombstones = JSON.parse(localStorage.getItem('smart_osm_tombstones') || '[]');
    for (const t of tombstones) {
      await dbService.run(
        'INSERT OR REPLACE INTO tombstones (id, collection, villageNo, deletedAt) VALUES (?, ?, ?, ?)',
        [t.id, t.collection, t.villageNo, t.deletedAt]
      );
    }

    // Audit Logs
    const logs = JSON.parse(localStorage.getItem('smart_osm_audit_logs') || '[]');
    for (const l of logs) {
      await dbService.run(
        'INSERT OR REPLACE INTO audit_logs (id, timestamp, action, collection, details, user) VALUES (?, ?, ?, ?, ?, ?)',
        [l.id, l.timestamp, l.action, l.collection, l.details, l.user]
      );
    }

    localStorage.setItem(KEYS.MIGRATED, 'true');
    await dbService.saveToWebStore();
    console.log('Migration completed.');
  }

  // --- Villages ---
  async getVillages(): Promise<Village[]> {
    const res = await dbService.query('SELECT * FROM villages');
    return res.values || [];
  }

  // --- VHV Members ---
  async getVhvMembers(villageNo?: number): Promise<VhvMember[]> {
    let query = 'SELECT * FROM vhv_members';
    let params: any[] = [];
    if (villageNo !== undefined && villageNo !== 0) {
      query += ' WHERE villageNo = ?';
      params.push(villageNo);
    }
    const res = await dbService.query(query, params);
    return (res.values || []).map((m: any) => ({
      ...m,
      assignedHouseIds: JSON.parse(m.assignedHouseIds || '[]'),
      isActive: m.isActive === 1
    }));
  }

  async saveVhvMember(member: VhvMember): Promise<void> {
    await dbService.run(
      'INSERT OR REPLACE INTO vhv_members (id, name, citizenId, phone, villageNo, zoneName, assignedHouseIds, isActive, registeredDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [member.id, member.name, member.citizenId, member.phone, member.villageNo, member.zoneName, JSON.stringify(member.assignedHouseIds), member.isActive ? 1 : 0, member.registeredDate]
    );
    await this.log('update', 'vhv_members', `แก้ไขข้อมูล อสม. ${member.name}`);
    await dbService.saveToWebStore();
  }

  // --- Households ---
  async getHouseholds(villageNo?: number): Promise<Household[]> {
    let query = 'SELECT * FROM households';
    let params: any[] = [];
    if (villageNo !== undefined && villageNo !== 0) {
      query += ' WHERE villageNo = ?';
      params.push(villageNo);
    }
    const res = await dbService.query(query, params);
    return (res.values || []).map((h: any) => ({
      ...h,
      mosquitoLarvaFound: h.mosquitoLarvaFound === 1
    }));
  }

  async getHouseholdById(id: string): Promise<Household | undefined> {
    const res = await dbService.query('SELECT * FROM households WHERE id = ?', [id]);
    const h = res.values?.[0];
    if (!h) return undefined;
    return {
      ...h,
      mosquitoLarvaFound: h.mosquitoLarvaFound === 1
    };
  }

  async saveHousehold(household: Household): Promise<void> {
    const now = new Date().toISOString();
    household.updatedAt = now;
    if (!household.createdAt) household.createdAt = now;

    await dbService.run(
      'INSERT OR REPLACE INTO households (id, houseNo, villageNo, villageName, subdistrict, district, province, latitude, longitude, headOfHouseholdName, vhvMemberId, sanitationRating, mosquitoLarvaFound, waterSource, wasteManagement, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [household.id, household.houseNo, household.villageNo, household.villageName, household.subdistrict, household.district, household.province, household.latitude, household.longitude, household.headOfHouseholdName, household.vhvMemberId, household.sanitationRating, household.mosquitoLarvaFound ? 1 : 0, household.waterSource, household.wasteManagement, household.notes, household.createdAt, household.updatedAt]
    );
    
    await this.log(household.createdAt === now ? 'create' : 'update', 'households', `บันทึกข้อมูลบ้านเลขที่ ${household.houseNo}`);
    await dbService.saveToWebStore();
  }

  async deleteHousehold(id: string): Promise<void> {
    const h = await this.getHouseholdById(id);
    if (!h) return;

    await dbService.run('DELETE FROM households WHERE id = ?', [id]);
    await this.addTombstone('households', h.villageNo, id);
    await this.log('delete', 'households', `ลบบ้านเลขที่ ${h.houseNo}`);
    await dbService.saveToWebStore();
  }

  // --- Persons ---
  async getPersons(villageNo?: number): Promise<Person[]> {
    let query = 'SELECT * FROM persons';
    let params: any[] = [];
    if (villageNo !== undefined && villageNo !== 0) {
      query += ' WHERE villageNo = ?';
      params.push(villageNo);
    }
    const res = await dbService.query(query, params);
    return (res.values || []).map((p: any) => ({
      ...p,
      chronicDiseases: JSON.parse(p.chronicDiseases || '[]')
    }));
  }

  async getPersonById(id: string): Promise<Person | undefined> {
    const res = await dbService.query('SELECT * FROM persons WHERE id = ?', [id]);
    const p = res.values?.[0];
    if (!p) return undefined;
    return {
      ...p,
      chronicDiseases: JSON.parse(p.chronicDiseases || '[]')
    };
  }

  async getPersonsByHousehold(householdId: string): Promise<Person[]> {
    const res = await dbService.query('SELECT * FROM persons WHERE householdId = ?', [householdId]);
    return (res.values || []).map((p: any) => ({
      ...p,
      chronicDiseases: JSON.parse(p.chronicDiseases || '[]')
    }));
  }

  async savePerson(person: Person): Promise<void> {
    const now = new Date().toISOString();
    person.updatedAt = now;
    if (!person.createdAt) person.createdAt = now;

    await dbService.run(
      'INSERT OR REPLACE INTO persons (id, householdId, villageNo, citizenId, title, firstName, lastName, gender, birthDate, birthDatePrecision, bloodGroup, phone, occupation, residentStatus, careCategory, chronicDiseases, weightKg, heightCm, bmi, systolic, diastolic, bloodSugarDtx, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [person.id, person.householdId, person.villageNo, person.citizenId, person.title, person.firstName, person.lastName, person.gender, person.birthDate, person.birthDatePrecision, person.bloodGroup, person.phone, person.occupation, person.residentStatus, person.careCategory, JSON.stringify(person.chronicDiseases), person.weightKg, person.heightCm, person.bmi, person.systolic, person.diastolic, person.bloodSugarDtx, person.createdAt, person.updatedAt]
    );
    
    await this.log(person.createdAt === now ? 'create' : 'update', 'persons', `บันทึกข้อมูล ${person.firstName} ${person.lastName}`);
    await dbService.saveToWebStore();
  }

  async deletePerson(id: string): Promise<void> {
    const p = await this.getPersonById(id);
    if (!p) return;

    await dbService.run('DELETE FROM persons WHERE id = ?', [id]);
    await this.addTombstone('persons', p.villageNo, id);
    await this.log('delete', 'persons', `ลบข้อมูลประชากร ${p.firstName}`);
    await dbService.saveToWebStore();
  }

  // --- Screenings ---
  async getScreenings(villageNo?: number): Promise<HealthScreening[]> {
    let query = 'SELECT * FROM screenings';
    let params: any[] = [];
    if (villageNo !== undefined && villageNo !== 0) {
      query += ' WHERE villageNo = ?';
      params.push(villageNo);
    }
    query += ' ORDER BY date DESC';
    const res = await dbService.query(query, params);
    return (res.values || []).map((s: any) => ({
      ...s,
      smoker: s.smoker === 1,
      alcohol: s.alcohol === 1,
      needDoctorReferral: s.needDoctorReferral === 1
    }));
  }

  async getScreeningsByPerson(personId: string): Promise<HealthScreening[]> {
    const res = await dbService.query('SELECT * FROM screenings WHERE personId = ? ORDER BY date DESC', [personId]);
    return (res.values || []).map((s: any) => ({
      ...s,
      smoker: s.smoker === 1,
      alcohol: s.alcohol === 1,
      needDoctorReferral: s.needDoctorReferral === 1
    }));
  }

  async saveScreening(screening: HealthScreening): Promise<void> {
    await dbService.run(
      'INSERT OR REPLACE INTO screenings (id, personId, householdId, villageNo, date, vhvMemberId, weightKg, heightCm, bmi, systolic, diastolic, pulse, bloodSugarDtx, waistCm, smoker, alcohol, notes, advice, needDoctorReferral, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [screening.id, screening.personId, screening.householdId, screening.villageNo, screening.date, screening.vhvMemberId, screening.weightKg, screening.heightCm, screening.bmi, screening.systolic, screening.diastolic, screening.pulse, screening.bloodSugarDtx, screening.waistCm, screening.smoker ? 1 : 0, screening.alcohol ? 1 : 0, screening.notes, screening.advice, screening.needDoctorReferral ? 1 : 0, screening.createdAt]
    );

    // Update person vitals
    const p = await this.getPersonById(screening.personId);
    if (p) {
      p.weightKg = screening.weightKg;
      p.heightCm = screening.heightCm;
      p.bmi = screening.bmi;
      p.systolic = screening.systolic;
      p.diastolic = screening.diastolic;
      p.bloodSugarDtx = screening.bloodSugarDtx;
      await this.savePerson(p);
    }

    await this.log('create', 'screenings', `คัดกรองสุขภาพ ${screening.date}`);
    await dbService.saveToWebStore();
  }

  // --- Appointments ---
  async getAppointments(villageNo?: number): Promise<Appointment[]> {
    let query = 'SELECT * FROM appointments';
    let params: any[] = [];
    if (villageNo !== undefined && villageNo !== 0) {
      query += ' WHERE villageNo = ?';
      params.push(villageNo);
    }
    const res = await dbService.query(query, params);
    return res.values || [];
  }

  async getAppointmentsByPerson(personId: string): Promise<Appointment[]> {
    const res = await dbService.query('SELECT * FROM appointments WHERE personId = ? ORDER BY date DESC', [personId]);
    return res.values || [];
  }

  async saveAppointment(a: Appointment): Promise<void> {
    const now = new Date().toISOString();
    a.updatedAt = now;
    if (!a.createdAt) a.createdAt = now;

    await dbService.run(
      'INSERT OR REPLACE INTO appointments (id, personId, householdId, villageNo, vhvMemberId, title, type, date, time, location, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [a.id, a.personId, a.householdId, a.villageNo, a.vhvMemberId, a.title, a.type, a.date, a.time, a.location, a.status, a.notes, a.createdAt, a.updatedAt]
    );
    await dbService.saveToWebStore();
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    await dbService.run('UPDATE appointments SET status = ?, updatedAt = ? WHERE id = ?', [status, new Date().toISOString(), id]);
    await dbService.saveToWebStore();
  }

  async deleteAppointment(id: string): Promise<void> {
    const res = await dbService.query('SELECT villageNo FROM appointments WHERE id = ?', [id]);
    const villageNo = res.values?.[0]?.villageNo;
    if (villageNo) {
      await dbService.run('DELETE FROM appointments WHERE id = ?', [id]);
      await this.addTombstone('appointments', villageNo, id);
      await dbService.saveToWebStore();
    }
  }

  // --- Utils ---
  private async addTombstone(collection: Tombstone['collection'], villageNo: number, id: string) {
    await dbService.run('INSERT OR REPLACE INTO tombstones (id, collection, villageNo, deletedAt) VALUES (?, ?, ?, ?)', [id, collection, villageNo, new Date().toISOString()]);
  }

  async getTombstones(): Promise<Tombstone[]> {
    const res = await dbService.query('SELECT * FROM tombstones');
    return res.values || [];
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await dbService.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    return res.values || [];
  }

  async log(action: AuditLog['action'], collection: string, details: string, user: string = 'อสม. ประจำการ') {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await dbService.run('INSERT INTO audit_logs (id, timestamp, action, collection, details, user) VALUES (?, ?, ?, ?, ?, ?)', [id, new Date().toISOString(), action, collection, details, user]);
  }

  async exportAllData() {
    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      villages: await this.getVillages(),
      vhvMembers: await this.getVhvMembers(),
      households: await this.getHouseholds(),
      persons: await this.getPersons(),
      screenings: await this.getScreenings(),
      appointments: await this.getAppointments(),
      tombstones: await this.getTombstones(),
    };
  }

  async importAllData(payload: unknown) {
    // Validate before clearing the database so a malformed or unrelated JSON file
    // cannot erase the user's existing records.
    validateBackupPayload(payload);
    await this.clearAllData();

    if (payload.villages) {
      for (const v of payload.villages) {
        await dbService.run(
          'INSERT OR REPLACE INTO villages (id, no, name, subdistrict, district, province, centerLat, centerLng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [v.id, v.no, v.name, v.subdistrict, v.district, v.province, v.centerLat, v.centerLng]
        );
      }
    }

    if (payload.vhvMembers) {
      for (const m of payload.vhvMembers) {
        await dbService.run(
          'INSERT OR REPLACE INTO vhv_members (id, name, citizenId, phone, villageNo, zoneName, assignedHouseIds, isActive, registeredDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [m.id, m.name, m.citizenId, m.phone, m.villageNo, m.zoneName, JSON.stringify(m.assignedHouseIds), m.isActive ? 1 : 0, m.registeredDate]
        );
      }
    }

    if (payload.households) {
      for (const h of payload.households) {
        await dbService.run(
          'INSERT OR REPLACE INTO households (id, houseNo, villageNo, villageName, subdistrict, district, province, latitude, longitude, headOfHouseholdName, vhvMemberId, sanitationRating, mosquitoLarvaFound, waterSource, wasteManagement, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [h.id, h.houseNo, h.villageNo, h.villageName, h.subdistrict, h.district, h.province, h.latitude, h.longitude, h.headOfHouseholdName, h.vhvMemberId, h.sanitationRating, h.mosquitoLarvaFound ? 1 : 0, h.waterSource, h.wasteManagement, h.notes, h.createdAt, h.updatedAt]
        );
      }
    }

    if (payload.persons) {
      for (const p of payload.persons) {
        await dbService.run(
          'INSERT OR REPLACE INTO persons (id, householdId, villageNo, citizenId, title, firstName, lastName, gender, birthDate, birthDatePrecision, bloodGroup, phone, occupation, residentStatus, careCategory, chronicDiseases, weightKg, heightCm, bmi, systolic, diastolic, bloodSugarDtx, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.householdId, p.villageNo, p.citizenId, p.title, p.firstName, p.lastName, p.gender, p.birthDate, p.birthDatePrecision, p.bloodGroup, p.phone, p.occupation, p.residentStatus, p.careCategory, JSON.stringify(p.chronicDiseases), p.weightKg, p.heightCm, p.bmi, p.systolic, p.diastolic, p.bloodSugarDtx, p.createdAt, p.updatedAt]
        );
      }
    }

    if (payload.screenings) {
      for (const s of payload.screenings) {
        await dbService.run(
          'INSERT OR REPLACE INTO screenings (id, personId, householdId, villageNo, date, vhvMemberId, weightKg, heightCm, bmi, systolic, diastolic, pulse, bloodSugarDtx, waistCm, smoker, alcohol, notes, advice, needDoctorReferral, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.personId, s.householdId, s.villageNo, s.date, s.vhvMemberId, s.weightKg, s.heightCm, s.bmi, s.systolic, s.diastolic, s.pulse, s.bloodSugarDtx, s.waistCm, s.smoker ? 1 : 0, s.alcohol ? 1 : 0, s.notes, s.advice, s.needDoctorReferral ? 1 : 0, s.createdAt]
        );
      }
    }

    if (payload.appointments) {
      for (const a of payload.appointments) {
        await dbService.run(
          'INSERT OR REPLACE INTO appointments (id, personId, householdId, villageNo, vhvMemberId, title, type, date, time, location, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.personId, a.householdId, a.villageNo, a.vhvMemberId, a.title, a.type, a.date, a.time, a.location, a.status, a.notes, a.createdAt, a.updatedAt]
        );
      }
    }

    if (payload.tombstones) {
      for (const t of payload.tombstones) {
        await dbService.run(
          'INSERT OR REPLACE INTO tombstones (id, collection, villageNo, deletedAt) VALUES (?, ?, ?, ?)',
          [t.id, t.collection, t.villageNo, t.deletedAt]
        );
      }
    }

    if (payload.logs) {
      for (const l of payload.logs) {
        await dbService.run(
          'INSERT OR REPLACE INTO audit_logs (id, timestamp, action, collection, details, user) VALUES (?, ?, ?, ?, ?, ?)',
          [l.id, l.timestamp, l.action, l.collection, l.details, l.user]
        );
      }
    }

    localStorage.setItem(KEYS.MIGRATED, 'true'); // Prevent re-migration
    await dbService.saveToWebStore();
    window.location.reload();
  }

  async resetToDefault() {
    localStorage.removeItem(KEYS.MIGRATED);
    await dbService.execute('DELETE FROM villages; DELETE FROM vhv_members; DELETE FROM households; DELETE FROM persons; DELETE FROM screenings; DELETE FROM appointments; DELETE FROM tombstones; DELETE FROM audit_logs;');
    await this.migrateIfNeeded();
    window.location.reload();
  }

  async clearAllData() {
    await dbService.execute('DELETE FROM villages; DELETE FROM vhv_members; DELETE FROM households; DELETE FROM persons; DELETE FROM screenings; DELETE FROM appointments; DELETE FROM tombstones; DELETE FROM audit_logs;');
    // Only remove this application's legacy migration keys. Clearing both storage
    // areas can erase unrelated data when the app shares an origin with another app.
    for (const key of Object.values(KEYS)) {
      if (key === KEYS.MIGRATED) continue;
      localStorage.removeItem(key);
    }
    // Keep the database marked as migrated so a reload does not repopulate the
    // deliberately cleared database with demonstration records.
    localStorage.setItem(KEYS.MIGRATED, 'true');
    await dbService.saveToWebStore();
  }
}

export const storage = new StorageService();
