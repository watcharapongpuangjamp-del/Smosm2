import { pgTable, text, integer, real, boolean } from 'drizzle-orm/pg-core';

export const villages = pgTable('villages', {
  id: text('id').primaryKey(),
  no: integer('no').notNull(),
  name: text('name').notNull(),
  subdistrict: text('subdistrict').notNull(),
  district: text('district').notNull(),
  province: text('province').notNull(),
  centerLat: real('center_lat').notNull(),
  centerLng: real('center_lng').notNull(),
});

export const vhvMembers = pgTable('vhv_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  citizenId: text('citizen_id').notNull(),
  phone: text('phone').notNull(),
  villageNo: integer('village_no').notNull(),
  zoneName: text('zone_name').notNull(),
  assignedHouseIds: text('assigned_house_ids').notNull(), // JSON string array
  isActive: boolean('is_active').notNull(),
  registeredDate: text('registered_date').notNull(),
});

export const households = pgTable('households', {
  id: text('id').primaryKey(),
  houseNo: text('house_no').notNull(),
  villageNo: integer('village_no').notNull(),
  villageName: text('village_name').notNull(),
  subdistrict: text('subdistrict').notNull(),
  district: text('district').notNull(),
  province: text('province').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  headOfHouseholdName: text('head_of_household_name').notNull(),
  vhvMemberId: text('vhv_member_id').notNull(),
  sanitationRating: text('sanitation_rating').notNull(), // 'good' | 'fair' | 'poor'
  mosquitoLarvaFound: boolean('mosquito_larva_found').notNull(),
  waterSource: text('water_source').notNull(),
  wasteManagement: text('waste_management').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const persons = pgTable('persons', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull(),
  villageNo: integer('village_no').notNull(),
  citizenId: text('citizen_id').notNull(),
  title: text('title').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  gender: text('gender').notNull(), // 'male' | 'female'
  birthDate: text('birth_date').notNull(),
  birthDatePrecision: text('birth_date_precision'),
  bloodGroup: text('blood_group').notNull(),
  phone: text('phone'),
  occupation: text('occupation'),
  residentStatus: text('resident_status').notNull(),
  careCategory: text('care_category').notNull(), // 'active' | 'homebound' | 'bedridden'
  chronicDiseases: text('chronic_diseases').notNull(), // JSON string array
  weightKg: real('weight_kg'),
  heightCm: real('height_cm'),
  bmi: real('bmi'),
  systolic: integer('systolic'),
  diastolic: integer('diastolic'),
  bloodSugarDtx: integer('blood_sugar_dtx'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const screenings = pgTable('screenings', {
  id: text('id').primaryKey(),
  personId: text('person_id').notNull(),
  householdId: text('household_id').notNull(),
  villageNo: integer('village_no').notNull(),
  date: text('date').notNull(),
  vhvMemberId: text('vhv_member_id').notNull(),
  weightKg: real('weight_kg').notNull(),
  heightCm: real('height_cm').notNull(),
  bmi: real('bmi').notNull(),
  systolic: integer('systolic').notNull(),
  diastolic: integer('diastolic').notNull(),
  pulse: integer('pulse'),
  bloodSugarDtx: integer('blood_sugar_dtx'),
  waistCm: real('waist_cm'),
  smoker: boolean('smoker').notNull(),
  alcohol: boolean('alcohol').notNull(),
  notes: text('notes'),
  advice: text('advice'),
  needDoctorReferral: boolean('need_doctor_referral').notNull(),
  createdAt: text('created_at').notNull(),
});

export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  personId: text('person_id').notNull(),
  householdId: text('household_id').notNull(),
  villageNo: integer('village_no').notNull(),
  vhvMemberId: text('vhv_member_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  date: text('date').notNull(),
  time: text('time'),
  location: text('location').notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
