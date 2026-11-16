# Request Plan: Smosm2 (Smart OSM Next)

Repo: watcharapongpuangjamp-del/Smosm2

**ขอบเขตที่ตรวจแล้ว:** README, package.json, db.ts, storage.ts, vite.config.ts, build-apk.yml, firebase-applet-config.json, android/app/build.gradle

**ยังไม่ได้ตรวจ:** App.tsx, components, schema.ts (ควรตรวจก่อนเริ่มงาน 2.2 และ 3.5)

---

## Phase 1: หยุดข้อมูลสูญหายและพฤติกรรมปลอม (ทำก่อน)

| # | งาน | เกณฑ์ผ่าน |
|---|---|---|
| 1.1 | แก้ `importAllData`: validate ไฟล์ → backup ก่อน → ใช้ transaction → ค่อย clear และ insert | ไฟล์เสียแล้วข้อมูลเดิมยังอยู่ครบ |
| 1.2 | ลบ `Math.random()` ใน `processBackgroundSync` แล้วเลือกอย่างใดอย่างหนึ่ง: ต่อ Firestore จริง หรือแสดงสถานะ "ยังไม่ซิงค์ (ออฟไลน์)" | ไม่มี log "ซิงค์สำเร็จ" ที่ไม่ได้ส่งข้อมูลจริง |
| 1.3 | แยก mock data ออกจาก production (ใช้เฉพาะ dev build) และเลิกใช้ `INSERT OR REPLACE` ใน migration | เครื่องใหม่ไม่มีข้อมูลปลอม และ migration ไม่ทับข้อมูลจริง |
| 1.4 | ครอบ migration ด้วย transaction | ล้มกลางทางแล้วไม่เหลือข้อมูลครึ่งๆ |

## Phase 2: Security / PDPA

| # | งาน | เกณฑ์ผ่าน |
|---|---|---|
| 2.1 | เปิดเข้ารหัส SQLite (SQLCipher ของ `@capacitor-community/sqlite`) โดยเก็บ key ใน Android Keystore | ไฟล์ DB เปิดอ่านตรงๆ ไม่ได้ |
| 2.2 | เพิ่ม login / PIN และใส่ user จริงใน audit log | log ระบุตัวผู้ใช้ได้ |
| 2.3 | ตรวจ Firestore Rules และเปิด App Check, ตรวจข้อจำกัดของ Firebase API key | ผู้ไม่ได้ล็อกอินอ่านหรือเขียนไม่ได้ |
| 2.4 | ลบ `firebase-admin` ออกจาก dependencies ฝั่ง client | bundle ไม่มี server SDK |
| 2.5 | เปลี่ยน `xlsx` เป็น build ที่ SheetJS แจกจ่ายนอก npm (หรือ lib อื่น) | ไม่มี vulnerability ใน audit |
| 2.6 | ตั้ง `allowBackup=false` (หรือกำหนดกฎ backup) และเพิ่มคำเตือนตอน export | ข้อมูลสุขภาพไม่ถูกสำรองขึ้น Google โดยไม่ตั้งใจ |

## Phase 3: Data integrity

| # | งาน |
|---|---|
| 3.1 | `deleteHousehold` ให้ cascade ไปที่ persons, screenings, appointments และล้าง `assignedHouseIds` |
| 3.2 | แก้ `deleteAppointment` ที่ไม่ลบเมื่อ `villageNo` เป็น 0 หรือ null |
| 3.3 | ทำ `saveScreening` + update person ให้เป็น transaction เดียว |
| 3.4 | เพิ่ม index (`villageNo`, `householdId`, `personId`) และระบบ schema versioning/migration |
| 3.5 | รวม schema เหลือที่เดียว (drizzle หรือ raw SQL) และทำ helper กลางแทน INSERT ที่ copy 3 ที่ |
| 3.6 | export/import ให้ครบคู่กัน (logs) และ debounce `saveToWebStore()` |

## Phase 4: CI/CD

| # | งาน |
|---|---|
| 4.1 | ถ้าไม่มี keystore secrets ให้ release job **fail** แทนการสร้าง key สุ่มและใช้รหัสผ่านที่ฝังในไฟล์ |
| 4.2 | เอา fallback ไป `assembleDebug` ออก และเอา `\|\| true` ที่ปิดบัง error ออก |
| 4.3 | เลิก `@latest` แล้ว pin ตาม lockfile และใช้ `npm ci` |
| 4.4 | เอา `chmod -R 777` ออก และลด permissions ของ workflow ให้เหลือเท่าที่ใช้ |
| 4.5 | เปิด `minifyEnabled` สำหรับ release (พร้อม proguard rules) |

## Phase 5: Cleanup

- แก้ `allowedHosts: true` และเปิด HMR กลับมา
- PWA: ใช้ไอคอน PNG 192/512 จริง และใช้ชื่อแอปเดียวกันทุกที่
- เลือกไลบรารีแผนที่ตัวเดียว (Leaflet หรือ Google Maps)
- ลบ lockfile ที่ไม่ใช้ (`bun.lock` หรือ `package-lock.json`)

---

## ลำดับและประเมินแรงงาน

1. Phase 1: ประมาณ 1–2 วัน
2. Phase 4.1–4.2: ประมาณ 0.5 วัน
3. Phase 2: ประมาณ 3–5 วัน (2.1 และ 2.2 ใช้เวลามากสุด)
4. Phase 3: ประมาณ 2–3 วัน
5. Phase 4 ที่เหลือและ Phase 5: ประมาณ 1–2 วัน
