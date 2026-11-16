import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private manualTransactionActive = false;

  /**
   * Initializes the database connection.
   * Handles platform-specific setup (Web/Native).
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const platform = Capacitor.getPlatform();
        
        // Web specific initialization: requires jeep-sqlite component
        if (platform === 'web') {
          if (!document.querySelector('jeep-sqlite')) {
            const jeepSqlite = document.createElement('jeep-sqlite');
            document.body.appendChild(jeepSqlite);
            await customElements.whenDefined('jeep-sqlite');
          }
          await this.sqlite.initWebStore();
        }

        const databaseName = 'smart_osm_db';

        // Capacitor's native plugin keeps a connection registry outside this service.
        // Reuse a registered connection after retries/app re-entry instead of creating
        // a second connection with the same name (which throws "already exists").
        const getOrCreateConnection = async (encrypted: boolean, mode: string) => {
          const consistency = (await this.sqlite.checkConnectionsConsistency()).result;
          let connectionExists = (await this.sqlite.isConnection(databaseName, false)).result;

          if (consistency && connectionExists) {
            return this.sqlite.retrieveConnection(databaseName, false);
          }

          // A stale JS/native registry entry can survive a failed initialization.
          // Remove only this database connection (never the database file/data) before
          // creating a replacement, otherwise createConnection throws "already exists".
          if (connectionExists) {
            await this.sqlite.closeConnection(databaseName, false);
            connectionExists = (await this.sqlite.isConnection(databaseName, false)).result;
            if (connectionExists) {
              throw new Error(`พบ Connection ${databaseName} ค้างอยู่และไม่สามารถปิดได้ จึงหยุดเพื่อป้องกันการแตะต้องข้อมูลเดิม`);
            }
          }

          return this.sqlite.createConnection(databaseName, encrypted, mode, 1, false);
        };

        if (platform === 'web') {
          // SQLCipher is not supported by the Web/WASM implementation.
          this.db = this.db ?? await getOrCreateConnection(false, 'no-encryption');
        } else {
          const encryptionConfigured = (await this.sqlite.isInConfigEncryption()).result;
          if (!encryptionConfigured) {
            throw new Error('SQLCipher is not enabled in the native Capacitor configuration.');
          }

          const databaseExists = (await this.sqlite.isDatabase(databaseName)).result;
          const databaseEncrypted = databaseExists
            ? (await this.sqlite.isDatabaseEncrypted(databaseName)).result
            : false;
          const secretStored = (await this.sqlite.isSecretStored()).result;

          // Never generate a replacement key for an encrypted database: doing so would
          // permanently prevent access to the existing records.
          if (databaseExists && databaseEncrypted && !secretStored) {
            throw new Error('พบฐานข้อมูลที่เข้ารหัสแล้ว แต่ไม่พบกุญแจใน Secure Storage ข้อมูลเดิมถูกเก็บไว้และยังไม่ถูกลบ');
          }

          if (!secretStored) {
            const randomBytes = crypto.getRandomValues(new Uint8Array(32));
            const passphrase = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
            await this.sqlite.setEncryptionSecret(passphrase);
          }

          // "encryption" migrates an existing plaintext DB; "secret" creates or opens
          // an already-encrypted DB using the key stored by the native SQLite plugin.
          const encryptionMode = databaseExists && !databaseEncrypted ? 'encryption' : 'secret';
          this.db = this.db ?? await getOrCreateConnection(true, encryptionMode);
        }

        await this.db.open();

        // Initialize table structures
        await this.createTables();

        this.isInitialized = true;
        console.log('SQLite Database Initialized successfully');
      } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Defines and creates the required database tables if they don't exist.
   */
  private async createTables(): Promise<void> {
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
      );`,
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT,
        collection TEXT,
        payload TEXT,
        timestamp TEXT
      );`
    ];

    for (const query of queries) {
      await this.db.execute(query);
    }
  }

  /**
   * Executes a SELECT query and returns the results.
   */
  async query(statement: string, values?: any[]) {
    if (!this.db) await this.init();
    return await this.db!.query(statement, values);
  }

  /**
   * Executes an INSERT, UPDATE, or DELETE query with bound values.
   */
  async run(statement: string, values?: any[]) {
    if (!this.db) await this.init();
    return await this.db!.run(statement, values, !this.manualTransactionActive);
  }

  /**
   * Executes one or more raw SQL statements (separated by semicolons).
   */
  async execute(statement: string) {
    if (!this.db) await this.init();
    return await this.db!.execute(statement, !this.manualTransactionActive);
  }

  /** Begin an explicit transaction; statements inside it must not auto-commit. */
  async beginTransaction(): Promise<void> {
    if (!this.db) await this.init();
    if (this.manualTransactionActive) {
      throw new Error('มี Transaction ทำงานอยู่แล้ว');
    }
    await this.db!.beginTransaction();
    const active = (await this.db!.isTransactionActive()).result;
    if (!active) throw new Error('ไม่สามารถเริ่ม SQLite Transaction ได้');
    this.manualTransactionActive = true;
  }

  async commitTransaction(): Promise<void> {
    if (!this.db || !this.manualTransactionActive) {
      throw new Error('ไม่มี SQLite Transaction ที่เปิดอยู่เพื่อ Commit');
    }
    try {
      await this.db.commitTransaction();
    } finally {
      this.manualTransactionActive = false;
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.db || !this.manualTransactionActive) return;
    try {
      const active = (await this.db.isTransactionActive()).result;
      if (active) await this.db.rollbackTransaction();
    } finally {
      this.manualTransactionActive = false;
    }
  }

  /**
   * Persists the database to IndexedDB (Web environment only).
   */
  async saveToWebStore(): Promise<void> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      await this.sqlite.saveToStore('smart_osm_db');
    }
  }

  /**
   * Closes the database connection and clears internal state.
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection('smart_osm_db', false);
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const dbService = new DatabaseService();
