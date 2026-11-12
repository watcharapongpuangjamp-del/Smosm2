import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    try {
      const platform = Capacitor.getPlatform();
      
      // Web specific initialization
      if (platform === 'web') {
        const jeepSqlite = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepSqlite);
        await customElements.whenDefined('jeep-sqlite');
        await this.sqlite.initWebStore();
      }

      // Create or open the database
      this.db = await this.sqlite.createConnection(
        'smart_osm_db',
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      console.log('SQLite Database Initialized');
    } catch (err) {
      console.error('Database initialization error:', err);
      throw err;
    }
  }

  private async createTables() {
    if (!this.db) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS villages (
        id TEXT PRIMARY KEY,
        no INTEGER,
        name TEXT,
        subdistrict TEXT,
        district TEXT,
        province TEXT,
        centerLat REAL,
        centerLng REAL
      );`,
      `CREATE TABLE IF NOT EXISTS vhv_members (
        id TEXT PRIMARY KEY,
        name TEXT,
        citizenId TEXT,
        phone TEXT,
        villageNo INTEGER,
        zoneName TEXT,
        assignedHouseIds TEXT,
        isActive INTEGER,
        registeredDate TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        houseNo TEXT,
        villageNo INTEGER,
        villageName TEXT,
        subdistrict TEXT,
        district TEXT,
        province TEXT,
        latitude REAL,
        longitude REAL,
        headOfHouseholdName TEXT,
        vhvMemberId TEXT,
        sanitationRating TEXT,
        mosquitoLarvaFound INTEGER,
        waterSource TEXT,
        wasteManagement TEXT,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS persons (
        id TEXT PRIMARY KEY,
        householdId TEXT,
        villageNo INTEGER,
        citizenId TEXT,
        title TEXT,
        firstName TEXT,
        lastName TEXT,
        gender TEXT,
        birthDate TEXT,
        birthDatePrecision TEXT,
        bloodGroup TEXT,
        phone TEXT,
        occupation TEXT,
        residentStatus TEXT,
        careCategory TEXT,
        chronicDiseases TEXT,
        weightKg REAL,
        heightCm REAL,
        bmi REAL,
        systolic INTEGER,
        diastolic INTEGER,
        bloodSugarDtx INTEGER,
        createdAt TEXT,
        updatedAt TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS screenings (
        id TEXT PRIMARY KEY,
        personId TEXT,
        householdId TEXT,
        villageNo INTEGER,
        date TEXT,
        vhvMemberId TEXT,
        weightKg REAL,
        heightCm REAL,
        bmi REAL,
        systolic INTEGER,
        diastolic INTEGER,
        pulse INTEGER,
        bloodSugarDtx INTEGER,
        waistCm REAL,
        smoker INTEGER,
        alcohol INTEGER,
        notes TEXT,
        advice TEXT,
        needDoctorReferral INTEGER,
        createdAt TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        personId TEXT,
        householdId TEXT,
        villageNo INTEGER,
        vhvMemberId TEXT,
        title TEXT,
        type TEXT,
        date TEXT,
        time TEXT,
        location TEXT,
        status TEXT,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS tombstones (
        id TEXT,
        collection TEXT,
        villageNo INTEGER,
        deletedAt TEXT,
        PRIMARY KEY (id, collection)
      );`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        action TEXT,
        collection TEXT,
        details TEXT,
        user TEXT
      );`
    ];

    for (const query of queries) {
      await this.db.execute(query);
    }
  }

  async query(statement: string, values?: any[]) {
    if (!this.db) await this.init();
    return await this.db!.query(statement, values);
  }

  async run(statement: string, values?: any[]) {
    if (!this.db) await this.init();
    return await this.db!.run(statement, values);
  }

  async execute(statement: string) {
    if (!this.db) await this.init();
    return await this.db!.execute(statement);
  }

  async saveToWebStore() {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      await this.sqlite.saveToStore('smart_osm_db');
    }
  }
}

export const dbService = new DatabaseService();
