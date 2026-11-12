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

const KEYS = {
  VILLAGES: 'smart_osm_villages',
  VHV_MEMBERS: 'smart_osm_vhv_members',
  HOUSEHOLDS: 'smart_osm_households',
  PERSONS: 'smart_osm_persons',
  SCREENINGS: 'smart_osm_screenings',
  APPOINTMENTS: 'smart_osm_appointments',
  TOMBSTONES: 'smart_osm_tombstones',
  LOGS: 'smart_osm_audit_logs',
  LAST_SYNC: 'smart_osm_last_sync',
};

class StorageService {
  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    if (!localStorage.getItem(KEYS.VILLAGES)) {
      localStorage.setItem(KEYS.VILLAGES, JSON.stringify(INITIAL_VILLAGES));
    }
    if (!localStorage.getItem(KEYS.VHV_MEMBERS)) {
      localStorage.setItem(KEYS.VHV_MEMBERS, JSON.stringify(INITIAL_VHV_MEMBERS));
    }
    if (!localStorage.getItem(KEYS.HOUSEHOLDS)) {
      localStorage.setItem(KEYS.HOUSEHOLDS, JSON.stringify(INITIAL_HOUSEHOLDS));
    }
    if (!localStorage.getItem(KEYS.PERSONS)) {
      localStorage.setItem(KEYS.PERSONS, JSON.stringify(INITIAL_PERSONS));
    }
    if (!localStorage.getItem(KEYS.SCREENINGS)) {
      localStorage.setItem(KEYS.SCREENINGS, JSON.stringify(INITIAL_SCREENINGS));
    }
    if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
    }
    if (!localStorage.getItem(KEYS.TOMBSTONES)) {
      localStorage.setItem(KEYS.TOMBSTONES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.LOGS)) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          action: 'create',
          collection: 'system',
          details: 'เริ่มต้นระบบ Smart OSM Next ทะเบียนประชากรและ อสม.',
          user: 'อสม. ประจำการ',
        },
      ];
      localStorage.setItem(KEYS.LOGS, JSON.stringify(initialLogs));
    }
  }

  // --- Villages ---
  getVillages(): Village[] {
    try {
      const data = localStorage.getItem(KEYS.VILLAGES);
      return data ? JSON.parse(data) : INITIAL_VILLAGES;
    } catch {
      return INITIAL_VILLAGES;
    }
  }

  // --- VHV Members ---
  getVhvMembers(villageNo?: number): VhvMember[] {
    try {
      const data = localStorage.getItem(KEYS.VHV_MEMBERS);
      const list: VhvMember[] = data ? JSON.parse(data) : INITIAL_VHV_MEMBERS;
      if (villageNo !== undefined && villageNo !== 0) {
        return list.filter((v) => v.villageNo === villageNo);
      }
      return list;
    } catch {
      return INITIAL_VHV_MEMBERS;
    }
  }

  saveVhvMember(member: VhvMember): void {
    const list = this.getVhvMembers();
    const idx = list.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      list[idx] = member;
      this.log('update', 'vhv_members', `แก้ไขข้อมูล อสม. ${member.name}`);
    } else {
      list.push(member);
      this.log('create', 'vhv_members', `เพิ่ม อสม. ใหม่ ${member.name}`);
    }
    localStorage.setItem(KEYS.VHV_MEMBERS, JSON.stringify(list));
  }

  // --- Households ---
  getHouseholds(villageNo?: number): Household[] {
    try {
      const data = localStorage.getItem(KEYS.HOUSEHOLDS);
      const list: Household[] = data ? JSON.parse(data) : INITIAL_HOUSEHOLDS;
      if (villageNo !== undefined && villageNo !== 0) {
        return list.filter((h) => h.villageNo === villageNo);
      }
      return list;
    } catch {
      return INITIAL_HOUSEHOLDS;
    }
  }

  getHouseholdById(id: string): Household | undefined {
    return this.getHouseholds().find((h) => h.id === id);
  }

  saveHousehold(household: Household): void {
    const list = this.getHouseholds();
    const idx = list.findIndex((h) => h.id === household.id);
    const now = new Date().toISOString();
    household.updatedAt = now;

    if (idx >= 0) {
      list[idx] = household;
      this.log('update', 'households', `อัปเดตข้อมูลบ้านเลขที่ ${household.houseNo} หมู่ ${household.villageNo}`);
    } else {
      household.createdAt = now;
      list.push(household);
      this.log('create', 'households', `เพิ่มบ้านเลขที่ใหม่ ${household.houseNo} หมู่ ${household.villageNo}`);
    }
    localStorage.setItem(KEYS.HOUSEHOLDS, JSON.stringify(list));
  }

  deleteHousehold(id: string): void {
    const list = this.getHouseholds();
    const target = list.find((h) => h.id === id);
    if (!target) return;

    const filtered = list.filter((h) => h.id !== id);
    localStorage.setItem(KEYS.HOUSEHOLDS, JSON.stringify(filtered));

    // Record tombstone for sync
    this.addTombstone('households', target.villageNo, id);
    this.log('delete', 'households', `ลบบ้านเลขที่ ${target.houseNo} หมู่ ${target.villageNo}`);
  }

  // --- Persons ---
  getPersons(villageNo?: number): Person[] {
    try {
      const data = localStorage.getItem(KEYS.PERSONS);
      const list: Person[] = data ? JSON.parse(data) : INITIAL_PERSONS;
      if (villageNo !== undefined && villageNo !== 0) {
        return list.filter((p) => p.villageNo === villageNo);
      }
      return list;
    } catch {
      return INITIAL_PERSONS;
    }
  }

  getPersonById(id: string): Person | undefined {
    return this.getPersons().find((p) => p.id === id);
  }

  getPersonsByHousehold(householdId: string): Person[] {
    return this.getPersons().filter((p) => p.householdId === householdId);
  }

  savePerson(person: Person): void {
    const list = this.getPersons();
    const idx = list.findIndex((p) => p.id === person.id);
    const now = new Date().toISOString();
    person.updatedAt = now;

    if (idx >= 0) {
      list[idx] = person;
      this.log('update', 'persons', `อัปเดตข้อมูลประชากร ${person.title}${person.firstName} ${person.lastName}`);
    } else {
      person.createdAt = now;
      list.push(person);
      this.log('create', 'persons', `ลงทะเบียนประชากรใหม่ ${person.title}${person.firstName} ${person.lastName}`);
    }
    localStorage.setItem(KEYS.PERSONS, JSON.stringify(list));
  }

  deletePerson(id: string): void {
    const list = this.getPersons();
    const target = list.find((p) => p.id === id);
    if (!target) return;

    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem(KEYS.PERSONS, JSON.stringify(filtered));

    this.addTombstone('persons', target.villageNo, id);
    this.log('delete', 'persons', `ลบข้อมูลประชากร ${target.firstName} ${target.lastName}`);
  }

  // --- Health Screenings ---
  getScreenings(villageNo?: number): HealthScreening[] {
    try {
      const data = localStorage.getItem(KEYS.SCREENINGS);
      const list: HealthScreening[] = data ? JSON.parse(data) : INITIAL_SCREENINGS;
      if (villageNo !== undefined && villageNo !== 0) {
        return list.filter((s) => s.villageNo === villageNo);
      }
      return list;
    } catch {
      return INITIAL_SCREENINGS;
    }
  }

  getScreeningsByPerson(personId: string): HealthScreening[] {
    return this.getScreenings()
      .filter((s) => s.personId === personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  saveScreening(screening: HealthScreening): void {
    const list = this.getScreenings();
    const idx = list.findIndex((s) => s.id === screening.id);
    if (idx >= 0) {
      list[idx] = screening;
    } else {
      list.unshift(screening);
    }
    localStorage.setItem(KEYS.SCREENINGS, JSON.stringify(list));

    // Also update Person latest vitals
    const person = this.getPersonById(screening.personId);
    if (person) {
      person.weightKg = screening.weightKg;
      person.heightCm = screening.heightCm;
      person.bmi = screening.bmi;
      person.systolic = screening.systolic;
      person.diastolic = screening.diastolic;
      if (screening.bloodSugarDtx) {
        person.bloodSugarDtx = screening.bloodSugarDtx;
      }
      this.savePerson(person);
    }

    this.log('create', 'screenings', `บันทึกการคัดกรองสุขภาพ วันที่ ${screening.date}`);
  }

  // --- Appointments (ปฏิทินนัดหมาย) ---
  getAppointments(villageNo?: number): Appointment[] {
    try {
      const data = localStorage.getItem(KEYS.APPOINTMENTS);
      const list: Appointment[] = data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
      if (villageNo !== undefined && villageNo !== 0) {
        return list.filter((a) => a.villageNo === villageNo);
      }
      return list;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  }

  getAppointmentsByPerson(personId: string): Appointment[] {
    return this.getAppointments()
      .filter((a) => a.personId === personId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getUpcomingAppointments(daysAhead: number = 7, villageNo?: number): Appointment[] {
    const list = this.getAppointments(villageNo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureLimit = new Date(today);
    futureLimit.setDate(today.getDate() + daysAhead);
    futureLimit.setHours(23, 59, 59, 999);

    return list
      .filter((a) => {
        if (a.status !== 'upcoming') return false;
        const aptDate = new Date(a.date);
        return aptDate >= today && aptDate <= futureLimit;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  saveAppointment(appointment: Appointment): void {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === appointment.id);
    const now = new Date().toISOString();
    appointment.updatedAt = now;

    if (idx >= 0) {
      list[idx] = appointment;
      this.log('update', 'appointments', `อัปเดตนัดหมาย: ${appointment.title}`);
    } else {
      appointment.createdAt = now;
      list.push(appointment);
      this.log('create', 'appointments', `สร้างนัดหมายใหม่: ${appointment.title}`);
    }
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus): void {
    const list = this.getAppointments();
    const apt = list.find((a) => a.id === id);
    if (!apt) return;

    apt.status = status;
    apt.updatedAt = new Date().toISOString();
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
    this.log('update', 'appointments', `เปลี่ยนสถานะนัดหมาย ${apt.title} เป็น ${status}`);
  }

  deleteAppointment(id: string): void {
    const list = this.getAppointments();
    const target = list.find((a) => a.id === id);
    if (!target) return;

    const filtered = list.filter((a) => a.id !== id);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(filtered));

    this.addTombstone('appointments', target.villageNo, id);
    this.log('delete', 'appointments', `ลบนัดหมาย: ${target.title}`);
  }

  // --- Tombstones & Sync ---
  private addTombstone(collection: Tombstone['collection'], villageNo: number, id: string) {
    try {
      const list: Tombstone[] = JSON.parse(localStorage.getItem(KEYS.TOMBSTONES) || '[]');
      list.push({
        id,
        collection,
        villageNo,
        deletedAt: new Date().toISOString(),
      });
      localStorage.setItem(KEYS.TOMBSTONES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to add tombstone', e);
    }
  }

  getTombstones(): Tombstone[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.TOMBSTONES) || '[]');
    } catch {
      return [];
    }
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    } catch {
      return [];
    }
  }

  log(action: AuditLog['action'], collection: string, details: string, user: string = 'อสม. ประจำการ') {
    try {
      const list: AuditLog[] = this.getAuditLogs();
      list.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        action,
        collection,
        details,
        user,
      });
      // Keep last 100 logs
      localStorage.setItem(KEYS.LOGS, JSON.stringify(list.slice(0, 100)));
    } catch (e) {
      console.error('Log error', e);
    }
  }

  // --- Full Export & Import ---
  exportAllData() {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      villages: this.getVillages(),
      vhvMembers: this.getVhvMembers(),
      households: this.getHouseholds(),
      persons: this.getPersons(),
      screenings: this.getScreenings(),
      appointments: this.getAppointments(),
      tombstones: this.getTombstones(),
    };
  }

  importAllData(payload: any) {
    if (!payload || !payload.households || !payload.persons) {
      throw new Error('โครงสร้างไฟล์ข้อมูลไม่ถูกต้อง');
    }
    if (payload.villages) localStorage.setItem(KEYS.VILLAGES, JSON.stringify(payload.villages));
    if (payload.vhvMembers) localStorage.setItem(KEYS.VHV_MEMBERS, JSON.stringify(payload.vhvMembers));
    if (payload.households) localStorage.setItem(KEYS.HOUSEHOLDS, JSON.stringify(payload.households));
    if (payload.persons) localStorage.setItem(KEYS.PERSONS, JSON.stringify(payload.persons));
    if (payload.screenings) localStorage.setItem(KEYS.SCREENINGS, JSON.stringify(payload.screenings));
    if (payload.appointments) localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(payload.appointments));
    
    this.log('import', 'system', `นำเข้าข้อมูลสำรองทั้งหมดสำเร็จ (${payload.persons.length} ประชากร, ${payload.households.length} ครัวเรือน)`);
    return true;
  }

  resetToDefault() {
    localStorage.clear();
    this.initDefaults();
    this.log('create', 'system', 'รีเซ็ตข้อมูลสู่ค่าเริ่มต้นระบบ');
  }
}

export const storage = new StorageService();
